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
  batchUpdateWallpapers,
  batchUpdateWallpapersSchema,
} from "@/lib/wallpapers";

export async function PATCH(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers/batch", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/batch",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = batchUpdateWallpapersSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      count: payload.wallpaperIds.length,
      status: payload.status ?? null,
    });
    const result = await batchUpdateWallpapers(payload);

    logger.done("openclaw.wallpapers.batch_update.completed", {
      actor: auth.actor,
      updated: result.updatedCount,
    });

    return jsonSuccess(result, {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpapers updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid batch wallpaper update payload.", {
        status: 400,
        code: "INVALID_BATCH_WALLPAPER_UPDATE_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/wallpapers/batch",
      tags: {
        method: "PATCH",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to update wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_BATCH_WALLPAPER_UPDATE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
