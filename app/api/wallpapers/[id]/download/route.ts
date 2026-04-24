import {
  captureServerException,
  createRouteLogger,
  jsonError,
} from "@/lib/api";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import {
  buildFallbackWallpaperSvg,
  isFallbackWallpaperStoragePath,
} from "@/lib/fallback-wallpaper-assets";
import {
  getR2ObjectStream,
  isR2Configured,
  normalizeR2StoragePath,
} from "@/lib/r2";
import {
  getWallpaperGradientKey,
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

type DownloadTransformConfig = {
  format: "original" | "png" | "webp";
  ratio: {
    label: string;
    width: number;
    height: number;
  } | null;
  resolution: {
    width: number;
    height: number;
  } | null;
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

  if (normalizedFormat.includes("/")) {
    const mimeToExtension: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "video/mp4": "mp4",
      "video/quicktime": "mov",
      "video/webm": "webm",
    };

    return mimeToExtension[normalizedFormat] ?? "bin";
  }

  if (normalizedFormat === "jpeg") {
    return "jpg";
  }

  if (normalizedFormat === "svg+xml") {
    return "svg";
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

function parseResolution(value: string | null) {
  const match = value?.match(/(\d+)\s*[×x]\s*(\d+)/i);

  if (!match) {
    return null;
  }

  const width = Number.parseInt(match[1]!, 10);
  const height = Number.parseInt(match[2]!, 10);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { width, height };
}

function parseRatio(value: string | null) {
  if (!value || value === "FREE") {
    return null;
  }

  const match = value.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/);

  if (!match) {
    return null;
  }

  const width = Number.parseFloat(match[1]!);
  const height = Number.parseFloat(match[2]!);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    label: value,
    width,
    height,
  };
}

function getTransformConfig(request: Request): DownloadTransformConfig {
  const searchParams = new URL(request.url).searchParams;
  const requestedFormat = searchParams.get("format")?.toLowerCase();

  return {
    format:
      requestedFormat === "webp"
        ? "webp"
        : requestedFormat === "png"
          ? "png"
          : "original",
    ratio: parseRatio(searchParams.get("ratio")),
    resolution: parseResolution(searchParams.get("resolution")),
  };
}

function canTransformContentType(contentType: string) {
  return /^image\/(png|jpe?g|webp|avif)$/i.test(contentType);
}

function shouldTransformDownload(
  config: DownloadTransformConfig,
  contentType: string,
) {
  if (!canTransformContentType(contentType)) {
    return false;
  }

  return Boolean(config.ratio) || config.format === "webp";
}

async function readWebStreamAsBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      chunks.push(value);
      totalLength += value.byteLength;
    }
  }

  return Buffer.concat(chunks, totalLength);
}

async function transformDownloadBuffer(
  source: Buffer,
  config: DownloadTransformConfig,
) {
  const image = sharp(source, {
    animated: false,
    failOn: "none",
  });
  const metadata = await image.metadata();
  const sourceWidth = metadata.width ?? config.resolution?.width ?? 0;
  const sourceHeight = metadata.height ?? config.resolution?.height ?? 0;
  let pipeline = image.rotate();

  if (config.ratio && sourceWidth > 0 && sourceHeight > 0) {
    const targetRatio = config.ratio.width / config.ratio.height;
    const sourceRatio = sourceWidth / sourceHeight;
    const cropWidth =
      sourceRatio >= targetRatio
        ? Math.round(sourceHeight * targetRatio)
        : sourceWidth;
    const cropHeight =
      sourceRatio >= targetRatio
        ? sourceHeight
        : Math.round(sourceWidth / targetRatio);

    pipeline = pipeline.extract({
      height: Math.max(1, cropHeight),
      left: Math.max(0, Math.round((sourceWidth - cropWidth) / 2)),
      top: Math.max(0, Math.round((sourceHeight - cropHeight) / 2)),
      width: Math.max(1, cropWidth),
    });
  }

  if (config.resolution) {
    pipeline = pipeline.resize({
      fit: "inside",
      height: config.resolution.height,
      withoutEnlargement: true,
      width: config.resolution.width,
    });
  }

  if (config.format === "webp") {
    return {
      buffer: await pipeline.webp({ quality: 88 }).toBuffer(),
      contentType: "image/webp",
      format: "image/webp",
    };
  }

  return {
    buffer: await pipeline.png({ compressionLevel: 8 }).toBuffer(),
    contentType: "image/png",
    format: "image/png",
  };
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
    const transformConfig = getTransformConfig(request);
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

    if (isFallbackWallpaperStoragePath(normalizedStoragePath)) {
      const width = downloadFile.width ?? wallpaper.width ?? 3840;
      const height = downloadFile.height ?? wallpaper.height ?? 2160;
      const svg = buildFallbackWallpaperSvg({
        gradient: getWallpaperGradientKey(wallpaper),
        height,
        title: buildDownloadLabel(
          wallpaper.aiTags,
          wallpaper.title,
          wallpaper.tags,
        ),
        width,
      });
      const filename = buildDownloadFilename(
        buildDownloadLabel(wallpaper.aiTags, wallpaper.title, wallpaper.tags),
        downloadFile.variant,
        "image/svg+xml",
      );
      const body = new TextEncoder().encode(svg);

      logger.done("wallpaper.download.fallback", {
        contentLength: body.byteLength,
        wallpaperId: String(wallpaper.id),
        variant: downloadFile.variant,
      });

      return new Response(body, {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "Content-Length": String(body.byteLength),
          "Content-Type": "image/svg+xml; charset=utf-8",
          ...(nextDownloadsCount !== null
            ? {
                "X-Wallpaper-Downloads-Count": String(nextDownloadsCount),
              }
            : {}),
          "X-Wallpaper-Download-Variant": downloadFile.variant,
          "X-Wallpaper-Fallback": "true",
        },
      });
    }

    if (!isR2Configured()) {
      return jsonError("Wallpaper storage is not configured.", {
        status: 503,
        code: "R2_NOT_CONFIGURED",
      });
    }

    const object = await getR2ObjectStream(normalizedStoragePath);
    const shouldTransform = shouldTransformDownload(
      transformConfig,
      object.contentType,
    );
    const transformed = shouldTransform
      ? await transformDownloadBuffer(
          await readWebStreamAsBuffer(object.stream),
          transformConfig,
        )
      : null;
    const responseContentType = transformed?.contentType ?? object.contentType;
    const responseBody = transformed?.buffer ?? object.stream;
    const responseContentLength =
      transformed?.buffer.byteLength ?? object.contentLength;
    const filename = buildDownloadFilename(
      buildDownloadLabel(
        wallpaper.aiTags,
        wallpaper.title,
        wallpaper.tags,
      ),
      downloadFile.variant,
      transformed?.format ?? downloadFile.format ?? object.contentType,
    );

    logger.done("wallpaper.download.stream", {
      contentLength: responseContentLength,
      wallpaperId: String(wallpaper.id),
      transformed: Boolean(transformed),
      variant: downloadFile.variant,
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": responseContentType,
        ...(responseContentLength && responseContentLength > 0
          ? { "Content-Length": String(responseContentLength) }
          : {}),
        ...(!transformed && object.etag ? { ETag: object.etag } : {}),
        ...(!transformed && object.lastModified
          ? { "Last-Modified": object.lastModified }
          : {}),
        ...(nextDownloadsCount !== null
          ? {
              "X-Wallpaper-Downloads-Count": String(nextDownloadsCount),
            }
          : {}),
        "X-Wallpaper-Download-Variant": downloadFile.variant,
        ...(transformed
          ? {
              "X-Wallpaper-Transformed": "true",
            }
          : {}),
      },
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/download",
    });

    return jsonError("Failed to download wallpaper.", {
      status: 500,
      code: "WALLPAPER_DOWNLOAD_FAILED",
    });
  }
}
