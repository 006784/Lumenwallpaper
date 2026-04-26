import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedWallpaperTrustSnapshot } from "@/lib/public-wallpaper-cache";

type WallpaperTrustRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: WallpaperTrustRouteProps,
) {
  try {
    const snapshot = await getCachedWallpaperTrustSnapshot(params.id);

    if (!snapshot) {
      return jsonError("Wallpaper not found.", {
        headers: getPublicApiCacheHeaders(false),
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper trust information loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/trust",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load wallpaper trust information.", {
      status: 500,
      code: "WALLPAPER_TRUST_LOAD_FAILED",
    });
  }
}
