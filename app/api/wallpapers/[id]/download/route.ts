import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
} from "@/lib/api";
import sharp from "sharp";
import { z } from "zod";
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
  getPublishedWallpaperByIdOrSlug,
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
    label: string;
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
const DOWNLOAD_QUERY_SCHEMA = z.object({
  format: z.enum(["original", "png", "webp"]).optional(),
  ratio: z.string().trim().max(24).optional(),
  resolution: z.string().trim().max(32).optional(),
  variant: z.enum(["preview", "thumb", "4k", "original"]).optional(),
});
const FREE_RATIO_VALUES = new Set([
  "AUTO",
  "FREE",
  "ORIGINAL",
  "SOURCE",
  "原图",
  "原始",
  "自由",
]);
const SOURCE_RESOLUTION_VALUES = new Set([
  "AUTO",
  "ORIGINAL",
  "SOURCE",
  "原图",
  "原始",
  "源文件",
]);
const MAX_RATIO_COMPONENT = 100;

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

  constructor(
    message: string,
    options: {
      code: string;
      publicMessage: string;
      status: number;
    },
  ) {
    super(message);
    this.name = "DownloadTransformError";
    this.code = options.code;
    this.publicMessage = options.publicMessage;
    this.status = options.status;
  }
}

class DownloadQueryError extends Error {
  code: string;
  details: unknown;
  publicMessage: string;
  status: number;

  constructor(
    message: string,
    options: {
      code: string;
      details?: unknown;
      publicMessage: string;
      status: number;
    },
  ) {
    super(message);
    this.name = "DownloadQueryError";
    this.code = options.code;
    this.details = options.details;
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
  const variantSuffix =
    variant === "original" ? "" : ` ${variant.toUpperCase()}`;
  const extension = getDownloadExtension(format);

  return `${safeTitle}${variantSuffix}.${extension}`;
}

function encodeContentDispositionFilename(filename: string) {
  return encodeURIComponent(filename).replace(
    /['()]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function buildAsciiDownloadFilename(filename: string) {
  const extensionMatch = filename.match(/\.[A-Za-z0-9]+$/);
  const extension = extensionMatch?.[0] ?? "";
  const basename = extension ? filename.slice(0, -extension.length) : filename;
  const asciiBasename = sanitizeDownloadFilenameSegment(
    basename
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/["\\]/g, " "),
  )
    .replace(/[^A-Za-z0-9._ -]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${asciiBasename || "lumen-wallpaper"}${extension.toLowerCase()}`;
}

function buildContentDisposition(filename: string) {
  const asciiFilename = buildAsciiDownloadFilename(filename);

  return `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeContentDispositionFilename(filename)}`;
}

function getOptionalSearchParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);

  if (value === null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatRatioComponent(value: number) {
  return Number.isInteger(value) ? String(value) : String(value);
}

function parseResolution(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/\s*px$/i, "");

  if (SOURCE_RESOLUTION_VALUES.has(normalized.toUpperCase())) {
    return null;
  }

  const match = normalized.match(/^(\d+)\s*[×x]\s*(\d+)$/i);

  if (!match) {
    throw new DownloadQueryError("Invalid download resolution.", {
      code: "INVALID_WALLPAPER_DOWNLOAD_RESOLUTION",
      publicMessage: "下载分辨率格式无效，请使用类似 3840 × 2160 的格式。",
      status: 400,
    });
  }

  const width = Number.parseInt(match[1]!, 10);
  const height = Number.parseInt(match[2]!, 10);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new DownloadQueryError("Invalid download resolution.", {
      code: "INVALID_WALLPAPER_DOWNLOAD_RESOLUTION",
      publicMessage: "下载分辨率必须是正整数。",
      status: 400,
    });
  }

  if (
    width > MAX_DOWNLOAD_OUTPUT_WIDTH ||
    height > MAX_DOWNLOAD_OUTPUT_HEIGHT ||
    width * height > MAX_DOWNLOAD_OUTPUT_PIXELS
  ) {
    throw new DownloadQueryError("Download resolution exceeded limit.", {
      code: "WALLPAPER_DOWNLOAD_RESOLUTION_TOO_LARGE",
      publicMessage: "请求的下载分辨率过大，无法在线生成。",
      status: 400,
    });
  }

  return {
    label: `${width}x${height}`,
    width,
    height,
  };
}

function parseRatio(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (FREE_RATIO_VALUES.has(normalized.toUpperCase())) {
    return null;
  }

  const match = normalized.match(
    /^(\d+(?:\.\d{1,2})?)\s*:\s*(\d+(?:\.\d{1,2})?)$/,
  );

  if (!match) {
    throw new DownloadQueryError("Invalid download ratio.", {
      code: "INVALID_WALLPAPER_DOWNLOAD_RATIO",
      publicMessage: "下载裁切比例格式无效，请使用类似 16:9 或 9:19.5 的格式。",
      status: 400,
    });
  }

  const width = Number.parseFloat(match[1]!);
  const height = Number.parseFloat(match[2]!);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new DownloadQueryError("Invalid download ratio.", {
      code: "INVALID_WALLPAPER_DOWNLOAD_RATIO",
      publicMessage: "下载裁切比例必须是正数。",
      status: 400,
    });
  }

  if (width > MAX_RATIO_COMPONENT || height > MAX_RATIO_COMPONENT) {
    throw new DownloadQueryError("Download ratio exceeded limit.", {
      code: "WALLPAPER_DOWNLOAD_RATIO_TOO_LARGE",
      publicMessage: "下载裁切比例过大，请选择常用屏幕比例。",
      status: 400,
    });
  }

  return {
    label: `${formatRatioComponent(width)}:${formatRatioComponent(height)}`,
    width,
    height,
  };
}

function parseDownloadQuery(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const parsed = DOWNLOAD_QUERY_SCHEMA.safeParse({
    format: getOptionalSearchParam(searchParams, "format")?.toLowerCase(),
    ratio: getOptionalSearchParam(searchParams, "ratio"),
    resolution: getOptionalSearchParam(searchParams, "resolution"),
    variant: getOptionalSearchParam(searchParams, "variant"),
  });

  if (!parsed.success) {
    throw new DownloadQueryError("Invalid wallpaper download query.", {
      code: "INVALID_WALLPAPER_DOWNLOAD_QUERY",
      details: formatZodError(parsed.error),
      publicMessage: "下载配置参数无效，请重新选择后再试。",
      status: 400,
    });
  }

  return {
    requestedVariant: parsed.data.variant as WallpaperVariant | undefined,
    transformConfig: {
      format: parsed.data.format ?? "original",
      ratio: parseRatio(parsed.data.ratio),
      resolution: parseResolution(parsed.data.resolution),
    } satisfies DownloadTransformConfig,
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

function isSameResolution(
  resolution: DownloadTransformConfig["resolution"],
  width: number | null | undefined,
  height: number | null | undefined,
) {
  return Boolean(
    resolution &&
    width &&
    height &&
    Math.abs(resolution.width - width) <= 1 &&
    Math.abs(resolution.height - height) <= 1,
  );
}

function getEffectiveTransformConfig(
  config: DownloadTransformConfig,
  options: {
    height: number | null | undefined;
    variant: WallpaperVariant;
    width: number | null | undefined;
  },
): DownloadTransformConfig {
  const resolutionMatchesSource =
    !config.ratio &&
    isSameResolution(config.resolution, options.width, options.height);
  const nextResolution = resolutionMatchesSource ? null : config.resolution;
  const shouldKeepOriginalFormat =
    options.variant === "original" &&
    config.format === "png" &&
    !config.ratio &&
    resolutionMatchesSource;

  return {
    format: shouldKeepOriginalFormat ? "original" : config.format,
    ratio: config.ratio,
    resolution: nextResolution,
  };
}

function getDownloadConfigHeaders(options: {
  config: DownloadTransformConfig;
  requestedConfig: DownloadTransformConfig;
  variant: WallpaperVariant;
}) {
  return {
    "X-Wallpaper-Download-Format": options.config.format,
    "X-Wallpaper-Download-Ratio": options.config.ratio?.label ?? "free",
    "X-Wallpaper-Download-Requested-Format": options.requestedConfig.format,
    "X-Wallpaper-Download-Resolution":
      options.config.resolution?.label ?? "source",
    "X-Wallpaper-Download-Variant": options.variant,
  };
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
        throw new DownloadTransformError(
          "Download source exceeded transform limit.",
          {
            code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
            publicMessage:
              "这张壁纸原文件过大，无法在线裁切或转换格式。请下载原图版本。",
            status: 413,
          },
        );
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
  const transformed = await transformDownloadBuffer(source, options.config);

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
  const sourceImage = sharp(source, {
    animated: false,
    failOn: "none",
  });
  const metadata = await sourceImage.metadata();
  const sourceWidth = metadata.width ?? config.resolution?.width ?? 0;
  const sourceHeight = metadata.height ?? config.resolution?.height ?? 0;

  if (
    sourceWidth > 0 &&
    sourceHeight > 0 &&
    sourceWidth * sourceHeight > MAX_DOWNLOAD_SOURCE_PIXELS
  ) {
    throw new DownloadTransformError("Download source exceeded pixel limit.", {
      code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
      publicMessage:
        "这张壁纸分辨率过大，无法在线裁切或转换格式。请下载原图版本。",
      status: 413,
    });
  }

  const normalized = await sharp(source, {
    animated: false,
    failOn: "none",
  })
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const orientedWidth = normalized.info.width ?? sourceWidth;
  const orientedHeight = normalized.info.height ?? sourceHeight;
  let pipeline = sharp(normalized.data, {
    animated: false,
    failOn: "none",
  });

  if (config.ratio && orientedWidth > 0 && orientedHeight > 0) {
    const targetRatio = config.ratio.width / config.ratio.height;
    const sourceRatio = orientedWidth / orientedHeight;
    const cropWidth =
      sourceRatio >= targetRatio
        ? Math.round(orientedHeight * targetRatio)
        : orientedWidth;
    const cropHeight =
      sourceRatio >= targetRatio
        ? orientedHeight
        : Math.round(orientedWidth / targetRatio);

    pipeline = pipeline.extract({
      height: Math.max(1, cropHeight),
      left: Math.max(0, Math.round((orientedWidth - cropWidth) / 2)),
      top: Math.max(0, Math.round((orientedHeight - cropHeight) / 2)),
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

async function trackWallpaperDownload(options: {
  currentUser: ReturnType<typeof getCurrentUser>;
  identifier: string;
  variant: WallpaperVariant;
}) {
  try {
    const tracking = await incrementWallpaperDownloads(options.identifier, {
      userId: options.currentUser?.id ?? null,
      variant: options.variant,
    });

    return tracking.downloadsCount;
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/download",
      tags: {
        section: "download_tracking",
      },
    });
    // Preserve the download flow even if tracking fails.
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: WallpaperDownloadRouteProps,
) {
  const logger = createRouteLogger("/api/wallpapers/[id]/download", request);

  try {
    const { requestedVariant, transformConfig } = parseDownloadQuery(request);
    const wallpaper = await getPublishedWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

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

    if (requestedVariant && downloadFile.variant !== requestedVariant) {
      return jsonError("当前壁纸没有这个大小的下载文件。", {
        status: 404,
        code: "WALLPAPER_DOWNLOAD_VARIANT_NOT_FOUND",
      });
    }

    const currentUser = getCurrentUser();
    logger.start({
      wallpaperId: String(wallpaper.id),
      userId: currentUser?.id ?? null,
      variant: downloadFile.variant,
    });

    const normalizedStoragePath = normalizeR2StoragePath(
      downloadFile.storagePath,
    );

    if (!normalizedStoragePath) {
      return jsonError("Wallpaper download file is missing its storage path.", {
        status: 500,
        code: "WALLPAPER_DOWNLOAD_STORAGE_PATH_MISSING",
      });
    }

    if (isFallbackWallpaperStoragePath(normalizedStoragePath)) {
      const width = downloadFile.width ?? wallpaper.width ?? 3840;
      const height = downloadFile.height ?? wallpaper.height ?? 2160;
      const effectiveTransformConfig = getEffectiveTransformConfig(
        transformConfig,
        {
          height,
          variant: downloadFile.variant,
          width,
        },
      );
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
        effectiveTransformConfig,
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
            config: effectiveTransformConfig,
            contentType: fallbackContentType,
            etag: null,
            sourceKey: `fallback:${normalizedStoragePath}:${width}x${height}`,
            variant: downloadFile.variant,
          }),
          config: effectiveTransformConfig,
          loadSource: () => Buffer.from(svg),
        });

        transformed = transformedResult.transformed;
        transformCacheStatus = transformedResult.cacheStatus;
      }

      const responseContentType =
        transformed?.contentType ?? fallbackContentType;
      const responseBody = transformed?.buffer ?? new TextEncoder().encode(svg);
      const filename = buildDownloadFilename(
        buildDownloadLabel(wallpaper.aiTags, wallpaper.title, wallpaper.tags),
        downloadFile.variant,
        transformed?.format ?? fallbackContentType,
      );
      const nextDownloadsCount = await trackWallpaperDownload({
        currentUser,
        identifier: params.id,
        variant: downloadFile.variant,
      });

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
          "Content-Disposition": buildContentDisposition(filename),
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
          ...getDownloadConfigHeaders({
            config: effectiveTransformConfig,
            requestedConfig: transformConfig,
            variant: downloadFile.variant,
          }),
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
    const effectiveTransformConfig = getEffectiveTransformConfig(
      transformConfig,
      {
        height: downloadFile.height ?? wallpaper.height,
        variant: downloadFile.variant,
        width: downloadFile.width ?? wallpaper.width,
      },
    );
    const shouldTransform = shouldTransformDownload(
      effectiveTransformConfig,
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
        return jsonError(
          "这张壁纸原文件过大，无法在线裁切或转换格式。请下载原图版本。",
          {
            status: 413,
            code: "WALLPAPER_DOWNLOAD_SOURCE_TOO_LARGE",
            headers: transformRateLimitHeaders,
          },
        );
      }

      const transformedResult = await getTransformedDownload({
        cacheKey: buildTransformCacheKey({
          config: effectiveTransformConfig,
          contentType: object.contentType,
          etag: object.etag,
          sourceKey: normalizedStoragePath,
          variant: downloadFile.variant,
        }),
        config: effectiveTransformConfig,
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
      buildDownloadLabel(wallpaper.aiTags, wallpaper.title, wallpaper.tags),
      downloadFile.variant,
      transformed?.format ?? downloadFile.format ?? object.contentType,
    );
    const nextDownloadsCount = await trackWallpaperDownload({
      currentUser,
      identifier: params.id,
      variant: downloadFile.variant,
    });

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
        "Content-Disposition": buildContentDisposition(filename),
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
        ...getDownloadConfigHeaders({
          config: effectiveTransformConfig,
          requestedConfig: transformConfig,
          variant: downloadFile.variant,
        }),
        ...(transformed
          ? {
              "X-Wallpaper-Transformed": "true",
              "X-Wallpaper-Transform-Cache": transformCacheStatus ?? "miss",
            }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof DownloadQueryError) {
      return jsonError(error.publicMessage, {
        status: error.status,
        code: error.code,
        details: error.details,
      });
    }

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
