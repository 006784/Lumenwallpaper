import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedWallpaperMotionSnapshot } from "@/lib/public-wallpaper-cache";

type WallpaperMotionRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: WallpaperMotionRouteProps,
) {
  try {
    const snapshot = await getCachedWallpaperMotionSnapshot(params.id);

    if (!snapshot) {
      return jsonError("Wallpaper not found.", {
        headers: getPublicApiCacheHeaders(false),
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper motion assets loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/motion",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load wallpaper motion assets.", {
      status: 500,
      code: "WALLPAPER_MOTION_LOAD_FAILED",
    });
  }
}
