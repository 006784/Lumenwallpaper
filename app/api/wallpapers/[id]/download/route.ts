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
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestIpAddress,
} from "@/lib/rate-limit";
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

type TransformedDownload = {
  buffer: Buffer;
  contentType: string;
  format: string;
};

type DownloadTransformCacheEntry = TransformedDownload & {
  createdAt: number;
  key: string;
  lastAccessedAt: number;
  sizeBytes: number;
};

const DOWNLOAD_VARIANTS = new Set<WallpaperVariant>([
  "preview",
  "thumb",
  "4k",
  "original",
]);
const MAX_DOWNLOAD_SOURCE_BYTES = 80 * 1024 * 1024;
const MAX_DOWNLOAD_SOURCE_PIXELS = 80_000_000;
const MAX_DOWNLOAD_OUTPUT_WIDTH = 7680;
const MAX_DOWNLOAD_OUTPUT_HEIGHT = 7680;
const MAX_DOWNLOAD_OUTPUT_PIXELS = 40_000_000;
const TRANSFORM_CACHE_MAX_BYTES = 96 * 1024 * 1024;
const TRANSFORM_CACHE_MAX_ENTRIES = 32;
const TRANSFORM_CACHE_TTL_MS = 15 * 60 * 1000;
const DOWNLOAD_TRANSFORM_RATE_LIMIT = {
  limit: 40,
  windowSeconds: 10 * 60,
};

declare global {
  // eslint-disable-next-line no-var
  var __lumenDownloadTransformCache:
    | Map<string, DownloadTransformCacheEntry>
    | undefined;
}

class DownloadTransformError extends Error {
  code: string;
  publicMessage: string;
  status: number;

  constructor(message: string, options: {
    code: string;
    publicMessage: string;
    status: number;
  }) {
    super(message);
    this.name = "DownloadTransformError";
    this.code = options.code;
    this.publicMessage = options.publicMessage;
    this.status = options.status;
  }
}

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

  if (
    width > MAX_DOWNLOAD_OUTPUT_WIDTH ||
    height > MAX_DOWNLOAD_OUTPUT_HEIGHT ||
    width * height > MAX_DOWNLOAD_OUTPUT_PIXELS
  ) {
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
  return /^image\/(png|jpe?g|webp|avif|svg\+xml)$/i.test(contentType);
}

function shouldTransformDownload(
  config: DownloadTransformConfig,
  contentType: string,
) {
  if (!canTransformContentType(contentType)) {
    return false;
  }

  if (config.ratio || config.resolution) {
    return true;
  }

  if (config.format === "webp") {
    return !/^image\/webp/i.test(contentType);
  }

  if (config.format === "png") {
    return !/^image\/png/i.test(contentType);
  }

  return false;
}

async function readWebStreamAsBuffer(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number,
) {
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

      if (totalLength > maxBytes) {
        await reader.cancel();
        throw new DownloadTransformError("Download source exceeded transform limit.", {
          code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
          publicMessage: "这张壁纸原文件过大，无法在线裁切或转换格式。请下载原图版本。",
          status: 413,
        });
      }
    }
  }

  return Buffer.concat(chunks, totalLength);
}

function bytesToResponseBody(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function getTransformCacheStore() {
  if (!globalThis.__lumenDownloadTransformCache) {
    globalThis.__lumenDownloadTransformCache = new Map();
  }

  return globalThis.__lumenDownloadTransformCache;
}

function getTransformCacheTotalBytes(
  store: Map<string, DownloadTransformCacheEntry>,
) {
  let totalBytes = 0;

  for (const entry of store.values()) {
    totalBytes += entry.sizeBytes;
  }

  return totalBytes;
}

function pruneTransformCache(store: Map<string, DownloadTransformCacheEntry>) {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (now - entry.createdAt > TRANSFORM_CACHE_TTL_MS) {
      store.delete(key);
    }
  }

  while (
    store.size > TRANSFORM_CACHE_MAX_ENTRIES ||
    getTransformCacheTotalBytes(store) > TRANSFORM_CACHE_MAX_BYTES
  ) {
    const oldest = [...store.values()].sort(
      (left, right) => left.lastAccessedAt - right.lastAccessedAt,
    )[0];

    if (!oldest) {
      break;
    }

    store.delete(oldest.key);
  }
}

function getCachedTransformedDownload(cacheKey: string) {
  const store = getTransformCacheStore();
  pruneTransformCache(store);

  const entry = store.get(cacheKey);

  if (!entry) {
    return null;
  }

  entry.lastAccessedAt = Date.now();
  return entry;
}

function setCachedTransformedDownload(
  cacheKey: string,
  transformed: TransformedDownload,
) {
  const store = getTransformCacheStore();
  store.set(cacheKey, {
    ...transformed,
    createdAt: Date.now(),
    key: cacheKey,
    lastAccessedAt: Date.now(),
    sizeBytes: transformed.buffer.byteLength,
  });
  pruneTransformCache(store);
}

function buildTransformCacheKey(options: {
  config: DownloadTransformConfig;
  contentType: string;
  etag: string | null;
  sourceKey: string;
  variant: WallpaperVariant;
}) {
  return [
    options.sourceKey,
    options.etag ?? "no-etag",
    options.contentType,
    options.variant,
    options.config.format,
    options.config.ratio?.label ?? "free",
    options.config.resolution
      ? `${options.config.resolution.width}x${options.config.resolution.height}`
      : "source",
  ].join("|");
}

function getTransformRateLimitKey(
  request: Request,
  currentUser: ReturnType<typeof getCurrentUser>,
) {
  return currentUser
    ? `download-transform:user:${String(currentUser.id)}`
    : `download-transform:ip:${getRequestIpAddress(request)}`;
}

async function consumeDownloadTransformRateLimit(
  request: Request,
  currentUser: ReturnType<typeof getCurrentUser>,
) {
  return consumeRateLimit({
    key: getTransformRateLimitKey(request, currentUser),
    limit: DOWNLOAD_TRANSFORM_RATE_LIMIT.limit,
    windowSeconds: DOWNLOAD_TRANSFORM_RATE_LIMIT.windowSeconds,
  });
}

async function getTransformedDownload(options: {
  cacheKey: string;
  config: DownloadTransformConfig;
  loadSource: () => Promise<Buffer> | Buffer;
}) {
  const cached = getCachedTransformedDownload(options.cacheKey);

  if (cached) {
    return {
      cacheStatus: "hit" as const,
      transformed: cached,
    };
  }

  const source = await options.loadSource();
  const transformed = await transformDownloadBuffer(
    source,
    options.config,
  );

  setCachedTransformedDownload(options.cacheKey, transformed);

  return {
    cacheStatus: "miss" as const,
    transformed,
  };
}

async function transformDownloadBuffer(
  source: Buffer,
  config: DownloadTransformConfig,
): Promise<TransformedDownload> {
  const image = sharp(source, {
    animated: false,
    failOn: "none",
  });
  const metadata = await image.metadata();
  const sourceWidth = metadata.width ?? config.resolution?.width ?? 0;
  const sourceHeight = metadata.height ?? config.resolution?.height ?? 0;
  let pipeline = image.rotate();

  if (
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    sourceWidth * sourceHeight > MAX_DOWNLOAD_SOURCE_PIXELS
  ) {
    throw new DownloadTransformError("Download source exceeded pixel limit.", {
      code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
      publicMessage: "这张壁纸分辨率过大，无法在线裁切或转换格式。请下载原图版本。",
      status: 413,
    });
  }

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
      const fallbackContentType = "image/svg+xml";
      const shouldTransform = shouldTransformDownload(
        transformConfig,
        fallbackContentType,
      );
      let transformed: TransformedDownload | null = null;
      let transformCacheStatus: "hit" | "miss" | null = null;
      let transformRateLimitHeaders: HeadersInit = {};

      if (shouldTransform) {
        const transformRateLimit = await consumeDownloadTransformRateLimit(
          request,
          currentUser,
        );
        transformRateLimitHeaders = getRateLimitHeaders(transformRateLimit);

        if (!transformRateLimit.allowed) {
          logger.warn("wallpaper.download.transform.rate_limited", {
            rateLimitSource: transformRateLimit.source,
            wallpaperId: String(wallpaper.id),
          });

          return jsonError("下载转换过于频繁，请稍后再试。", {
            status: 429,
            code: "WALLPAPER_DOWNLOAD_TRANSFORM_RATE_LIMITED",
            headers: transformRateLimitHeaders,
          });
        }

        const transformedResult = await getTransformedDownload({
          cacheKey: buildTransformCacheKey({
            config: transformConfig,
            contentType: fallbackContentType,
            etag: null,
            sourceKey: `fallback:${normalizedStoragePath}:${width}x${height}`,
            variant: downloadFile.variant,
          }),
          config: transformConfig,
          loadSource: () => Buffer.from(svg),
        });

        transformed = transformedResult.transformed;
        transformCacheStatus = transformedResult.cacheStatus;
      }

      const responseContentType = transformed?.contentType ?? fallbackContentType;
      const responseBody = transformed?.buffer ?? new TextEncoder().encode(svg);
      const filename = buildDownloadFilename(
        buildDownloadLabel(wallpaper.aiTags, wallpaper.title, wallpaper.tags),
        downloadFile.variant,
        transformed?.format ?? fallbackContentType,
      );

      logger.done("wallpaper.download.fallback", {
        contentLength: responseBody.byteLength,
        transformed: Boolean(transformed),
        transformCacheStatus,
        wallpaperId: String(wallpaper.id),
        variant: downloadFile.variant,
      });

      return new Response(bytesToResponseBody(responseBody), {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
          "Content-Length": String(responseBody.byteLength),
          "Content-Type": transformed
            ? responseContentType
            : "image/svg+xml; charset=utf-8",
          ...transformRateLimitHeaders,
          ...(nextDownloadsCount !== null
            ? {
                "X-Wallpaper-Downloads-Count": String(nextDownloadsCount),
              }
            : {}),
          "X-Wallpaper-Download-Variant": downloadFile.variant,
          "X-Wallpaper-Fallback": "true",
          ...(transformed
            ? {
                "X-Wallpaper-Transformed": "true",
                "X-Wallpaper-Transform-Cache": transformCacheStatus ?? "miss",
              }
            : {}),
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
    let transformed: TransformedDownload | null = null;
    let transformCacheStatus: "hit" | "miss" | null = null;
    let transformRateLimitHeaders: HeadersInit = {};

    if (shouldTransform) {
      const transformRateLimit = await consumeDownloadTransformRateLimit(
        request,
        currentUser,
      );
      transformRateLimitHeaders = getRateLimitHeaders(transformRateLimit);

      if (!transformRateLimit.allowed) {
        logger.warn("wallpaper.download.transform.rate_limited", {
          rateLimitSource: transformRateLimit.source,
          wallpaperId: String(wallpaper.id),
        });

        return jsonError("下载转换过于频繁，请稍后再试。", {
          status: 429,
          code: "WALLPAPER_DOWNLOAD_TRANSFORM_RATE_LIMITED",
          headers: transformRateLimitHeaders,
        });
      }

      if (
        object.contentLength !== null &&
        object.contentLength > MAX_DOWNLOAD_SOURCE_BYTES
      ) {
        return jsonError("这张壁纸原文件过大，无法在线裁切或转换格式。请下载原图版本。", {
          status: 413,
          code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
          headers: transformRateLimitHeaders,
        });
      }

      const transformedResult = await getTransformedDownload({
        cacheKey: buildTransformCacheKey({
          config: transformConfig,
          contentType: object.contentType,
          etag: object.etag,
          sourceKey: normalizedStoragePath,
          variant: downloadFile.variant,
        }),
        config: transformConfig,
        loadSource: () =>
          readWebStreamAsBuffer(object.stream, MAX_DOWNLOAD_SOURCE_BYTES),
      });

      transformed = transformedResult.transformed;
      transformCacheStatus = transformedResult.cacheStatus;

      if (transformCacheStatus === "hit") {
        await object.stream.cancel().catch(() => undefined);
      }
    }

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
      transformCacheStatus,
      variant: downloadFile.variant,
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": responseContentType,
        ...transformRateLimitHeaders,
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
              "X-Wallpaper-Transform-Cache": transformCacheStatus ?? "miss",
            }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof DownloadTransformError) {
      return jsonError(error.publicMessage, {
        status: error.status,
        code: error.code,
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers/[id]/download",
    });

    return jsonError("Failed to download wallpaper.", {
      status: 500,
      code: "WALLPAPER_DOWNLOAD_FAILED",
    });
  }
}
