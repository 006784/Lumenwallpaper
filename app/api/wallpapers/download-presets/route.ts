import { jsonSuccess } from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { listWallpaperDevicePresets } from "@/lib/wallpaper-device-presets";

export async function GET() {
  return jsonSuccess(
    {
      groups: listWallpaperDevicePresets(),
    },
    {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper device presets loaded.",
    },
  );
}
