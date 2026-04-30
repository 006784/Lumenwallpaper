import { captureServerException, jsonError, jsonSuccess } from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getLocaleResponseHeaders, getRequestLocale } from "@/lib/i18n";
import { getCachedWallpaperExploreFacets } from "@/lib/public-wallpaper-cache";

export async function GET(request: Request) {
  const locale = getRequestLocale(request);

  try {
    const facets = await getCachedWallpaperExploreFacets(locale);

    return jsonSuccess(facets, {
      headers: {
        ...getPublicApiCacheHeaders(true),
        ...getLocaleResponseHeaders(locale),
      },
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
