import {
  captureServerException,
  createRouteLogger,
  jsonError,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
  getR2ObjectStream,
  normalizeR2StoragePath,
} from "@/lib/r2";
import {
  getWallpaperDownloadFile,
  getWallpaperDownloadFileByVariant,
} from "@/lib/wallpaper-presenters";
import type { WallpaperVariant } from "@/types/wallpaper";
import {
  getWallpaperByIdOrSlug,
  incrementWallpaperDownloads,
} from "@/lib/wallpapers";

type WallpaperDownloadRouteProps = {
  params: {
    id: string;
  };
};

const DOWNLOAD_VARIANTS = new Set<WallpaperVariant>([
  "preview",
  "thumb",
  "4k",
  "original",
]);

function sanitizeDownloadFilenameSegment(value: string) {
  return value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDownloadExtension(format: string | null | undefined) {
  if (!format) {
    return "bin";
  }

  const normalizedFormat = format.trim().toLowerCase();

  if (normalizedFormat === "jpeg") {
    return "jpg";
  }

  return normalizedFormat || "bin";
}

function buildDownloadLabel(
  aiTags: string[],
  fallbackTitle: string,
  fallbackTags: string[],
) {
  const preferredTags = aiTags.filter(Boolean).slice(0, 3);
  const tagLabel = preferredTags.join(" ");

  if (tagLabel.trim().length > 0) {
    return tagLabel;
  }

  const fallbackLabel = fallbackTags.filter(Boolean).slice(0, 3).join(" ");

  if (fallbackLabel.trim().length > 0) {
    return fallbackLabel;
  }

  return fallbackTitle;
}

function buildDownloadFilename(
  label: string,
  variant: string,
  format: string | null | undefined,
) {
  const safeTitle = sanitizeDownloadFilenameSegment(label) || "Lumen Wallpaper";
  const variantSuffix = variant === "original" ? "" : ` ${variant.toUpperCase()}`;
  const extension = getDownloadExtension(format);

  return `${safeTitle}${variantSuffix}.${extension}`;
}

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

    const requestedVariant = new URL(request.url).searchParams.get(
      "variant",
    ) as WallpaperVariant | null;
    const downloadFile =
      requestedVariant && DOWNLOAD_VARIANTS.has(requestedVariant)
        ? getWallpaperDownloadFileByVariant(wallpaper, requestedVariant)
        : getWallpaperDownloadFile(wallpaper);

    if (!downloadFile) {
      return jsonError(
        requestedVariant
          ? "当前壁纸没有这个大小的下载文件。"
          : "Wallpaper download file not found.",
        {
        status: 404,
          code: "WALLPAPER_DOWNLOAD_NOT_FOUND",
        },
      );
    }

    const currentUser = getCurrentUser();
    logger.start({
      wallpaperId: String(wallpaper.id),
      userId: currentUser?.id ?? null,
      variant: downloadFile.variant,
    });

    const normalizedStoragePath = normalizeR2StoragePath(downloadFile.storagePath);

    if (!normalizedStoragePath) {
      return jsonError("Wallpaper download file is missing its storage path.", {
        status: 500,
        code: "WALLPAPER_DOWNLOAD_STORAGE_PATH_MISSING",
      });
    }

    let nextDownloadsCount: number | null = null;
    try {
      const tracking = await incrementWallpaperDownloads(params.id, {
        userId: currentUser?.id ?? null,
        variant: downloadFile.variant,
      });
      nextDownloadsCount = tracking.downloadsCount;
    } catch (error) {
      captureServerException(error, {
        route: "/api/wallpapers/[id]/download",
        tags: {
          section: "download_tracking",
        },
      });
      // Preserve the download flow even if tracking fails.
    }

    const object = await getR2ObjectStream(normalizedStoragePath);
    const filename = buildDownloadFilename(
      buildDownloadLabel(
        wallpaper.aiTags,
        wallpaper.title,
        wallpaper.tags,
      ),
      downloadFile.variant,
      downloadFile.format ?? object.contentType,
    );

    logger.done("wallpaper.download.stream", {
      contentLength: object.contentLength,
      wallpaperId: String(wallpaper.id),
      variant: downloadFile.variant,
    });

    return new Response(object.stream, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": object.contentType,
        ...(object.contentLength && object.contentLength > 0
          ? { "Content-Length": String(object.contentLength) }
          : {}),
        ...(object.etag ? { ETag: object.etag } : {}),
        ...(object.lastModified
          ? { "Last-Modified": object.lastModified }
          : {}),
        ...(nextDownloadsCount !== null
          ? {
              "X-Wallpaper-Downloads-Count": String(nextDownloadsCount),
            }
          : {}),
        "X-Wallpaper-Download-Variant": downloadFile.variant,
      },
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
