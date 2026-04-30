import { jsonSuccess } from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getLocaleResponseHeaders, getRequestLocale } from "@/lib/i18n";
import { listWallpaperDevicePresets } from "@/lib/wallpaper-device-presets";

export async function GET(request: Request) {
  const locale = getRequestLocale(request);

  return jsonSuccess(
    {
      groups: listWallpaperDevicePresets(locale),
    },
    {
      headers: {
        ...getPublicApiCacheHeaders(true),
        ...getLocaleResponseHeaders(locale),
      },
      message: "Wallpaper device presets loaded.",
    },
  );
}
