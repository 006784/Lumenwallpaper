import {
  captureServerException,
  createRouteLogger,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedCreatorPageSnapshot } from "@/lib/public-wallpaper-cache";

type CreatorRouteContext = {
  params: {
    username: string;
  };
};

export async function GET(request: Request, context: CreatorRouteContext) {
  const username = context.params.username?.trim() ?? "";
  const logger = createRouteLogger("/api/creator/[username]", request);

  if (!username) {
    return jsonError("Creator username is required.", {
      status: 400,
      code: "CREATOR_USERNAME_REQUIRED",
      headers: getPublicApiCacheHeaders(false),
    });
  }

  try {
    logger.start({
      username,
    });

    const snapshot = await getCachedCreatorPageSnapshot(username);

    if (!snapshot) {
      logger.done("creator.snapshot.missing", {
        username,
      });

      return jsonError("Creator not found.", {
        status: 404,
        code: "CREATOR_NOT_FOUND",
        headers: getPublicApiCacheHeaders(false),
      });
    }

    logger.done("creator.snapshot.loaded", {
      username: snapshot.creator.username,
      wallpaperCount: snapshot.stats.totalWallpapers,
    });

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "Creator snapshot loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      message: "Failed to load creator snapshot.",
      route: "/api/creator/[username]",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to load creator snapshot.",
      {
        status: 500,
        code: "CREATOR_SNAPSHOT_FAILED",
      },
    );
  }
}
