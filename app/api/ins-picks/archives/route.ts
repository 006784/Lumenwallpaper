import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getInsPickCollectionWallpapers,
  getInsPickCollection,
} from "@/lib/ins-picks";
import {
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestIpAddress,
} from "@/lib/rate-limit";
import { getR2ObjectBuffer, isR2Configured, normalizeR2StoragePath } from "@/lib/r2";
import { createZipArchive, sanitizeZipPathSegment } from "@/lib/zip";
import type { InsPickArchiveManifestItem, InsPickArchiveQuote } from "@/types/ins-picks";
import type { Wallpaper, WallpaperFile } from "@/types/wallpaper";

const MAX_ARCHIVE_FILES = 100;
const MAX_ARCHIVE_BYTES = 500 * 1024 * 1024;
const archiveVariantSchema = z.enum(["original", "4k", "preview", "thumb"]);

const archiveQuerySchema = z.object({
  collection: z.string().trim().toLowerCase().max(64),
  ids: z
    .string()
    .trim()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    ),
  quote: z
    .enum(["1", "true"])
    .optional()
    .transform(Boolean),
  variant: archiveVariantSchema.optional().default("original"),
});

const archivePostSchema = z.object({
  collection: z.string().trim().toLowerCase().max(64),
  quote: z.boolean().optional().default(false),
  variant: archiveVariantSchema.optional().default("original"),
  wallpaperIds: z.array(z.string().trim().min(1).max(120)).max(MAX_ARCHIVE_FILES).optional(),
});

function getWallpaperFileForArchive(wallpaper: Wallpaper, variant: WallpaperFile["variant"]) {
  return (
    wallpaper.files.find((file) => file.variant === variant) ??
    wallpaper.files.find((file) => file.variant === "original") ??
    wallpaper.files[0] ??
    null
  );
}

function getFileExtension(file: WallpaperFile) {
  const storagePath = normalizeR2StoragePath(file.storagePath);
  const filename = storagePath.split("/").pop() ?? "";
  const extensionFromPath = filename.includes(".")
    ? filename.split(".").pop()
    : null;
  const extension = extensionFromPath || file.format || "bin";

  return extension.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "bin";
}

function buildArchiveManifest(options: {
  collectionSlug: string;
  selectedIds?: string[];
  variant: WallpaperFile["variant"];
  wallpapers: Wallpaper[];
}) {
  const selectedIdSet = options.selectedIds?.length
    ? new Set(options.selectedIds)
    : null;
  const selectedWallpapers = selectedIdSet
    ? options.wallpapers.filter(
        (wallpaper) =>
          selectedIdSet.has(wallpaper.id) || selectedIdSet.has(wallpaper.slug),
      )
    : options.wallpapers;

  return selectedWallpapers.slice(0, MAX_ARCHIVE_FILES).flatMap((wallpaper, index) => {
    const file = getWallpaperFileForArchive(wallpaper, options.variant);

    if (!file?.storagePath) {
      return [];
    }

    const extension = getFileExtension(file);
    const filename = [
      sanitizeZipPathSegment(options.collectionSlug),
      `${String(index + 1).padStart(3, "0")}-${sanitizeZipPathSegment(
        wallpaper.title,
      )}-${sanitizeZipPathSegment(wallpaper.slug)}.${extension}`,
    ].join("/");

    return [
      {
        filename,
        size: file.size,
        storagePath: normalizeR2StoragePath(file.storagePath),
        variant: file.variant,
        wallpaperId: wallpaper.id,
        wallpaperSlug: wallpaper.slug,
        wallpaperTitle: wallpaper.title,
      } satisfies InsPickArchiveManifestItem,
    ];
  });
}

function buildContentDisposition(filename: string) {
  const encoded = encodeURIComponent(filename).replace(
    /['()]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );

  return `attachment; filename="${filename.replace(/"/g, "")}"; filename*=UTF-8''${encoded}`;
}

async function buildQuote(options: {
  collectionSlug: string;
  selectedIds?: string[];
  variant: WallpaperFile["variant"];
}): Promise<InsPickArchiveQuote | null> {
  const { collection, wallpapers } = await getInsPickCollectionWallpapers({
    collectionSlug: options.collectionSlug,
    limit: MAX_ARCHIVE_FILES,
  });

  if (!collection) {
    return null;
  }

  const files = buildArchiveManifest({
    collectionSlug: collection.slug,
    selectedIds: options.selectedIds,
    variant: options.variant,
    wallpapers,
  });

  return {
    collection: {
      label: collection.label,
      nativeName: collection.nativeName,
      r2Prefix: collection.r2Prefix,
      slug: collection.slug,
    },
    endpoint: "/api/ins-picks/archives",
    estimatedPriceCny: null,
    files,
    maxFiles: MAX_ARCHIVE_FILES,
    paymentMode: "paid-ready",
    selectedCount: files.length,
    totalBytes: files.reduce((total, file) => total + (file.size ?? 0), 0),
  };
}

async function handleArchiveRequest(
  request: Request,
  options: {
    collection: string;
    quote: boolean;
    selectedIds?: string[];
    variant: WallpaperFile["variant"];
  },
) {
  const logger = createRouteLogger("/api/ins-picks/archives", request);
  const collection = await getInsPickCollection(options.collection);

  if (!collection) {
    return jsonError("Unknown INS picks collection.", {
      status: 400,
      code: "INVALID_INS_PICK_COLLECTION",
    });
  }

  const quote = await buildQuote({
    collectionSlug: collection.slug,
    selectedIds: options.selectedIds,
    variant: options.variant,
  });

  if (!quote) {
    return jsonError("Unknown INS picks collection.", {
      status: 400,
      code: "INVALID_INS_PICK_COLLECTION",
    });
  }

  if (options.quote) {
    return jsonSuccess(quote, {
      message: "INS pick archive quote loaded.",
    });
  }

  if (!quote.files.length) {
    return jsonError("This INS pick collection has no downloadable files yet.", {
      status: 404,
      code: "INS_PICK_ARCHIVE_EMPTY",
    });
  }

  if (quote.totalBytes > MAX_ARCHIVE_BYTES) {
    return jsonError("This INS pick archive is too large to package at once.", {
      status: 413,
      code: "INS_PICK_ARCHIVE_TOO_LARGE",
      details: {
        maxBytes: MAX_ARCHIVE_BYTES,
        totalBytes: quote.totalBytes,
      },
    });
  }

  if (!isR2Configured()) {
    return jsonError("Wallpaper storage is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
    });
  }

  const rateLimit = await consumeRateLimit({
    key: `ins-picks-archive:ip:${getRequestIpAddress(request)}`,
    limit: 3,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return jsonError("打包下载过于频繁，请稍后再试。", {
      status: 429,
      code: "INS_PICK_ARCHIVE_RATE_LIMITED",
      headers: getRateLimitHeaders(rateLimit),
    });
  }

  logger.start({
    collection: collection.slug,
    fileCount: quote.files.length,
    totalBytes: quote.totalBytes,
    variant: options.variant,
  });

  const entries = await Promise.all(
    quote.files.map(async (file) => ({
      data: await getR2ObjectBuffer(file.storagePath),
      name: file.filename,
    })),
  );
  const archive = createZipArchive(entries);
  const filename = `${sanitizeZipPathSegment(collection.slug)}-${options.variant}.zip`;

  logger.done("ins_picks.archive.created", {
    archiveBytes: archive.byteLength,
    collection: collection.slug,
    fileCount: entries.length,
  });

  return new Response(archive, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      "Content-Disposition": buildContentDisposition(filename),
      "Content-Length": String(archive.byteLength),
      "Content-Type": "application/zip",
      ...getRateLimitHeaders(rateLimit),
      "X-Lumen-Payment-Mode": quote.paymentMode,
      "X-Lumen-Selected-Count": String(quote.selectedCount),
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = archiveQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    return handleArchiveRequest(request, {
      collection: query.collection,
      quote: query.quote,
      selectedIds: query.ids,
      variant: query.variant,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS pick archive query.", {
        status: 400,
        code: "INVALID_INS_PICK_ARCHIVE_QUERY",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks/archives",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to create INS pick archive.", {
      status: 500,
      code: "INS_PICK_ARCHIVE_FAILED",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = archivePostSchema.parse(await request.json());

    return handleArchiveRequest(request, {
      collection: body.collection,
      quote: body.quote,
      selectedIds: body.wallpaperIds,
      variant: body.variant,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS pick archive payload.", {
        status: 400,
        code: "INVALID_INS_PICK_ARCHIVE_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks/archives",
      tags: {
        method: "POST",
      },
    });

    return jsonError("Failed to create INS pick archive.", {
      status: 500,
      code: "INS_PICK_ARCHIVE_FAILED",
    });
  }
}
