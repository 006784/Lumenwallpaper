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
  batchRenameWallpapers,
  batchRenameWallpapersSchema,
} from "@/lib/wallpapers";

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers/rename", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/rename",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = batchRenameWallpapersSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      strategy: payload.strategy,
      requested:
        payload.strategy === "explicit"
          ? payload.items?.length ?? 0
          : payload.wallpaperIds?.length ?? 0,
    });
    const result = await batchRenameWallpapers(payload);

    logger.done("openclaw.wallpapers.batch_rename.completed", {
      actor: auth.actor,
      updated: result.updatedCount,
    });

    return jsonSuccess(result, {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpapers renamed.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid batch rename payload.", {
        status: 400,
        code: "INVALID_BATCH_RENAME_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/wallpapers/rename",
      tags: {
        method: "POST",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to rename wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_BATCH_RENAME_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
