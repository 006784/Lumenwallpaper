import { captureServerException, jsonError, jsonSuccess } from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getLocaleResponseHeaders, getRequestLocale } from "@/lib/i18n";
import { getCachedWallpaperSeoSnapshot } from "@/lib/public-wallpaper-cache";

type WallpaperSeoRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: WallpaperSeoRouteProps,
) {
  const locale = getRequestLocale(request);

  try {
    const snapshot = await getCachedWallpaperSeoSnapshot(params.id, locale);

    if (!snapshot) {
      return jsonError("Wallpaper not found.", {
        headers: {
          ...getPublicApiCacheHeaders(false),
          ...getLocaleResponseHeaders(locale),
        },
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(snapshot, {
      headers: {
        ...getPublicApiCacheHeaders(true),
        ...getLocaleResponseHeaders(locale),
      },
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
