import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedWallpaperExploreFacets } from "@/lib/public-wallpaper-cache";

export async function GET() {
  try {
    const facets = await getCachedWallpaperExploreFacets();

    return jsonSuccess(facets, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper explore facets loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/facets",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load wallpaper explore facets.", {
      status: 500,
      code: "WALLPAPER_FACETS_LOAD_FAILED",
    });
  }
}
