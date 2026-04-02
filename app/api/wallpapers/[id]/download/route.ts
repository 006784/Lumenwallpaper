import { NextResponse } from "next/server";

import {
  captureServerException,
  createRouteLogger,
  jsonError,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getWallpaperDownloadFile } from "@/lib/wallpaper-presenters";
import {
  getWallpaperByIdOrSlug,
  incrementWallpaperDownloads,
} from "@/lib/wallpapers";

type WallpaperDownloadRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: WallpaperDownloadRouteProps,
) {
  const logger = createRouteLogger("/api/wallpapers/[id]/download", request);

  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    const downloadFile = getWallpaperDownloadFile(wallpaper);

    if (!downloadFile) {
      return jsonError("Wallpaper download file not found.", {
        status: 404,
        code: "WALLPAPER_DOWNLOAD_NOT_FOUND",
      });
    }

    const currentUser = getCurrentUser();
    logger.start({
      wallpaperId: String(wallpaper.id),
      userId: currentUser?.id ?? null,
      variant: downloadFile.variant,
    });

    try {
      await incrementWallpaperDownloads(params.id, {
        userId: currentUser?.id ?? null,
        variant: downloadFile.variant,
      });
    } catch (error) {
      captureServerException(error, {
        route: "/api/wallpapers/[id]/download",
        tags: {
          section: "download_tracking",
        },
      });
      // Preserve the download flow even if tracking fails.
    }

    logger.done("wallpaper.download.redirect", {
      wallpaperId: String(wallpaper.id),
      variant: downloadFile.variant,
    });

    return NextResponse.redirect(downloadFile.url, {
      status: 307,
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/download",
    });
    const message =
      error instanceof Error ? error.message : "Failed to download wallpaper.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_DOWNLOAD_FAILED",
    });
  }
}
