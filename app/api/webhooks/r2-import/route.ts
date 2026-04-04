import { z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getR2ImportSyncConfig,
  getR2ImportWebhookSecret,
  runR2ImportSync,
} from "@/lib/r2-import-sync";
import { isR2Configured } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

const r2ImportWebhookBodySchema = z.object({
  creatorUsername: z.string().trim().min(1).max(64).optional(),
  limit: z.number().int().positive().max(100).optional(),
  prefix: z.string().trim().max(255).optional(),
  objects: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(1024),
        size: z.number().int().nonnegative(),
        lastModified: z.string().trim().datetime().nullable().optional(),
      }),
    )
    .max(100)
    .optional(),
});

function ensureWebhookAccess(request: Request) {
  const secret = getR2ImportWebhookSecret();

  if (!secret) {
    return jsonError("R2_IMPORT_WEBHOOK_SECRET is not configured.", {
      status: 503,
      code: "WEBHOOK_NOT_CONFIGURED",
    });
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return jsonError("Unauthorized webhook request.", {
      status: 401,
      code: "WEBHOOK_UNAUTHORIZED",
    });
  }

  return null;
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/webhooks/r2-import", request);
  const unauthorizedResponse = ensureWebhookAccess(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  if (!isSupabaseConfigured()) {
    return jsonError("Supabase is not configured.", {
      status: 503,
      code: "SUPABASE_NOT_CONFIGURED",
    });
  }

  if (!isR2Configured()) {
    return jsonError("R2 is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
    });
  }

  let body: z.infer<typeof r2ImportWebhookBodySchema> = {};

  try {
    const rawBody = await request.text();

    if (rawBody.trim().length > 0) {
      const parsed = r2ImportWebhookBodySchema.safeParse(JSON.parse(rawBody));

      if (!parsed.success) {
        return jsonError("Invalid R2 import webhook payload.", {
          status: 400,
          code: "INVALID_BODY",
          details: formatZodError(parsed.error),
        });
      }

      body = parsed.data;
    }
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid R2 import webhook payload.",
      {
        status: 400,
        code: "INVALID_BODY",
      },
    );
  }

  const syncConfig = getR2ImportSyncConfig();
  const resolvedConfig = {
    creatorUsername: body.creatorUsername?.trim() || syncConfig.creatorUsername,
    limit: body.limit ?? syncConfig.limit,
    prefix: body.prefix?.trim() || syncConfig.prefix,
  };

  logger.start({
    action: "webhook-import",
    creatorUsername: resolvedConfig.creatorUsername,
    limit: resolvedConfig.limit,
    objectCount: body.objects?.length ?? 0,
    prefix: resolvedConfig.prefix ?? null,
  });

  try {
    const summary = await runR2ImportSync({
      ...resolvedConfig,
      objects: body.objects?.map((object) => ({
        key: object.key,
        size: object.size,
        lastModified: object.lastModified ?? null,
      })),
    });

    logger.done("r2.import.webhook.completed", {
      failedCount: summary.failedCount,
      importedCount: summary.importedCount,
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      message: "Webhook R2 import completed.",
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/webhooks/r2-import",
      tags: {
        action: "webhook-import",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to import R2 objects via webhook.",
      {
        status: 500,
        code: "R2_IMPORT_WEBHOOK_FAILED",
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  }
}
