import { z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";
import {
  importR2CandidatesToWallpapers,
  importSpecificR2ObjectsToWallpapers,
  scanR2ImportCandidates,
} from "@/lib/wallpapers";

const r2ImportQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  prefix: z.string().trim().max(255).optional(),
});

const r2ImportBodySchema = z.object({
  creatorUsername: z.string().trim().min(1).max(64).optional(),
  limit: z.number().int().positive().max(100).optional(),
  prefix: z.string().trim().max(255).optional(),
  objects: z
    .array(
      z.object({
        key: z.string().trim().min(1),
        size: z.number().int().min(0),
        lastModified: z.string().trim().datetime().nullable().optional(),
      }),
    )
    .max(200)
    .optional(),
});

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers/import-r2", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/import-r2",
  );

  if (auth instanceof Response) {
    return auth;
  }

  const params = new URL(request.url).searchParams;
  const parsed = r2ImportQuerySchema.safeParse({
    limit: params.get("limit") ?? undefined,
    prefix: params.get("prefix") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid R2 import query.", {
      status: 400,
      code: "INVALID_QUERY",
      details: formatZodError(parsed.error),
      headers: getOpenClawPrivateHeaders(),
    });
  }

  logger.start({
    actor: auth.actor,
    action: "scan",
    limit: parsed.data.limit ?? null,
    prefix: parsed.data.prefix ?? null,
  });

  try {
    const summary = await scanR2ImportCandidates(parsed.data);

    logger.done("openclaw.r2.import.scan.completed", {
      actor: auth.actor,
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      headers: getOpenClawPrivateHeaders(),
      message: "R2 scan completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/import-r2",
      tags: {
        action: "scan",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to scan R2 objects.",
      {
        status: 500,
        code: "OPENCLAW_R2_IMPORT_SCAN_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers/import-r2", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/import-r2",
  );

  if (auth instanceof Response) {
    return auth;
  }

  let body: z.infer<typeof r2ImportBodySchema>;

  try {
    const parsed = r2ImportBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return jsonError("Invalid R2 import payload.", {
        status: 400,
        code: "INVALID_BODY",
        details: formatZodError(parsed.error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    body = parsed.data;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid R2 import payload.",
      {
        status: 400,
        code: "INVALID_BODY",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }

  logger.start({
    actor: auth.actor,
    action: "import",
    creatorUsername: body.creatorUsername ?? null,
    limit: body.limit ?? null,
    prefix: body.prefix ?? null,
  });

  try {
    const summary = body.objects?.length
      ? await importSpecificR2ObjectsToWallpapers({
          creatorUsername: body.creatorUsername,
          objects: body.objects.map((object) => ({
            ...object,
            lastModified: object.lastModified ?? null,
          })),
        })
      : await importR2CandidatesToWallpapers(body);

    logger.done("openclaw.r2.import.completed", {
      actor: auth.actor,
      failedCount: summary.failedCount,
      importedCount: summary.importedCount,
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      headers: getOpenClawPrivateHeaders(),
      message: "R2 import completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/import-r2",
      tags: {
        action: "import",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to import R2 objects.",
      {
        status: 500,
        code: "OPENCLAW_R2_IMPORT_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
