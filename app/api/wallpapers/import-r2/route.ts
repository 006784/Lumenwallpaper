import { z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import {
  importR2CandidatesToWallpapers,
  scanR2ImportCandidates,
} from "@/lib/wallpapers";

const r2ImportQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  prefix: z.string().trim().max(255).optional(),
});

const r2ImportBodySchema = z.object({
  creatorUsername: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .optional(),
  limit: z.number().int().positive().max(100).optional(),
  prefix: z.string().trim().max(255).optional(),
});

function ensureEditorAccess(request: Request) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before importing from R2.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  if (!isEditorUser(currentUser)) {
    return jsonError("Only editor accounts can import R2 objects.", {
      status: 403,
      code: "R2_IMPORT_FORBIDDEN",
    });
  }

  return currentUser;
}

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/wallpapers/import-r2", request);
  const currentUser = ensureEditorAccess(request);

  if (currentUser instanceof Response) {
    return currentUser;
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
    });
  }

  logger.start({
    action: "scan",
    limit: parsed.data.limit ?? null,
    prefix: parsed.data.prefix ?? null,
    userId: currentUser.id,
  });

  try {
    const summary = await scanR2ImportCandidates(parsed.data);

    logger.done("r2.import.scan.completed", {
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      message: "R2 scan completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/import-r2",
      tags: {
        action: "scan",
      },
    });

    return jsonError("Failed to scan R2 objects.", {
      status: 500,
      code: "R2_IMPORT_SCAN_FAILED",
    });
  }
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/wallpapers/import-r2", request);
  const currentUser = ensureEditorAccess(request);

  if (currentUser instanceof Response) {
    return currentUser;
  }

  let body: z.infer<typeof r2ImportBodySchema>;

  try {
    const parsed = r2ImportBodySchema.safeParse(await request.json());

    if (!parsed.success) {
      return jsonError("Invalid R2 import payload.", {
        status: 400,
        code: "INVALID_BODY",
        details: formatZodError(parsed.error),
      });
    }

    body = parsed.data;
  } catch {
    return jsonError("Invalid R2 import payload.", {
      status: 400,
      code: "INVALID_BODY",
    });
  }

  logger.start({
    action: "import",
    creatorUsername: body.creatorUsername ?? null,
    limit: body.limit ?? null,
    prefix: body.prefix ?? null,
    userId: currentUser.id,
  });

  try {
    const summary = await importR2CandidatesToWallpapers(body);

    logger.done("r2.import.completed", {
      failedCount: summary.failedCount,
      importedCount: summary.importedCount,
      pendingCount: summary.pendingCount,
      scannedCount: summary.scannedCount,
    });

    return jsonSuccess(summary, {
      message: "R2 import completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/import-r2",
      tags: {
        action: "import",
      },
    });

    return jsonError("Failed to import R2 objects.", {
      status: 500,
      code: "R2_IMPORT_FAILED",
    });
  }
}
