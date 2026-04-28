import {
  captureServerException,
  jsonError,
} from "@/lib/api";
import {
  buildFallbackWallpaperSvg,
  isFallbackWallpaperStoragePath,
} from "@/lib/fallback-wallpaper-assets";
import {
  getWallpaperDownloadFileByVariant,
  getWallpaperGradientKey,
} from "@/lib/wallpaper-presenters";
import { getPublishedWallpaperByIdOrSlug } from "@/lib/wallpapers";
import type { WallpaperVariant } from "@/types/wallpaper";

type WallpaperFallbackRouteProps = {
  params: {
    id: string;
  };
};

const FALLBACK_VARIANTS = new Set<WallpaperVariant>([
  "preview",
  "thumb",
  "4k",
  "original",
]);

export async function GET(
  request: Request,
  { params }: WallpaperFallbackRouteProps,
) {
  try {
    const wallpaper = await getPublishedWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    const requestedVariant = new URL(request.url).searchParams.get(
      "variant",
    ) as WallpaperVariant | null;
    const variant =
      requestedVariant && FALLBACK_VARIANTS.has(requestedVariant)
        ? requestedVariant
        : "preview";
    const file = getWallpaperDownloadFileByVariant(wallpaper, variant);

    if (!file || !isFallbackWallpaperStoragePath(file.storagePath)) {
      return jsonError("Fallback preview not found.", {
        status: 404,
        code: "FALLBACK_WALLPAPER_NOT_FOUND",
      });
    }

    const svg = buildFallbackWallpaperSvg({
      gradient: getWallpaperGradientKey(wallpaper),
      height: file.height ?? wallpaper.height ?? 2160,
      title: wallpaper.title,
      width: file.width ?? wallpaper.width ?? 3840,
    });
    const body = new TextEncoder().encode(svg);

    return new Response(body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
        "Content-Length": String(body.byteLength),
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/fallback",
    });

    return jsonError("Failed to render fallback preview.", {
      status: 500,
      code: "FALLBACK_WALLPAPER_FAILED",
    });
  }
}
