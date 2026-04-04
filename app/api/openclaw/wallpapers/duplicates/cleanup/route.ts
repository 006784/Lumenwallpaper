import { ZodError } from "zod";

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
  cleanupDuplicateWallpapers,
  cleanupDuplicateWallpapersSchema,
} from "@/lib/wallpapers";

export async function POST(request: Request) {
  const logger = createRouteLogger(
    "/api/openclaw/wallpapers/duplicates/cleanup",
    request,
  );
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/duplicates/cleanup",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = cleanupDuplicateWallpapersSchema.parse(await request.json());

    logger.start({
      actor: auth.actor,
      creator: payload.creator ?? null,
      dryRun: payload.dryRun,
      keep: payload.keep,
      limit: payload.limit ?? null,
      reason: payload.reason,
    });

    const result = await cleanupDuplicateWallpapers(payload);

    logger.done("openclaw.wallpapers.duplicates.cleanup.completed", {
      actor: auth.actor,
      deleted: result.deletedCount,
      dryRun: result.dryRun,
      groups: result.processedGroupCount,
    });

    return jsonSuccess(result, {
      headers: getOpenClawPrivateHeaders(),
      message: payload.dryRun
        ? "Duplicate cleanup dry-run completed."
        : "Duplicate wallpapers cleaned up.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid duplicate cleanup payload.", {
        status: 400,
        code: "INVALID_DUPLICATE_CLEANUP_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/wallpapers/duplicates/cleanup",
      tags: {
        method: "POST",
      },
    });

    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to clean up duplicate wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_DUPLICATE_CLEANUP_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
