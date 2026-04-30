import { ZodError } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import {
  batchUpdateWallpapers,
  batchUpdateWallpapersSchema,
} from "@/lib/wallpapers";

export async function PATCH(request: Request) {
  const logger = createRouteLogger("/api/wallpapers/batch", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before updating wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  if (!isEditorUser(currentUser)) {
    return jsonError("Only editor accounts can batch review wallpapers.", {
      status: 403,
      code: "WALLPAPER_BATCH_MODERATION_FORBIDDEN",
    });
  }

  try {
    const payload = batchUpdateWallpapersSchema.parse(await request.json());

    logger.start({
      count: payload.wallpaperIds.length,
      editorId: String(currentUser.id),
      status: payload.status ?? null,
    });

    const result = await batchUpdateWallpapers(payload);

    logger.done("wallpapers.batch_update.completed", {
      editorId: String(currentUser.id),
      requested: result.requestedCount,
      updated: result.updatedCount,
    });

    return jsonSuccess(result, {
      message: "Wallpapers updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid batch wallpaper update payload.", {
        status: 400,
        code: "INVALID_BATCH_WALLPAPER_UPDATE_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers/batch",
      tags: {
        method: "PATCH",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to update wallpapers.",
      {
        status: 500,
        code: "BATCH_WALLPAPER_UPDATE_FAILED",
      },
    );
  }
}
