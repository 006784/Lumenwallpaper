import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedWallpaperSeoSnapshot } from "@/lib/public-wallpaper-cache";

type WallpaperSeoRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: WallpaperSeoRouteProps,
) {
  try {
    const snapshot = await getCachedWallpaperSeoSnapshot(params.id);

    if (!snapshot) {
      return jsonError("Wallpaper not found.", {
        headers: getPublicApiCacheHeaders(false),
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper SEO information loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/seo",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load wallpaper SEO information.", {
      status: 500,
      code: "WALLPAPER_SEO_LOAD_FAILED",
    });
  }
}
