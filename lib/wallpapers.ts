import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { moodCards } from "@/lib/data/home";
import { extractWallpaperColorsFromStoragePath } from "@/lib/wallpaper-colors";
import { revalidateWallpaperPublicData } from "@/lib/revalidate";
import {
  matchesExploreCategory,
  matchesWallpaperAspect,
  matchesWallpaperColor,
  matchesWallpaperMedia,
  matchesWallpaperMinimumDimensions,
  matchesWallpaperOrientation,
  matchesWallpaperResolution,
  matchesWallpaperStyle,
  sortWallpapers,
} from "@/lib/explore";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  assertR2ObjectMatchesUpload,
  deleteR2Objects,
  getR2AssetId,
  getUploadMaxSizeBytes,
  isVideoUploadMimeType,
  getR2ObjectUrl,
  listR2Objects,
  MAX_UPLOAD_SIZE_BYTES,
  normalizeR2StoragePath,
} from "@/lib/r2";
import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  isResendConfigured,
  sendModerationResultEmail,
} from "@/lib/resend";
import { logServerEvent } from "@/lib/monitoring";
import {
  analyzeWallpaperWithFallback,
  type WallpaperAiProviderOverride,
} from "@/lib/wallpaper-ai";
import { generateWallpaperVariantFiles } from "@/lib/wallpaper-variants";
import {
  createFallbackWallpaperAssetUrl,
  createFallbackWallpaperStoragePath,
} from "@/lib/fallback-wallpaper-assets";
import {
  getWallpaperPreviewUrl,
  isVideoWallpaperFile,
} from "@/lib/wallpaper-presenters";
import type { Database } from "@/types/database";
import type {
  DownloadHistoryItem,
  LibraryCollection,
  LibraryCollectionDetail,
  LibraryCollectionItemMutationResult,
  LibraryCollectionMutationResult,
  LibraryNotificationItem,
  LibrarySnapshot,
} from "@/types/library";
import type {
  R2ImportCandidate,
  R2ImportObjectInput,
  R2ImportResult,
  R2ImportSummary,
} from "@/types/r2-import";
import type {
  OpenClawBatchRenameResult,
  OpenClawBatchWallpaperUpdateResult,
  OpenClawDuplicateCleanupResult,
  OpenClawDuplicateCleanupGroupResult,
  OpenClawDuplicateWallpaperGroup,
  OpenClawDuplicateWallpaperItem,
} from "@/types/openclaw-api";
import type {
  CreatorProfile,
  Wallpaper,
  WallpaperAssetBackfillResult,
  WallpaperAssetBackfillSummary,
  WallpaperAiAnalysisStatus,
  WallpaperFile,
  WallpaperFavoriteSnapshot,
  WallpaperListOptions,
  WallpaperReport,
  WallpaperReportReceipt,
  WallpaperReportReason,
  WallpaperReportStatus,
  WallpaperStatus,
  SimilarWallpaperGroup,
  SimilarWallpaperSnapshot,
  WallpaperMotionAsset,
  WallpaperMotionSnapshot,
  WallpaperTrustSnapshot,
} from "@/types/wallpaper";

const usersTable = "users" satisfies keyof Database["public"]["Tables"];
const likesTable = "likes" satisfies keyof Database["public"]["Tables"];
const downloadsTable = "downloads" satisfies keyof Database["public"]["Tables"];
const collectionsTable =
  "collections" satisfies keyof Database["public"]["Tables"];
const collectionItemsTable =
  "collection_items" satisfies keyof Database["public"]["Tables"];
const notificationsTable =
  "notifications" satisfies keyof Database["public"]["Tables"];
const wallpapersTable =
  "wallpapers" satisfies keyof Database["public"]["Tables"];
const wallpaperFilesTable =
  "wallpaper_files" satisfies keyof Database["public"]["Tables"];
const wallpaperReportsTable =
  "wallpaper_reports" satisfies keyof Database["public"]["Tables"];

const statusSchema = z.enum(["processing", "published", "rejected"]);
const variantSchema = z.enum(["original", "4k", "thumb", "preview"]);
const imageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
const reportReasonSchema = z.enum([
  "copyright",
  "sensitive",
  "spam",
  "misleading",
  "other",
]);
const reportStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);
const DEFAULT_FAVORITES_COLLECTION_NAME = "收藏夹";
const DEFAULT_LICENSE_VERSION = "2026-04";
const DEFAULT_MANUAL_IMPORT_CREATOR_USERNAME = "Lumen";
const DEFAULT_MANUAL_IMPORT_CREATOR_BIO = "由 Lumen 手动导入与整理的壁纸作者。";
const DEFAULT_R2_IMPORT_SCAN_LIMIT = 24;
const GENERATED_R2_PREFIXES = ["compressed/", "thumbnails/", "previews/"] as const;
const PUBLIC_REPORT_REASONS: WallpaperReportReason[] = [
  "copyright",
  "sensitive",
  "spam",
  "misleading",
  "other",
];

const IMPORTABLE_R2_FILE_TYPES = {
  jpg: {
    kind: "image",
    mimeType: "image/jpeg",
    format: "jpeg",
  },
  jpeg: {
    kind: "image",
    mimeType: "image/jpeg",
    format: "jpeg",
  },
  png: {
    kind: "image",
    mimeType: "image/png",
    format: "png",
  },
  webp: {
    kind: "image",
    mimeType: "image/webp",
    format: "webp",
  },
  mp4: {
    kind: "video",
    mimeType: "video/mp4",
    format: "mp4",
  },
  webm: {
    kind: "video",
    mimeType: "video/webm",
    format: "webm",
  },
  mov: {
    kind: "video",
    mimeType: "video/quicktime",
    format: "mov",
  },
} as const;

type R2ImportableFileInfo =
  (typeof IMPORTABLE_R2_FILE_TYPES)[keyof typeof IMPORTABLE_R2_FILE_TYPES];

export const presignUploadSchema = z
  .preprocess(
    (input) => {
      if (!input || typeof input !== "object") {
        return input;
      }

      const payload = input as Record<string, unknown>;

      return {
        ...payload,
        contentType: payload.contentType ?? payload.fileType,
        filename: payload.filename ?? payload.fileName,
        size: payload.size ?? payload.fileSize,
      };
    },
    z.object({
      filename: z.string().min(1).max(255),
      contentType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
      size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
    }),
  )
  .superRefine((value, context) => {
    if (value.size > getUploadMaxSizeBytes(value.contentType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: isVideoUploadMimeType(value.contentType)
          ? "视频超过 200MB，请压缩后再上传。"
          : "图片超过 50MB，请压缩后再上传。",
        path: ["size"],
      });
    }
  });

export const createWallpaperSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => value || undefined),
  videoUrl: z
    .string()
    .trim()
    .url()
    .optional()
    .transform((value) => value || undefined),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  colors: z
    .array(
      z
        .string()
        .trim()
        .regex(/^#?[0-9a-fA-F]{3,8}$/),
    )
    .max(8)
    .default([]),
  width: z.number().int().positive().max(20000).optional(),
  height: z.number().int().positive().max(20000).optional(),
  featured: z.boolean().optional().default(false),
  status: statusSchema.optional().default("published"),
  licenseAccepted: z.boolean().refine((value) => value, {
    message: "You must confirm you have the right to upload this wallpaper.",
  }),
  licenseVersion: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .optional()
    .default(DEFAULT_LICENSE_VERSION),
  creator: z
    .object({
      email: z
        .string()
        .trim()
        .email()
        .optional()
        .transform((value) => value?.toLowerCase()),
      username: z
        .string()
        .trim()
        .min(3)
        .max(32)
        .regex(/^[a-z0-9-]+$/)
        .optional(),
      bio: z.string().trim().max(160).optional(),
    })
    .optional(),
  original: z.object({
    storagePath: z.string().trim().min(1),
    url: z.string().trim().url(),
    size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
    format: z.string().trim().min(1).max(32),
    contentType: z.enum(ALLOWED_UPLOAD_MIME_TYPES).optional(),
    width: z.number().int().positive().max(20000).optional(),
    height: z.number().int().positive().max(20000).optional(),
    variant: variantSchema.optional().default("original"),
  }),
  posterOriginal: z
    .object({
      storagePath: z.string().trim().min(1),
      url: z.string().trim().url(),
      size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
      format: z.string().trim().min(1).max(32),
      contentType: imageMimeTypeSchema.optional(),
      width: z.number().int().positive().max(20000).optional(),
      height: z.number().int().positive().max(20000).optional(),
    })
    .optional(),
});

export const createWallpaperReportSchema = z.object({
  reason: reportReasonSchema,
  details: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((value) => value || undefined),
  reporterEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .transform((value) => value?.toLowerCase() || undefined),
});

export const reviewWallpaperReportSchema = z.object({
  status: reportStatusSchema,
  reviewNote: z
    .union([z.string().trim().max(1000), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value && value.length > 0 ? value : null;
    }),
  wallpaperStatus: statusSchema.optional(),
});

export const updateWallpaperSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: z
      .union([z.string().trim().max(2000), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value && value.length > 0 ? value : null;
      }),
    videoUrl: z
      .union([z.string().trim().url(), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }

        return value && value.length > 0 ? value : null;
      }),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
    colors: z
      .array(
        z
          .string()
          .trim()
          .regex(/^#?[0-9a-fA-F]{3,8}$/),
      )
      .max(8)
      .optional(),
    featured: z.boolean().optional(),
    status: statusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one wallpaper field must be provided.",
  });

export const batchRenameWallpapersSchema = z
  .object({
    strategy: z.enum(["explicit", "displayTitle"]).default("explicit"),
    fallbackTitle: z.string().trim().min(1).max(120).optional(),
    wallpaperIds: z.array(z.string().trim().min(1)).min(1).max(100).optional(),
    items: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          title: z.string().trim().min(1).max(120),
        }),
      )
      .min(1)
      .max(100)
      .optional(),
  })
  .superRefine((value, context) => {
    if (value.strategy === "explicit" && !value.items?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Explicit rename requires at least one {id, title} item.",
        path: ["items"],
      });
    }

    if (value.strategy === "displayTitle" && !value.wallpaperIds?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Display-title rename requires at least one wallpaper ID.",
        path: ["wallpaperIds"],
      });
    }
  });

export const batchUpdateWallpapersSchema = z
  .object({
    wallpaperIds: z.array(z.string().trim().min(1)).min(1).max(100),
    status: statusSchema.optional(),
    featured: z.boolean().optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
    appendTags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
    removeTags: z.array(z.string().trim().min(1).max(32)).max(12).optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.featured !== undefined ||
      value.tags !== undefined ||
      (value.appendTags?.length ?? 0) > 0 ||
      (value.removeTags?.length ?? 0) > 0,
    {
      message: "At least one batch wallpaper update field must be provided.",
    },
  );

export const cleanupDuplicateWallpapersSchema = z.object({
  creator: z.string().trim().max(64).optional(),
  dryRun: z.boolean().optional().default(false),
  groupKeys: z.array(z.string().trim().min(1)).min(1).max(100).optional(),
  keep: z.enum(["latest", "oldest"]).optional().default("latest"),
  limit: z.number().int().positive().max(100).optional(),
  reason: z
    .enum(["asset_id", "fallback_fingerprint", "all"])
    .optional()
    .default("asset_id"),
  status: z.enum(["all", "processing", "published", "rejected"]).optional(),
});

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type WallpaperRow = Database["public"]["Tables"]["wallpapers"]["Row"];
type WallpaperFileRow = Database["public"]["Tables"]["wallpaper_files"]["Row"];
type WallpaperReportRow =
  Database["public"]["Tables"]["wallpaper_reports"]["Row"];
type DownloadRow = Database["public"]["Tables"]["downloads"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type CollectionItemRow =
  Database["public"]["Tables"]["collection_items"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type IncrementWallpaperDownloadsRow =
  Database["public"]["Functions"]["increment_wallpaper_downloads"]["Returns"][number];

const WALLPAPER_FILE_QUERY_BATCH_SIZE = 200;

function getWallpaperDisplayTitle(
  wallpaper: Pick<Wallpaper, "title" | "aiTags" | "tags">,
) {
  const normalizedTitle = wallpaper.title.trim().toLowerCase();
  const looksLikeImportedFilename =
    /^(beauty|image|img|photo|wallpaper|lumen)[\s_-]*[a-z]*[\s_-]*\d{2,}$/i.test(
      normalizedTitle,
    ) ||
    /^(dsc|img|pxl|mvimg|mmexport|wechatimg)[\s_-]?\d+/i.test(normalizedTitle) ||
    /\b(copy|final|edit|export|upload)\b/i.test(normalizedTitle) ||
    /^精选壁纸(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^lumen curated(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^(?:[a-f0-9]{4,12}[\s_-]){3,}[a-f0-9]{4,24}$/i.test(normalizedTitle);

  return (
    wallpaper.aiTags.filter(Boolean).slice(0, 3).join(" · ") ||
    wallpaper.tags.filter(Boolean).slice(0, 3).join(" · ") ||
    (looksLikeImportedFilename ? "精选壁纸" : wallpaper.title)
  );
}

function looksLikeImportedWallpaperTitle(title: string) {
  const normalizedTitle = title.trim().toLowerCase();

  return (
    /^(beauty|image|img|photo|wallpaper|lumen)[\s_-]*[a-z]*[\s_-]*\d{2,}$/i.test(
      normalizedTitle,
    ) ||
    /^(dsc|img|pxl|mvimg|mmexport|wechatimg)[\s_-]?\d+/i.test(normalizedTitle) ||
    /\b(copy|final|edit|export|upload)\b/i.test(normalizedTitle) ||
    /^精选壁纸(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^lumen curated(?:\s+\d+)?$/i.test(normalizedTitle) ||
    /^(?:[a-f0-9]{4,12}[\s_-]){3,}[a-f0-9]{4,24}$/i.test(normalizedTitle)
  );
}

function buildSemanticWallpaperTitle(input: {
  aiTags?: string[];
  tags?: string[];
  fallback?: string;
}) {
  return (
    input.aiTags?.filter(Boolean).slice(0, 3).join(" · ") ||
    input.tags?.filter(Boolean).slice(0, 3).join(" · ") ||
    input.fallback ||
    "精选壁纸"
  );
}

function withDisplayTitle<T extends Wallpaper>(wallpaper: T): T {
  return {
    ...wallpaper,
    title: getWallpaperDisplayTitle(wallpaper),
  };
}

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
}

const TRANSIENT_SUPABASE_READ_RETRY_DELAYS_MS = [150, 400];

function isRetryableSupabaseReadError(error: unknown) {
  return (
    error instanceof Error &&
    /(fetch failed|terminated|econnreset|enotfound|etimedout|socket hang up)/i.test(
      error.message,
    )
  );
}

async function waitForRetry(delayMs: number) {
  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function withTransientSupabaseReadRetry<T>(
  label: string,
  operation: () => Promise<T>,
) {
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (
        !isRetryableSupabaseReadError(error) ||
        attempt >= TRANSIENT_SUPABASE_READ_RETRY_DELAYS_MS.length
      ) {
        throw error;
      }

      const delayMs = TRANSIENT_SUPABASE_READ_RETRY_DELAYS_MS[attempt];
      const message = error instanceof Error ? error.message : String(error);

      console.warn(
        `[supabase] ${label} transient read failure (attempt ${attempt + 1}), retrying in ${delayMs}ms: ${message}`,
      );

      attempt += 1;
      await waitForRetry(delayMs);
    }
  }
}

function normalizeColors(colors: string[]) {
  return [
    ...new Set(
      colors
        .map((color) => color.trim().toLowerCase())
        .filter(Boolean)
        .map((color) => (color.startsWith("#") ? color : `#${color}`)),
    ),
  ];
}

function getDefaultImportCreatorUsername() {
  return (
    process.env.LUMEN_DEFAULT_IMPORT_CREATOR_USERNAME?.trim() ||
    DEFAULT_MANUAL_IMPORT_CREATOR_USERNAME
  );
}

function isGeneratedR2VariantPath(path: string) {
  return GENERATED_R2_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getR2ImportableFileInfo(path: string): R2ImportableFileInfo | null {
  const normalizedPath = normalizeR2StoragePath(path);
  const filename = normalizedPath.split("/").pop() ?? "";
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";

  if (!normalizedPath || normalizedPath.endsWith("/") || !extension) {
    return null;
  }

  if (isGeneratedR2VariantPath(normalizedPath)) {
    return null;
  }

  if (!(extension in IMPORTABLE_R2_FILE_TYPES)) {
    return null;
  }

  return IMPORTABLE_R2_FILE_TYPES[
    extension as keyof typeof IMPORTABLE_R2_FILE_TYPES
  ];
}

function inferWallpaperTitleFromR2Key(path: string) {
  const normalizedPath = normalizeR2StoragePath(path);
  const filename = normalizedPath.split("/").pop() ?? normalizedPath;
  const basename = filename.replace(/\.[^.]+$/, "");
  const serial = basename.match(/(\d{2,})$/)?.[1];

  if (serial) {
    return `Lumen Curated ${serial}`;
  }

  return "Lumen Curated";
}

function createR2ImportCandidate(
  object: R2ImportObjectInput,
): R2ImportCandidate | null {
  const normalizedKey = normalizeR2StoragePath(object.key);
  const info = getR2ImportableFileInfo(normalizedKey);

  if (!info) {
    return null;
  }

  return {
    key: normalizedKey,
    publicUrl: getR2ObjectUrl(normalizedKey),
    size: object.size,
    lastModified: object.lastModified,
    kind: info.kind,
    format: info.format,
    mimeType: info.mimeType,
    inferredTitle: inferWallpaperTitleFromR2Key(normalizedKey),
    alreadyImported: false,
    existingWallpaperId: null,
  };
}

async function resolveImportedR2Candidates(candidates: R2ImportCandidate[]) {
  if (candidates.length === 0) {
    return [];
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpaperFilesTable)
    .select("wallpaper_id,storage_path")
    .in(
      "storage_path",
      candidates.map((candidate) => candidate.key),
    );

  if (error) {
    throw new Error(`Failed to inspect imported R2 files: ${error.message}`);
  }

  const importedMap = new Map(
    data.map((row) => [row.storage_path, String(row.wallpaper_id)]),
  );

  return candidates.map((candidate) => ({
    ...candidate,
    alreadyImported: importedMap.has(candidate.key),
    existingWallpaperId: importedMap.get(candidate.key) ?? null,
  }));
}

async function importResolvedR2Candidates(
  candidates: R2ImportCandidate[],
  creatorUsername: string,
) {
  const results: R2ImportResult[] = [];

  for (const candidate of candidates.filter((entry) => !entry.alreadyImported)) {
    try {
      const createdWallpaper = await createWallpaperRecord(
        {
          title: candidate.inferredTitle,
          description: undefined,
          videoUrl:
            candidate.kind === "video" ? candidate.publicUrl : undefined,
          tags: [],
          colors: [],
          featured: false,
          status: "published",
          licenseAccepted: true,
          licenseVersion: DEFAULT_LICENSE_VERSION,
          creator: {
            email: undefined,
            username: creatorUsername,
          },
          original: {
            storagePath: candidate.key,
            url: candidate.publicUrl,
            size: candidate.size,
            format: candidate.format,
            variant: "original",
            contentType:
              candidate.mimeType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
          },
        },
        {
          preserveSourceObjects: true,
          skipAiEnrichment: true,
          skipVariantGeneration: true,
        },
      );

      if (!createdWallpaper) {
        throw new Error("导入完成后未返回壁纸记录。");
      }

      results.push({
        key: candidate.key,
        status: "imported",
        kind: candidate.kind,
        title: createdWallpaper.title,
        wallpaperId: createdWallpaper.id,
        slug: createdWallpaper.slug,
        message: "已导入到前台并写入数据库。",
      });
    } catch (error) {
      results.push({
        key: candidate.key,
        status: "failed",
        kind: candidate.kind,
        title: candidate.inferredTitle,
        wallpaperId: null,
        slug: null,
        message:
          error instanceof Error ? error.message : "导入失败，请稍后再试。",
      });
    }
  }

  return results;
}

function isVideoWallpaperInput(input: z.infer<typeof createWallpaperSchema>) {
  return Boolean(
    input.videoUrl ||
      (input.original.contentType &&
        isVideoUploadMimeType(input.original.contentType)) ||
      isVideoUploadMimeType(input.original.format),
  );
}

function toSlug(input: string) {
  const sanitized = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || `wallpaper-${crypto.randomUUID().slice(0, 8)}`;
}

function mapCreator(row: UserRow): CreatorProfile {
  return {
    id: String(row.id),
    email: row.email,
    username: row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    createdAt: row.created_at,
  };
}

function mapWallpaperFile(row: WallpaperFileRow): WallpaperFile {
  const storagePath = normalizeR2StoragePath(row.storage_path || row.url);
  const resolvedUrl = storagePath ? getR2ObjectUrl(storagePath) : row.url;

  return {
    id: String(row.id),
    wallpaperId: String(row.wallpaper_id),
    variant: row.variant,
    storagePath,
    url: resolvedUrl,
    size: row.size,
    format: row.format,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

function normalizeWallpaperDescription(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized === "从 Cloudflare R2 手动导入的原图。" ||
    normalized === "从 Cloudflare R2 手动导入的原图" ||
    (normalized.includes("Cloudflare R2") &&
      normalized.includes("手动导入") &&
      normalized.includes("原图"))
  ) {
    return null;
  }

  return normalized;
}

function mapWallpaper(
  row: WallpaperRow,
  files: WallpaperFile[],
  creator: CreatorProfile | null,
): Wallpaper {
  return {
    id: String(row.id),
    userId: row.user_id === null ? null : String(row.user_id),
    title: row.title,
    slug: row.slug,
    description: normalizeWallpaperDescription(row.description),
    videoUrl: row.video_url ?? null,
    status: row.status,
    tags: row.tags,
    aiTags: row.ai_tags ?? [],
    aiCategory: row.ai_category ?? null,
    aiCaption: row.ai_caption ?? null,
    aiProvider: row.ai_provider ?? null,
    aiModel: row.ai_model ?? null,
    aiAnalysisStatus:
      (row.ai_analysis_status as WallpaperAiAnalysisStatus | null) ?? "skipped",
    aiAnalysisError: row.ai_analysis_error ?? null,
    aiAnalyzedAt: row.ai_analyzed_at ?? null,
    colors: row.colors,
    width: row.width,
    height: row.height,
    downloadsCount: row.downloads_count,
    likesCount: row.likes_count,
    reportsCount: row.reports_count ?? 0,
    featured: row.featured,
    licenseConfirmedAt: row.license_confirmed_at ?? null,
    licenseVersion: row.license_version ?? null,
    lastReportedAt: row.last_reported_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    files,
    creator,
  };
}

function mapWallpaperReportReceipt(
  row: WallpaperReportRow,
): WallpaperReportReceipt {
  return {
    id: String(row.id),
    wallpaperId: String(row.wallpaper_id),
    reason: row.reason as WallpaperReportReason,
    status: row.status,
    reporterEmail: row.reporter_email,
    createdAt: row.created_at,
  };
}

function mapWallpaperReport(
  row: WallpaperReportRow,
  wallpaper: Wallpaper | null,
  reporter: CreatorProfile | null,
): WallpaperReport {
  return {
    id: String(row.id),
    wallpaperId: String(row.wallpaper_id),
    reporterUserId:
      row.reporter_user_id === null ? null : String(row.reporter_user_id),
    reporterEmail: row.reporter_email,
    reporterIp: row.reporter_ip,
    reason: row.reason as WallpaperReportReason,
    details: row.details,
    status: row.status as WallpaperReportStatus,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewNote: row.review_note,
    wallpaper,
    reporter,
  };
}

function mapCollection(row: CollectionRow): LibraryCollection {
  return {
    id: String(row.id),
    name: row.name,
    isPublic: row.is_public,
    createdAt: row.created_at,
  };
}

function mapCollectionDetail(
  row: CollectionRow,
  wallpapers: Wallpaper[],
): LibraryCollectionDetail {
  return {
    ...mapCollection(row),
    itemCount: wallpapers.length,
    wallpapers,
  };
}

function mapNotification(
  row: NotificationRow,
  wallpaper: Wallpaper | null,
): LibraryNotificationItem {
  return {
    id: String(row.id),
    kind: row.kind,
    title: row.title,
    body: row.body,
    href: row.href,
    readAt: row.read_at,
    createdAt: row.created_at,
    wallpaper,
  };
}

function getFallbackWallpaperDimensions(
  shape: (typeof moodCards)[number]["shape"],
) {
  if (shape === "landscape") {
    return {
      width: 3840,
      height: 2160,
    };
  }

  if (shape === "square") {
    return {
      width: 2880,
      height: 2880,
    };
  }

  if (shape === "tall") {
    return {
      width: 2160,
      height: 3840,
    };
  }

  return {
    width: 2400,
    height: 3600,
  };
}

function createFallbackWallpaperFiles(
  card: (typeof moodCards)[number],
  dimensions: {
    width: number;
    height: number;
  },
): WallpaperFile[] {
  const now = new Date().toISOString();
  const variants: Array<WallpaperFile["variant"]> = [
    "preview",
    "thumb",
    "4k",
    "original",
  ];

  return variants.map((variant) => {
    const isOriginal = variant === "original";
    const width =
      variant === "preview"
        ? Math.round(dimensions.width * 0.35)
        : variant === "thumb"
          ? Math.round(dimensions.width * 0.55)
          : dimensions.width;
    const height =
      variant === "preview"
        ? Math.round(dimensions.height * 0.35)
        : variant === "thumb"
          ? Math.round(dimensions.height * 0.55)
          : dimensions.height;

    return {
      id: `${card.id}-${variant}`,
      wallpaperId: card.id,
      variant,
      storagePath: createFallbackWallpaperStoragePath({
        slug: card.id,
        variant,
      }),
      url: createFallbackWallpaperAssetUrl({
        slug: card.id,
        variant,
      }),
      size: isOriginal ? 180_000 : 86_000,
      format: "image/svg+xml",
      width,
      height,
      createdAt: now,
    };
  });
}

function createFallbackWallpaper(index: number): Wallpaper {
  const card = moodCards[index];
  const dimensions = getFallbackWallpaperDimensions(card.shape);

  return {
    id: card.id,
    userId: null,
    title: card.name,
    slug: card.id,
    description: null,
    videoUrl: null,
    status: "published",
    tags: [card.meta.split("·")[0]?.trim() ?? "精选"],
    aiTags: [],
    aiCategory: null,
    aiCaption: null,
    aiProvider: null,
    aiModel: null,
    aiAnalysisStatus: "skipped",
    aiAnalysisError: null,
    aiAnalyzedAt: null,
    colors: [],
    width: dimensions.width,
    height: dimensions.height,
    downloadsCount: 0,
    likesCount: 0,
    reportsCount: 0,
    featured: index < 3,
    licenseConfirmedAt: null,
    licenseVersion: DEFAULT_LICENSE_VERSION,
    lastReportedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: createFallbackWallpaperFiles(card, dimensions),
    creator: null,
  };
}

function getFallbackWallpapers() {
  return moodCards.map((_, index) => createFallbackWallpaper(index));
}

function getFallbackWallpaperByIdentifier(identifier: string) {
  return (
    getFallbackWallpapers().find(
      (wallpaper) =>
        wallpaper.id === identifier || wallpaper.slug === identifier,
    ) ?? null
  );
}

function toDbIdValue(id: string | number) {
  if (typeof id === "number") {
    return id;
  }

  return /^\d+$/.test(id) ? Number(id) : id;
}

function getWallpaperFileByVariant(
  wallpaper: Pick<Wallpaper, "files">,
  variant: WallpaperFile["variant"],
) {
  return wallpaper.files.find((file) => file.variant === variant) ?? null;
}

function getWallpaperOriginalFile(wallpaper: Pick<Wallpaper, "files">) {
  return getWallpaperFileByVariant(wallpaper, "original") ?? wallpaper.files[0] ?? null;
}

function getWallpaperDeduplicationKey(wallpaper: Wallpaper) {
  const originalFile = getWallpaperOriginalFile(wallpaper);
  const primarySource =
    originalFile?.storagePath ||
    originalFile?.url ||
    wallpaper.videoUrl ||
    null;

  if (primarySource) {
    const assetId = getR2AssetId(primarySource);

    if (assetId) {
      return `asset:${wallpaper.videoUrl ? "video" : "image"}:${assetId}`;
    }
  }

  return [
    "fallback",
    wallpaper.creator?.username ?? wallpaper.userId ?? "anonymous",
    wallpaper.title.trim().toLowerCase(),
    wallpaper.width ?? "w",
    wallpaper.height ?? "h",
    wallpaper.videoUrl ? "video" : "image",
  ].join(":");
}

function dedupeWallpapers(wallpapers: Wallpaper[]) {
  const seen = new Set<string>();

  return wallpapers.filter((wallpaper) => {
    const key = getWallpaperDeduplicationKey(wallpaper);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getWallpaperAnalysisFile(wallpaper: Pick<Wallpaper, "files">) {
  return (
    getWallpaperFileByVariant(wallpaper, "preview") ??
    getWallpaperFileByVariant(wallpaper, "thumb") ??
    getWallpaperOriginalFile(wallpaper)
  );
}

function hasCompleteWallpaperVariants(wallpaper: Pick<Wallpaper, "files">) {
  return ["4k", "thumb", "preview"].every((variant) => {
    return wallpaper.files.some((file) => file.variant === variant);
  });
}

function normalizeSearchValue(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function wallpaperMatchesTag(
  wallpaper: Pick<Wallpaper, "aiTags" | "tags">,
  tag: string | undefined,
) {
  if (!tag) {
    return true;
  }

  const normalizedTag = normalizeSearchValue(tag);

  return [...wallpaper.tags, ...wallpaper.aiTags].some(
    (candidate) => normalizeSearchValue(candidate) === normalizedTag,
  );
}

function wallpaperMatchesSearch(
  wallpaper: Pick<
    Wallpaper,
    | "aiCaption"
    | "aiCategory"
    | "aiTags"
    | "creator"
    | "description"
    | "tags"
    | "title"
  >,
  search: string | undefined,
) {
  const normalizedSearch = normalizeSearchValue(search);

  if (!normalizedSearch) {
    return true;
  }

  return [
    wallpaper.title,
    wallpaper.description ?? "",
    wallpaper.aiCaption ?? "",
    wallpaper.aiCategory ?? "",
    wallpaper.creator?.username ?? "",
    ...wallpaper.tags,
    ...wallpaper.aiTags,
  ].some((value) => normalizeSearchValue(value).includes(normalizedSearch));
}

function normalizeInsPickMarker(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.#_@/\\|()[\]{}:;'"，。、“”‘’·・\-\s]+/g, "");
}

export function isInsPickWallpaper(wallpaper: Wallpaper) {
  const tagSet = new Set(
    [...wallpaper.tags, ...wallpaper.aiTags]
      .map(normalizeInsPickMarker)
      .filter(Boolean),
  );
  const filePaths = wallpaper.files.flatMap((file) => [
    file.storagePath,
    file.url,
  ]);

  return (
    tagSet.has("ins") ||
    tagSet.has("instagrampost") ||
    filePaths.some((value) =>
      normalizeInsPickMarker(value).includes("inspicks"),
    )
  );
}

function filterWallpapers(
  wallpapers: Wallpaper[],
  options: Pick<
    WallpaperListOptions,
    | "aspect"
    | "category"
    | "color"
    | "featured"
    | "includeInsPicks"
    | "media"
    | "minHeight"
    | "minWidth"
    | "motion"
    | "orientation"
    | "resolution"
    | "search"
    | "sort"
    | "style"
    | "tag"
  >,
) {
  const filteredWallpapers = wallpapers.filter((wallpaper) => {
    const matchesFeatured =
      options.featured === undefined || wallpaper.featured === options.featured;

    return (
      matchesFeatured &&
      (options.includeInsPicks !== false || !isInsPickWallpaper(wallpaper)) &&
      matchesWallpaperMedia(wallpaper, {
        media: options.media,
        motion: options.motion,
      }) &&
      matchesWallpaperOrientation(wallpaper, options.orientation) &&
      matchesWallpaperAspect(wallpaper, options.aspect) &&
      matchesWallpaperResolution(wallpaper, options.resolution) &&
      matchesWallpaperMinimumDimensions(wallpaper, {
        minHeight: options.minHeight,
        minWidth: options.minWidth,
      }) &&
      matchesWallpaperColor(wallpaper, options.color) &&
      matchesWallpaperStyle(wallpaper, options.style) &&
      wallpaperMatchesTag(wallpaper, options.tag) &&
      matchesExploreCategory(wallpaper, options.category) &&
      wallpaperMatchesSearch(wallpaper, options.search)
    );
  });

  return sortWallpapers(filteredWallpapers, options.sort);
}

function orderWallpapersByIds(
  wallpapers: Wallpaper[],
  orderedIds: Array<string | number>,
) {
  const wallpaperMap = new Map(
    wallpapers.map((wallpaper) => [String(wallpaper.id), wallpaper]),
  );

  return orderedIds
    .map((id) => wallpaperMap.get(String(id)) ?? null)
    .filter((wallpaper): wallpaper is Wallpaper => wallpaper !== null);
}

function normalizeSimilarityValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getSimilarityTerms(wallpaper: Wallpaper) {
  return [
    ...wallpaper.tags,
    ...wallpaper.aiTags,
    wallpaper.aiCategory ?? "",
  ]
    .map(normalizeSimilarityValue)
    .filter(Boolean);
}

function countSharedSimilarityTerms(left: Wallpaper, right: Wallpaper) {
  const leftTerms = new Set(getSimilarityTerms(left));

  return getSimilarityTerms(right).filter((term) => leftTerms.has(term)).length;
}

function getPrimaryColorFamilies(wallpaper: Wallpaper) {
  return wallpaper.colors
    .map((color) => color.trim().replace(/^#/, "").toLowerCase())
    .filter((color) => /^[0-9a-f]{6}$/.test(color))
    .slice(0, 5);
}

function countSharedColors(left: Wallpaper, right: Wallpaper) {
  const leftColors = new Set(getPrimaryColorFamilies(left));

  return getPrimaryColorFamilies(right).filter((color) => leftColors.has(color))
    .length;
}

function getWallpaperRatio(wallpaper: Wallpaper) {
  const width =
    wallpaper.width ??
    wallpaper.files.find((file) => file.width && file.height)?.width ??
    null;
  const height =
    wallpaper.height ??
    wallpaper.files.find((file) => file.width && file.height)?.height ??
    null;

  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  return width / height;
}

function hasSimilarRatio(left: Wallpaper, right: Wallpaper) {
  const leftRatio = getWallpaperRatio(left);
  const rightRatio = getWallpaperRatio(right);

  if (!leftRatio || !rightRatio) {
    return false;
  }

  return Math.abs(leftRatio - rightRatio) <= 0.12;
}

function scoreSimilarWallpaper(source: Wallpaper, candidate: Wallpaper) {
  const sharedTerms = countSharedSimilarityTerms(source, candidate);
  const sharedColors = countSharedColors(source, candidate);
  const sameCreator =
    source.creator?.username &&
    source.creator.username === candidate.creator?.username;
  const sameMediaKind = Boolean(source.videoUrl) === Boolean(candidate.videoUrl);

  return (
    sharedTerms * 12 +
    sharedColors * 10 +
    (sameCreator ? 24 : 0) +
    (hasSimilarRatio(source, candidate) ? 14 : 0) +
    (sameMediaKind ? 4 : 0) +
    candidate.downloadsCount * 0.04 +
    candidate.likesCount * 0.08
  );
}

function rankSimilarWallpapers(source: Wallpaper, candidates: Wallpaper[]) {
  return [...candidates]
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => ({
      candidate,
      score: scoreSimilarWallpaper(source, candidate),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      return (
        right.score - left.score ||
        right.candidate.downloadsCount - left.candidate.downloadsCount ||
        Date.parse(right.candidate.createdAt) -
          Date.parse(left.candidate.createdAt)
      );
    })
    .map((item) => withDisplayTitle(item.candidate));
}

function createSimilarGroup(
  kind: SimilarWallpaperGroup["kind"],
  label: string,
  wallpapers: Wallpaper[],
): SimilarWallpaperGroup {
  return {
    kind,
    label,
    wallpapers,
  };
}

function getWallpaperDownloadPath(
  wallpaper: Pick<Wallpaper, "slug">,
  variant: WallpaperFile["variant"],
) {
  return `/api/wallpapers/${encodeURIComponent(wallpaper.slug)}/download?variant=${encodeURIComponent(variant)}`;
}

function toMotionAsset(
  wallpaper: Pick<Wallpaper, "slug">,
  file: WallpaperFile,
  kind: WallpaperMotionAsset["kind"],
): WallpaperMotionAsset {
  return {
    contentType: file.format,
    downloadUrl: getWallpaperDownloadPath(wallpaper, file.variant),
    height: file.height,
    kind,
    sizeBytes: file.size,
    url: file.url,
    variant: file.variant,
    width: file.width,
  };
}

function sortMotionPosterFiles(files: WallpaperFile[]) {
  const priority: WallpaperFile["variant"][] = [
    "preview",
    "thumb",
    "4k",
    "original",
  ];

  return [...files].sort((left, right) => {
    return (
      priority.indexOf(left.variant) - priority.indexOf(right.variant) ||
      (right.width ?? 0) * (right.height ?? 0) -
        (left.width ?? 0) * (left.height ?? 0)
    );
  });
}

function getWallpaperMotionVideoFile(wallpaper: Wallpaper) {
  return (
    wallpaper.files.find(
      (file) => file.variant === "original" && isVideoWallpaperFile(file),
    ) ?? wallpaper.files.find(isVideoWallpaperFile) ?? null
  );
}

function getWallpaperPosterFiles(wallpaper: Wallpaper) {
  return sortMotionPosterFiles(
    wallpaper.files.filter((file) => !isVideoWallpaperFile(file)),
  );
}

async function getOrCreateFavoritesCollection(userId: string | number) {
  const client = createSupabaseAdminClient();
  const normalizedUserId = toDbIdValue(userId);
  const { data: existing, error: lookupError } = await client
    .from(collectionsTable)
    .select("*")
    .eq("user_id", normalizedUserId)
    .eq("name", DEFAULT_FAVORITES_COLLECTION_NAME)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to load favorites collection: ${lookupError.message}`,
    );
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await client
    .from(collectionsTable)
    .insert({
      user_id: normalizedUserId,
      name: DEFAULT_FAVORITES_COLLECTION_NAME,
      is_public: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create favorites collection: ${error.message}`);
  }

  return data;
}

async function syncFavoritesCollection(userId: string | number) {
  const client = createSupabaseAdminClient();
  const normalizedUserId = toDbIdValue(userId);
  const collection = await getOrCreateFavoritesCollection(userId);
  const { data: likes, error: likesError } = await client
    .from(likesTable)
    .select("wallpaper_id, created_at")
    .eq("user_id", normalizedUserId);

  if (likesError) {
    throw new Error(
      `Failed to load likes for library sync: ${likesError.message}`,
    );
  }

  if (likes.length > 0) {
    const { error: syncError } = await client.from(collectionItemsTable).upsert(
      likes.map((like) => ({
        collection_id: collection.id,
        wallpaper_id: like.wallpaper_id,
        added_at: like.created_at,
      })),
      {
        onConflict: "collection_id,wallpaper_id",
      },
    );

    if (syncError) {
      throw new Error(
        `Failed to sync favorites collection items: ${syncError.message}`,
      );
    }
  }

  const likedWallpaperIds = new Set(
    likes.map((like) => String(like.wallpaper_id)),
  );
  const { data: collectionItems, error: itemsError } = await client
    .from(collectionItemsTable)
    .select("wallpaper_id")
    .eq("collection_id", collection.id);

  if (itemsError) {
    throw new Error(
      `Failed to inspect favorites collection items: ${itemsError.message}`,
    );
  }

  const staleIds = collectionItems
    .map((item) => item.wallpaper_id)
    .filter((wallpaperId) => !likedWallpaperIds.has(String(wallpaperId)));

  if (staleIds.length > 0) {
    const { error: cleanupError } = await client
      .from(collectionItemsTable)
      .delete()
      .eq("collection_id", collection.id)
      .in("wallpaper_id", staleIds);

    if (cleanupError) {
      throw new Error(
        `Failed to clean favorites collection items: ${cleanupError.message}`,
      );
    }
  }

  return collection;
}

async function loadUserCollectionRow(
  userId: string | number,
  collectionId: string | number,
) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(collectionsTable)
    .select("*")
    .eq("id", toDbIdValue(collectionId))
    .eq("user_id", toDbIdValue(userId))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load collection: ${error.message}`);
  }

  return data;
}

function countCollectionItems(items: Pick<CollectionItemRow, "collection_id">[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const collectionId = String(item.collection_id);
    counts.set(collectionId, (counts.get(collectionId) ?? 0) + 1);
  }

  return counts;
}

async function hydrateCollectionWallpapers(items: CollectionItemRow[]) {
  const wallpaperIds = items.map((item) => item.wallpaper_id);

  if (wallpaperIds.length === 0) {
    return [] satisfies Wallpaper[];
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpapersTable)
    .select("*")
    .in("id", wallpaperIds)
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to hydrate collection wallpapers: ${error.message}`);
  }

  return orderWallpapersByIds(
    (await hydrateWallpapers(data ?? [])).map(withDisplayTitle),
    wallpaperIds,
  );
}

export async function listUserCollections(
  userId: string | number,
): Promise<LibraryCollection[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  const normalizedUserId = toDbIdValue(userId);

  await syncFavoritesCollection(userId);

  const { data: collections, error: collectionsError } = await client
    .from(collectionsTable)
    .select("*")
    .eq("user_id", normalizedUserId)
    .order("created_at", { ascending: false });

  if (collectionsError) {
    throw new Error(`Failed to list collections: ${collectionsError.message}`);
  }

  const collectionIds = (collections ?? []).map((collection) => collection.id);

  if (collectionIds.length === 0) {
    return [];
  }

  const { data: items, error: itemsError } = await client
    .from(collectionItemsTable)
    .select("collection_id")
    .in("collection_id", collectionIds);

  if (itemsError) {
    throw new Error(`Failed to count collection items: ${itemsError.message}`);
  }

  const itemCounts = countCollectionItems(items ?? []);

  return (collections ?? []).map((collection) => ({
    ...mapCollection(collection),
    itemCount: itemCounts.get(String(collection.id)) ?? 0,
  }));
}

export async function createUserCollection(
  userId: string | number,
  input: {
    isPublic?: boolean;
    name: string;
  },
): Promise<LibraryCollectionMutationResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(collectionsTable)
    .insert({
      user_id: toDbIdValue(userId),
      name: input.name.trim(),
      is_public: input.isPublic ?? false,
    })
    .select("*")
    .single();

  if (error) {
    const errorCode =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";

    if (errorCode === "23505") {
      throw new Error("Collection name already exists.");
    }

    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return {
    collection: {
      ...mapCollection(data),
      itemCount: 0,
    },
  };
}

export async function getUserCollectionDetail(
  userId: string | number,
  collectionId: string | number,
): Promise<LibraryCollectionDetail | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const collection = await loadUserCollectionRow(userId, collectionId);

  if (!collection) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data: items, error: itemsError } = await client
    .from(collectionItemsTable)
    .select("*")
    .eq("collection_id", collection.id)
    .order("added_at", { ascending: false });

  if (itemsError) {
    throw new Error(`Failed to load collection items: ${itemsError.message}`);
  }

  const wallpapers = await hydrateCollectionWallpapers(items ?? []);

  return mapCollectionDetail(collection, wallpapers);
}

export async function addWallpaperToCollection(
  userId: string | number,
  collectionId: string | number,
  wallpaperIdentifier: string,
): Promise<LibraryCollectionItemMutationResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const collection = await loadUserCollectionRow(userId, collectionId);
  const wallpaper = await getWallpaperByIdOrSlug(wallpaperIdentifier);

  if (!collection || !wallpaper || wallpaper.status !== "published") {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { error } = await client.from(collectionItemsTable).upsert(
    {
      collection_id: collection.id,
      wallpaper_id: toDbIdValue(wallpaper.id),
    },
    {
      onConflict: "collection_id,wallpaper_id",
    },
  );

  if (error) {
    throw new Error(`Failed to add wallpaper to collection: ${error.message}`);
  }

  const detail = await getUserCollectionDetail(userId, collection.id);

  if (!detail) {
    return null;
  }

  return {
    collection: detail,
    wallpaper: withDisplayTitle(wallpaper),
  };
}

export async function removeWallpaperFromCollection(
  userId: string | number,
  collectionId: string | number,
  wallpaperIdentifier: string,
): Promise<LibraryCollectionItemMutationResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const collection = await loadUserCollectionRow(userId, collectionId);
  const wallpaper = await getWallpaperByIdOrSlug(wallpaperIdentifier);

  if (!collection || !wallpaper) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { error } = await client
    .from(collectionItemsTable)
    .delete()
    .eq("collection_id", collection.id)
    .eq("wallpaper_id", toDbIdValue(wallpaper.id));

  if (error) {
    throw new Error(
      `Failed to remove wallpaper from collection: ${error.message}`,
    );
  }

  const detail = await getUserCollectionDetail(userId, collection.id);

  if (!detail) {
    return null;
  }

  return {
    collection: detail,
    wallpaper: withDisplayTitle(wallpaper),
  };
}

async function persistWallpaperAiMetadata(
  wallpaperId: string | number,
  patch: Database["public"]["Tables"]["wallpapers"]["Update"],
) {
  try {
    const client = createSupabaseAdminClient();
    const { error } = await client
      .from(wallpapersTable)
      .update(patch)
      .eq("id", toDbIdValue(wallpaperId));

    if (error) {
      throw error;
    }
  } catch (error) {
    console.warn(
      "[wallpaper-ai] Failed to persist AI metadata:",
      error instanceof Error ? error.message : error,
    );
  }
}

async function enrichWallpaperWithAiMetadata(
  wallpaperId: string | number,
  input: {
    description?: string | null;
    imageUrl: string;
    title: string;
  },
  options: {
    providerOverride?: WallpaperAiProviderOverride;
  } = {},
) {
  await persistWallpaperAiMetadata(wallpaperId, {
    ai_analysis_status: "pending",
    ai_analysis_error: null,
  });

  try {
    const analysis = await analyzeWallpaperWithFallback(input, {
      providerOverride: options.providerOverride,
    });

    if (!analysis) {
      await persistWallpaperAiMetadata(wallpaperId, {
        ai_analysis_error: null,
        ai_analysis_status: "skipped",
      });
      return null;
    }

    await persistWallpaperAiMetadata(wallpaperId, {
      ai_tags: [
        ...new Set(analysis.tags.map((tag) => tag.trim()).filter(Boolean)),
      ],
      ai_category: analysis.category,
      ai_caption: analysis.caption,
      ai_provider: analysis.providerLabel,
      ai_model: analysis.model,
      ai_analysis_status: "completed",
      ai_analysis_error: null,
      ai_analyzed_at: new Date().toISOString(),
      ...(looksLikeImportedWallpaperTitle(input.title)
        ? {
            title: buildSemanticWallpaperTitle({
              aiTags: analysis.tags,
              fallback: "精选壁纸",
            }),
          }
        : {}),
    });

    return analysis;
  } catch (error) {
    await persistWallpaperAiMetadata(wallpaperId, {
      ai_analysis_status: "failed",
      ai_analysis_error:
        error instanceof Error
          ? error.message.slice(0, 1000)
          : "Unknown AI error.",
      ai_analyzed_at: new Date().toISOString(),
    });

    console.warn(
      "[wallpaper-ai] AI enrichment skipped:",
      error instanceof Error ? error.message : error,
    );

    return null;
  }
}

async function fetchFilesMap(wallpaperIds: Array<string | number>) {
  if (!wallpaperIds.length) {
    return new Map<string, WallpaperFile[]>();
  }

  const client = createSupabaseAdminClient();
  const rows: WallpaperFileRow[] = [];

  // Supabase REST responses are commonly capped at 1,000 rows. Four variants
  // per wallpaper means one huge query can drop file records for newer items.
  for (
    let index = 0;
    index < wallpaperIds.length;
    index += WALLPAPER_FILE_QUERY_BATCH_SIZE
  ) {
    const batch = wallpaperIds.slice(
      index,
      index + WALLPAPER_FILE_QUERY_BATCH_SIZE,
    );
    const { data, error } = await client
      .from(wallpaperFilesTable)
      .select("*")
      .in("wallpaper_id", batch);

    if (error) {
      throw new Error(`Failed to load wallpaper files: ${error.message}`);
    }

    rows.push(...data);
  }

  const map = new Map<string, WallpaperFile[]>();

  for (const row of rows) {
    const file = mapWallpaperFile(row);
    const existing = map.get(file.wallpaperId) ?? [];
    existing.push(file);
    map.set(file.wallpaperId, existing);
  }

  return map;
}

async function fetchCreatorsMap(userIds: Array<string | number>) {
  if (!userIds.length) {
    return new Map<string, CreatorProfile>();
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(usersTable)
    .select("*")
    .in("id", userIds);

  if (error) {
    throw new Error(`Failed to load creators: ${error.message}`);
  }

  return new Map(data.map((row) => [String(row.id), mapCreator(row)]));
}

async function hydrateWallpapers(
  rows: WallpaperRow[],
  options?: {
    dedupe?: boolean;
  },
) {
  const fileMap = await fetchFilesMap(rows.map((row) => row.id));
  const creatorMap = await fetchCreatorsMap(
    rows.flatMap((row) => (row.user_id ? [row.user_id] : [])),
  );

  const wallpapers = rows.map((row) =>
    mapWallpaper(
      row,
      fileMap.get(String(row.id)) ?? [],
      row.user_id ? (creatorMap.get(String(row.user_id)) ?? null) : null,
    ),
  );

  return options?.dedupe === false ? wallpapers : dedupeWallpapers(wallpapers);
}

async function hydrateWallpaperReports(rows: WallpaperReportRow[]) {
  const client = createSupabaseAdminClient();
  const wallpaperIds = [...new Set(rows.map((row) => row.wallpaper_id))];
  const reporterIds = [
    ...new Set(
      rows.flatMap((row) =>
        row.reporter_user_id === null ? [] : [row.reporter_user_id],
      ),
    ),
  ];
  let wallpaperMap = new Map<string, Wallpaper>();

  if (wallpaperIds.length > 0) {
    const { data: wallpaperRows, error: wallpaperError } = await client
      .from(wallpapersTable)
      .select("*")
      .in("id", wallpaperIds);

    if (wallpaperError) {
      throw new Error(
        `Failed to hydrate wallpaper reports: ${wallpaperError.message}`,
      );
    }

    wallpaperMap = new Map(
      (await hydrateWallpapers(wallpaperRows)).map((wallpaper) => [
        String(wallpaper.id),
        wallpaper,
      ]),
    );
  }

  const reporterMap = await fetchCreatorsMap(reporterIds);

  return rows.map((row) =>
    mapWallpaperReport(
      row,
      wallpaperMap.get(String(row.wallpaper_id)) ?? null,
      row.reporter_user_id
        ? (reporterMap.get(String(row.reporter_user_id)) ?? null)
        : null,
    ),
  );
}

function matchesReportSearch(
  report: WallpaperReport,
  options?: {
    creator?: string;
    search?: string;
  },
) {
  const normalizedCreator = normalizeSearchValue(options?.creator);
  const normalizedSearch = normalizeSearchValue(options?.search);

  if (normalizedCreator) {
    const creatorUsername = normalizeSearchValue(
      report.wallpaper?.creator?.username,
    );

    if (!creatorUsername.includes(normalizedCreator)) {
      return false;
    }
  }

  if (!normalizedSearch) {
    return true;
  }

  return [
    report.wallpaper?.title ?? "",
    report.wallpaper?.slug ?? "",
    report.wallpaper?.creator?.username ?? "",
    report.reporter?.username ?? "",
    report.reporterEmail ?? "",
    report.reason,
    report.details ?? "",
    report.reviewNote ?? "",
    report.status,
  ].some((value) => normalizeSearchValue(value).includes(normalizedSearch));
}

async function ensureUniqueSlug(baseSlug: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpapersTable)
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (error) {
    throw new Error(`Failed to validate slug uniqueness: ${error.message}`);
  }

  const existing = new Set(data.map((row) => row.slug));

  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;

  while (existing.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

async function resolveCreatorId(
  creator: z.infer<typeof createWallpaperSchema>["creator"],
) {
  const fallbackCreator: {
    email?: string | null;
    username?: string;
    bio?: string;
  } =
    creator?.username || creator?.email
      ? creator
      : {
          username:
            process.env.LUMEN_DEFAULT_IMPORT_CREATOR_USERNAME?.trim() ||
            DEFAULT_MANUAL_IMPORT_CREATOR_USERNAME,
          bio:
            process.env.LUMEN_DEFAULT_IMPORT_CREATOR_BIO?.trim() ||
            DEFAULT_MANUAL_IMPORT_CREATOR_BIO,
        };

  if (!fallbackCreator?.username && !fallbackCreator?.email) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const normalizedEmail = fallbackCreator.email ?? null;

  if (normalizedEmail) {
    const existingByEmail = await client
      .from(usersTable)
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingByEmail.error) {
      throw new Error(
        `Failed to find creator by email: ${existingByEmail.error.message}`,
      );
    }

    if (existingByEmail.data) {
      return existingByEmail.data.id;
    }
  }

  if (fallbackCreator.username) {
    const existingByUsername = await client
      .from(usersTable)
      .select("*")
      .eq("username", fallbackCreator.username)
      .maybeSingle();

    if (existingByUsername.error) {
      throw new Error(
        `Failed to find creator by username: ${existingByUsername.error.message}`,
      );
    }

    if (existingByUsername.data) {
      return existingByUsername.data.id;
    }
  }

  const desiredUsername = fallbackCreator.username
    ? fallbackCreator.username
    : toSlug(normalizedEmail?.split("@")[0] ?? "creator");
  const uniqueUsername = await ensureUniqueUsername(desiredUsername);
  const { data, error } = await client
    .from(usersTable)
    .insert({
      email: normalizedEmail,
      username: uniqueUsername,
      bio: fallbackCreator.bio ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create creator profile: ${error.message}`);
  }

  return data.id;
}

async function ensureUniqueUsername(baseUsername: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(usersTable)
    .select("username")
    .like("username", `${baseUsername}%`);

  if (error) {
    throw new Error(`Failed to validate username uniqueness: ${error.message}`);
  }

  const existing = new Set(data.map((row) => row.username));

  if (!existing.has(baseUsername)) {
    return baseUsername;
  }

  let suffix = 2;

  while (existing.has(`${baseUsername}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseUsername}-${suffix}`;
}

async function upsertWallpaperFiles(
  wallpaperId: string | number,
  files: Array<{
    variant: WallpaperFile["variant"];
    storagePath: string;
    url: string;
    size: number | null;
    format: string | null;
    width: number | null;
    height: number | null;
  }>,
) {
  if (files.length === 0) {
    return;
  }

  const client = createSupabaseAdminClient();
  const { error } = await client.from(wallpaperFilesTable).upsert(
    files.map((file) => ({
      wallpaper_id: toDbIdValue(wallpaperId),
      variant: file.variant,
      storage_path: file.storagePath,
      url: file.url,
      size: file.size,
      format: file.format,
      width: file.width,
      height: file.height,
    })),
    {
      onConflict: "wallpaper_id,variant",
    },
  );

  if (error) {
    throw new Error(`Failed to upsert wallpaper files: ${error.message}`);
  }
}

async function updateWallpaperMetadataPatch(
  wallpaperId: string | number,
  patch: Database["public"]["Tables"]["wallpapers"]["Update"],
) {
  if (Object.keys(patch).length === 0) {
    return;
  }

  const client = createSupabaseAdminClient();
  const { error } = await client
    .from(wallpapersTable)
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", toDbIdValue(wallpaperId));

  if (error) {
    throw new Error(`Failed to update wallpaper metadata: ${error.message}`);
  }
}

export async function backfillWallpaperAssets(
  identifier: string,
  options?: {
    forceAi?: boolean;
    forceColors?: boolean;
    forceVariants?: boolean;
    providerOverride?: WallpaperAiProviderOverride;
  },
): Promise<WallpaperAssetBackfillResult | null> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add the required environment variables before backfilling wallpapers.",
    );
  }

  let wallpaper = await getWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    return null;
  }

  const generatedVariants: WallpaperFile["variant"][] = [];
  let extractedColors = wallpaper.colors;
  const forceVariants = options?.forceVariants ?? false;
  const forceColors = options?.forceColors ?? false;
  const forceAi = options?.forceAi ?? false;

  logServerEvent("info", "wallpaper.backfill.start", {
    wallpaperId: wallpaper.id,
    wallpaperSlug: wallpaper.slug,
    forceAi,
    forceColors,
    forceVariants,
  });

  if (wallpaper.videoUrl) {
    return {
      id: wallpaper.id,
      slug: wallpaper.slug,
      title: wallpaper.title,
      generatedVariants: [],
      extractedColors: wallpaper.colors,
      aiAnalysisError: wallpaper.aiAnalysisError,
      aiAnalysisStatus: wallpaper.aiAnalysisStatus,
      aiTags: wallpaper.aiTags,
      aiCategory: wallpaper.aiCategory,
      aiCaption: wallpaper.aiCaption,
      width: wallpaper.width,
      height: wallpaper.height,
    };
  }

  if (forceVariants || !hasCompleteWallpaperVariants(wallpaper)) {
    const originalFile = getWallpaperOriginalFile(wallpaper);

    if (!originalFile) {
      throw new Error("Wallpaper is missing its original file entry.");
    }

    const generatedFiles = await generateWallpaperVariantFiles({
      storagePath: originalFile.storagePath,
      url: originalFile.url,
      size: originalFile.size ?? 0,
      format: originalFile.format ?? "bin",
      width: originalFile.width ?? undefined,
      height: originalFile.height ?? undefined,
      variant: "original",
    });

    await upsertWallpaperFiles(wallpaper.id, [
      generatedFiles.original,
      ...generatedFiles.variants,
    ].map((file) => ({
      variant: file.variant,
      storagePath: file.storagePath,
      url: file.url,
      size: file.size,
      format: file.format,
      width: file.width,
      height: file.height,
    })));

    await updateWallpaperMetadataPatch(wallpaper.id, {
      height: generatedFiles.original.height,
      width: generatedFiles.original.width,
    });

    generatedVariants.push(...generatedFiles.variants.map((file) => file.variant));
    wallpaper = (await getWallpaperByIdOrSlug(wallpaper.id)) ?? wallpaper;
  }

  const colorSourceFile = getWallpaperAnalysisFile(wallpaper);

  if (colorSourceFile && (forceColors || wallpaper.colors.length === 0)) {
    extractedColors = normalizeColors(
      await extractWallpaperColorsFromStoragePath(colorSourceFile.storagePath),
    );

    if (extractedColors.length > 0) {
      await updateWallpaperMetadataPatch(wallpaper.id, {
        colors: extractedColors,
      });
      wallpaper = (await getWallpaperByIdOrSlug(wallpaper.id)) ?? wallpaper;
    }
  }

  const aiSourceFile = getWallpaperAnalysisFile(wallpaper);
  const needsAiBackfill =
    forceAi ||
    wallpaper.aiAnalysisStatus !== "completed" ||
    wallpaper.aiTags.length === 0;

  if (aiSourceFile?.url && needsAiBackfill) {
    await enrichWallpaperWithAiMetadata(
      wallpaper.id,
      {
        title: wallpaper.title,
        description: wallpaper.description,
        imageUrl: aiSourceFile.url,
      },
      {
        providerOverride: options?.providerOverride,
      },
    );
    wallpaper = (await getWallpaperByIdOrSlug(wallpaper.id)) ?? wallpaper;
  }

  revalidateWallpaperPublicData({
    creatorUsernames: [wallpaper.creator?.username],
    identifiers: [wallpaper.id, wallpaper.slug],
  });

  logServerEvent("info", "wallpaper.backfill.completed", {
    aiAnalysisStatus: wallpaper.aiAnalysisStatus,
    generatedVariants,
    wallpaperId: wallpaper.id,
    wallpaperSlug: wallpaper.slug,
  });

  return {
    id: wallpaper.id,
    slug: wallpaper.slug,
    title: wallpaper.title,
    generatedVariants,
    extractedColors: wallpaper.colors,
    aiAnalysisError: wallpaper.aiAnalysisError,
    aiAnalysisStatus: wallpaper.aiAnalysisStatus,
    aiTags: wallpaper.aiTags,
    aiCategory: wallpaper.aiCategory,
    aiCaption: wallpaper.aiCaption,
    width: wallpaper.width,
    height: wallpaper.height,
  };
}

export async function backfillCreatorWallpaperAssets(
  username: string,
  options?: {
    forceAi?: boolean;
    forceColors?: boolean;
    forceVariants?: boolean;
    limit?: number;
    providerOverride?: WallpaperAiProviderOverride;
  },
): Promise<WallpaperAssetBackfillSummary> {
  const wallpapers = await listWallpapersByCreator(username);
  const selectedWallpapers =
    options?.limit && options.limit > 0
      ? wallpapers.slice(0, options.limit)
      : wallpapers;
  const results: WallpaperAssetBackfillResult[] = [];

  for (const wallpaper of selectedWallpapers) {
    const result = await backfillWallpaperAssets(wallpaper.id, options);

    if (result) {
      results.push(result);
    }
  }

  return {
    creatorUsername: username,
    processedCount: results.length,
    results,
  };
}

export async function scanR2ImportCandidates(options?: {
  limit?: number;
  prefix?: string;
}): Promise<R2ImportSummary> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add the required environment variables before importing from R2.",
    );
  }

  const limit = Math.min(
    Math.max(options?.limit ?? DEFAULT_R2_IMPORT_SCAN_LIMIT, 1),
    100,
  );
  const prefix = options?.prefix?.trim() || undefined;
  const candidates: R2ImportCandidate[] = [];
  const seenKeys = new Set<string>();
  let continuationToken: string | null = null;
  let scannedCount = 0;
  let pendingCount = 0;

  while (pendingCount < limit) {
    const page = await listR2Objects({
      continuationToken: continuationToken ?? undefined,
      limit: Math.max(limit * 3, 50),
      prefix,
    });

    if (page.objects.length === 0) {
      break;
    }

    const importableObjects = page.objects
      .map((object) =>
        createR2ImportCandidate({
          key: object.key,
          size: object.size,
          lastModified: object.lastModified,
        }),
      )
      .filter((candidate): candidate is R2ImportCandidate => Boolean(candidate));

    scannedCount += importableObjects.length;
    const resolvedPage = await resolveImportedR2Candidates(importableObjects);

    for (const candidate of resolvedPage) {
      if (seenKeys.has(candidate.key)) {
        continue;
      }

      seenKeys.add(candidate.key);

      if (candidate.alreadyImported) {
        candidates.push(candidate);
        continue;
      }

      if (pendingCount >= limit) {
        continue;
      }

      candidates.push(candidate);
      pendingCount += 1;
    }

    if (!page.isTruncated || !page.continuationToken) {
      break;
    }

    continuationToken = page.continuationToken;
  }

  if (candidates.length === 0) {
    return {
      creatorUsername: getDefaultImportCreatorUsername(),
      scannedCount,
      pendingCount: 0,
      importedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      candidates: [],
      results: [],
    };
  }

  return {
    creatorUsername: getDefaultImportCreatorUsername(),
    scannedCount,
    pendingCount: candidates.filter((candidate) => !candidate.alreadyImported).length,
    importedCount: candidates.filter((candidate) => candidate.alreadyImported).length,
    skippedCount: 0,
    failedCount: 0,
    candidates,
    results: [],
  };
}

export async function importR2CandidatesToWallpapers(options?: {
  creatorUsername?: string;
  limit?: number;
  prefix?: string;
}): Promise<R2ImportSummary> {
  const scanSummary = await scanR2ImportCandidates({
    limit: options?.limit,
    prefix: options?.prefix,
  });
  const creatorUsername =
    options?.creatorUsername?.trim() || scanSummary.creatorUsername;
  const results = await importResolvedR2Candidates(
    scanSummary.candidates,
    creatorUsername,
  );

  return {
    creatorUsername,
    scannedCount: scanSummary.scannedCount,
    pendingCount: results.filter((result) => result.status !== "imported").length,
    importedCount:
      scanSummary.importedCount +
      results.filter((result) => result.status === "imported").length,
    skippedCount: scanSummary.candidates.filter((candidate) => candidate.alreadyImported).length,
    failedCount: results.filter((result) => result.status === "failed").length,
    candidates: scanSummary.candidates,
    results,
  };
}

export async function importSpecificR2ObjectsToWallpapers(options: {
  creatorUsername?: string;
  objects: R2ImportObjectInput[];
}): Promise<R2ImportSummary> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add the required environment variables before importing from R2.",
    );
  }

  const dedupedCandidates = [
    ...new Map(
      options.objects
        .map((object) => createR2ImportCandidate(object))
        .filter((candidate): candidate is R2ImportCandidate => Boolean(candidate))
        .map((candidate) => [candidate.key, candidate]),
    ).values(),
  ];
  const resolvedCandidates = await resolveImportedR2Candidates(dedupedCandidates);
  const creatorUsername =
    options.creatorUsername?.trim() || getDefaultImportCreatorUsername();
  const results = await importResolvedR2Candidates(
    resolvedCandidates,
    creatorUsername,
  );

  return {
    creatorUsername,
    scannedCount: dedupedCandidates.length,
    pendingCount: results.filter((result) => result.status !== "imported").length,
    importedCount:
      resolvedCandidates.filter((candidate) => candidate.alreadyImported).length +
      results.filter((result) => result.status === "imported").length,
    skippedCount: resolvedCandidates.filter((candidate) => candidate.alreadyImported).length,
    failedCount: results.filter((result) => result.status === "failed").length,
    candidates: resolvedCandidates,
    results,
  };
}

export async function listWallpapers(options: WallpaperListOptions = {}) {
  if (!isSupabaseConfigured()) {
    const filteredWallpapers = filterWallpapers(
      getFallbackWallpapers().filter((wallpaper) => {
        return wallpaper.status === (options.status ?? "published");
      }),
      {
        aspect: options.aspect,
        search: options.search,
        tag: options.tag,
        category: options.category,
        color: options.color,
        featured: options.featured,
        includeInsPicks: options.includeInsPicks,
        media: options.media,
        minHeight: options.minHeight,
        minWidth: options.minWidth,
        motion: options.motion,
        orientation: options.orientation,
        resolution: options.resolution,
        sort: options.sort,
        style: options.style,
      },
    );

    const fallbackOffset = options.offset ?? 0;
    return options.limit
      ? filteredWallpapers.slice(fallbackOffset, fallbackOffset + options.limit)
      : fallbackOffset > 0
        ? filteredWallpapers.slice(fallbackOffset)
        : filteredWallpapers;
  }

  return withTransientSupabaseReadRetry("listWallpapers", async () => {
    const client = createSupabaseAdminClient();
    const buildWallpapersQuery = (applyMotionFilter: boolean) => {
      let query = client
        .from(wallpapersTable)
        .select("*")
        .eq("status", options.status ?? "published")
        .order("created_at", { ascending: false });

      if (options.featured !== undefined) {
        query = query.eq("featured", options.featured);
      }

      if (applyMotionFilter && options.motion !== undefined) {
        query = options.motion
          ? query.not("video_url", "is", null)
          : query.is("video_url", null);
      }

      return query;
    };

    let { data, error } = await buildWallpapersQuery(true);

    if (
      error &&
      options.motion !== undefined &&
      /column .*video_url does not exist/i.test(error.message)
    ) {
      ({ data, error } = await buildWallpapersQuery(false));
    }

    if (error) {
      throw new Error(`Failed to list wallpapers: ${error.message}`);
    }

    const wallpapers = filterWallpapers(await hydrateWallpapers(data ?? []), {
      aspect: options.aspect,
      search: options.search,
      tag: options.tag,
      category: options.category,
      color: options.color,
      featured: options.featured,
      includeInsPicks: options.includeInsPicks,
      media: options.media,
      minHeight: options.minHeight,
      minWidth: options.minWidth,
      motion: options.motion,
      orientation: options.orientation,
      resolution: options.resolution,
      sort: options.sort,
      style: options.style,
    });

    const offset = options.offset ?? 0;
    if (options.limit) {
      return wallpapers.slice(offset, offset + options.limit);
    }
    return offset > 0 ? wallpapers.slice(offset) : wallpapers;
  });
}

export async function listPublishedWallpapers(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return listWallpapers({
    ...options,
    status: "published",
  });
}

export async function listFeaturedWallpapers(
  options: Omit<WallpaperListOptions, "featured" | "status"> = {},
) {
  return listWallpapers({
    ...options,
    featured: true,
    status: "published",
  });
}

export async function getSimilarWallpapers(
  identifier: string,
  options: {
    limit?: number;
  } = {},
): Promise<SimilarWallpaperSnapshot | null> {
  const source = await getWallpaperByIdOrSlug(identifier);

  if (!source || source.status !== "published") {
    return null;
  }

  const perGroupLimit = Math.max(1, Math.min(options.limit ?? 6, 12));
  const candidates = (
    await listPublishedWallpapers({
      includeInsPicks: false,
      limit: 1000,
    })
  ).filter((wallpaper) => wallpaper.id !== source.id);

  const ranked = rankSimilarWallpapers(source, candidates);
  const groups = [
    createSimilarGroup(
      "style",
      "相似风格",
      ranked
        .filter((wallpaper) => countSharedSimilarityTerms(source, wallpaper) > 0)
        .slice(0, perGroupLimit),
    ),
    createSimilarGroup(
      "color",
      "相似颜色",
      ranked
        .filter((wallpaper) => countSharedColors(source, wallpaper) > 0)
        .slice(0, perGroupLimit),
    ),
    createSimilarGroup(
      "creator",
      "同作者",
      ranked
        .filter(
          (wallpaper) =>
            Boolean(source.creator?.username) &&
            source.creator?.username === wallpaper.creator?.username,
        )
        .slice(0, perGroupLimit),
    ),
    createSimilarGroup(
      "ratio",
      "同比例",
      ranked
        .filter((wallpaper) => hasSimilarRatio(source, wallpaper))
        .slice(0, perGroupLimit),
    ),
  ].filter((group) => group.wallpapers.length > 0);

  return {
    source: {
      id: source.id,
      slug: source.slug,
      title: getWallpaperDisplayTitle(source),
    },
    groups,
  };
}

export async function getWallpaperMotionSnapshot(
  identifier: string,
): Promise<WallpaperMotionSnapshot | null> {
  const wallpaper = await getPublishedWallpaperByIdOrSlug(identifier);

  if (!wallpaper || wallpaper.status !== "published") {
    return null;
  }

  const videoFile = getWallpaperMotionVideoFile(wallpaper);
  const posterFiles = getWallpaperPosterFiles(wallpaper);
  const posterAssets = posterFiles.map((file) =>
    toMotionAsset(wallpaper, file, "poster"),
  );
  const fallbackVideoAsset =
    wallpaper.videoUrl && !videoFile
      ? ({
          contentType: null,
          downloadUrl: wallpaper.videoUrl,
          height: wallpaper.height,
          kind: "video",
          sizeBytes: null,
          url: wallpaper.videoUrl,
          variant: "original",
          width: wallpaper.width,
        } satisfies WallpaperMotionAsset)
      : null;
  const videoAsset = videoFile
    ? toMotionAsset(wallpaper, videoFile, "video")
    : fallbackVideoAsset;
  const posterUrl =
    posterAssets[0]?.url ?? getWallpaperPreviewUrl(wallpaper, "large") ?? null;

  return {
    assets: {
      posters: posterAssets,
      video: videoAsset,
    },
    isMotion: Boolean(wallpaper.videoUrl || videoAsset),
    playback: {
      muted: true,
      posterUrl,
      previewUrl: videoAsset?.url ?? wallpaper.videoUrl ?? posterUrl,
    },
    source: {
      id: wallpaper.id,
      slug: wallpaper.slug,
      title: getWallpaperDisplayTitle(wallpaper),
    },
  };
}

export async function getWallpaperTrustSnapshot(
  identifier: string,
): Promise<WallpaperTrustSnapshot | null> {
  const wallpaper = await getPublishedWallpaperByIdOrSlug(identifier);

  if (!wallpaper || wallpaper.status !== "published") {
    return null;
  }

  const creatorUsername = wallpaper.creator?.username ?? null;

  return {
    attribution: {
      creatorId: wallpaper.creator?.id ?? null,
      creatorUrl: creatorUsername
        ? `/creator/${encodeURIComponent(creatorUsername)}`
        : null,
      username: creatorUsername,
    },
    license: {
      confirmed: Boolean(wallpaper.licenseConfirmedAt),
      confirmedAt: wallpaper.licenseConfirmedAt,
      statement: wallpaper.licenseConfirmedAt
        ? "上传者已确认拥有该作品的上传、展示与分发授权。"
        : "这张壁纸缺少完整授权确认，请在下载和二次使用前谨慎核验来源。",
      version: wallpaper.licenseVersion,
    },
    report: {
      endpoint: `/api/wallpapers/${encodeURIComponent(wallpaper.slug)}/report`,
      lastReportedAt: wallpaper.lastReportedAt,
      message:
        "如果你认为这张壁纸涉及侵权、敏感内容、误导信息或垃圾内容，可以提交举报；Lumen 会记录处理状态并保留创作者归属。",
      reasons: PUBLIC_REPORT_REASONS,
      reportsCount: wallpaper.reportsCount,
    },
    source: {
      id: wallpaper.id,
      slug: wallpaper.slug,
      title: getWallpaperDisplayTitle(wallpaper),
    },
  };
}

export async function getWallpaperByIdOrSlug(identifier: string) {
  if (!isSupabaseConfigured()) {
    return getFallbackWallpaperByIdentifier(identifier);
  }

  return withTransientSupabaseReadRetry(
    `getWallpaperByIdOrSlug(${identifier})`,
    async () => {
      const client = createSupabaseAdminClient();
      const { data: bySlug, error: slugError } = await client
        .from(wallpapersTable)
        .select("*")
        .eq("slug", identifier)
        .limit(1)
        .maybeSingle();

      if (slugError) {
        throw new Error(`Failed to load wallpaper by slug: ${slugError.message}`);
      }

      if (bySlug) {
        return (await hydrateWallpapers([bySlug]))[0] ?? null;
      }

      const looksNumericId = /^\d+$/.test(identifier);
      const looksUuidId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          identifier,
        );

      if (!looksNumericId && !looksUuidId) {
        return null;
      }

      const idValue: string | number = looksNumericId
        ? Number(identifier)
        : identifier;
      const { data: byId, error: idError } = await client
        .from(wallpapersTable)
        .select("*")
        .eq("id", idValue)
        .limit(1)
        .maybeSingle();

      if (idError) {
        throw new Error(`Failed to load wallpaper by id: ${idError.message}`);
      }

      if (!byId) {
        return null;
      }

      return (await hydrateWallpapers([byId]))[0] ?? null;
    },
  );
}

export async function getPublishedWallpaperByIdOrSlug(identifier: string) {
  const wallpaper = await getWallpaperByIdOrSlug(identifier);

  return wallpaper?.status === "published" ? wallpaper : null;
}

export async function getCreatorByUsername(username: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(usersTable)
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load creator: ${error.message}`);
  }

  return data ? mapCreator(data) : null;
}

export async function listWallpapersByCreator(username: string) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  const { data: creator, error: creatorError } = await client
    .from(usersTable)
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (creatorError) {
    throw new Error(`Failed to find creator: ${creatorError.message}`);
  }

  if (!creator) {
    return [];
  }

  const { data, error } = await client
    .from(wallpapersTable)
    .select("*")
    .eq("user_id", creator.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list creator wallpapers: ${error.message}`);
  }

  return hydrateWallpapers(data);
}

export async function listManagedWallpapers(
  userId: string | number,
  options?: {
    includeAll?: boolean;
  },
) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  let query = client
    .from(wallpapersTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (!options?.includeAll) {
    query = query.eq("user_id", toDbIdValue(userId));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list managed wallpapers: ${error.message}`);
  }

  return hydrateWallpapers(data);
}

function getDuplicateWallpaperItem(
  wallpaper: Wallpaper,
): OpenClawDuplicateWallpaperItem {
  const originalFile = getWallpaperOriginalFile(wallpaper);

  return {
    id: wallpaper.id,
    slug: wallpaper.slug,
    title: wallpaper.title,
    displayTitle: getWallpaperDisplayTitle(wallpaper),
    status: wallpaper.status,
    kind: wallpaper.videoUrl ? "video" : "image",
    creatorUsername: wallpaper.creator?.username ?? null,
    createdAt: wallpaper.createdAt,
    updatedAt: wallpaper.updatedAt,
    width: wallpaper.width,
    height: wallpaper.height,
    downloadsCount: wallpaper.downloadsCount,
    likesCount: wallpaper.likesCount,
    primaryAssetPath: originalFile?.storagePath ?? null,
    primaryAssetUrl: originalFile?.url ?? wallpaper.videoUrl ?? null,
  };
}

function compareWallpapersByRecency(
  left: Wallpaper,
  right: Wallpaper,
  keep: "latest" | "oldest",
) {
  const direction = keep === "latest" ? -1 : 1;
  const createdAtDelta =
    Date.parse(left.createdAt) - Date.parse(right.createdAt);

  if (createdAtDelta !== 0) {
    return createdAtDelta * direction;
  }

  const updatedAtDelta =
    Date.parse(left.updatedAt) - Date.parse(right.updatedAt);

  if (updatedAtDelta !== 0) {
    return updatedAtDelta * direction;
  }

  return String(left.id).localeCompare(String(right.id)) * direction;
}

function getWallpaperStoragePathsForDeletion(wallpaper: Wallpaper) {
  return [
    ...new Set(
      wallpaper.files
        .map((file) => normalizeR2StoragePath(file.storagePath))
        .filter(Boolean),
    ),
  ];
}

async function deleteWallpapersWithAssetGuard(wallpapers: Wallpaper[]) {
  if (!wallpapers.length) {
    return {
      deletedCount: 0,
      deletedStoragePaths: [] as string[],
    };
  }

  const client = createSupabaseAdminClient();
  const wallpaperIds = wallpapers.map((wallpaper) => toDbIdValue(wallpaper.id));
  const wallpaperIdSet = new Set(wallpapers.map((wallpaper) => String(wallpaper.id)));
  const storagePaths = [
    ...new Set(
      wallpapers.flatMap((wallpaper) => getWallpaperStoragePathsForDeletion(wallpaper)),
    ),
  ];
  let deletableStoragePaths: string[] = [];

  if (storagePaths.length > 0) {
    const { data: fileRows, error: fileRowsError } = await client
      .from(wallpaperFilesTable)
      .select("wallpaper_id, storage_path")
      .in("storage_path", storagePaths);

    if (fileRowsError) {
      throw new Error(
        `Failed to inspect shared wallpaper files before deletion: ${fileRowsError.message}`,
      );
    }

    const referencedElsewhere = new Set(
      fileRows
        .filter((row) => !wallpaperIdSet.has(String(row.wallpaper_id)))
        .map((row) => normalizeR2StoragePath(row.storage_path))
        .filter(Boolean),
    );

    deletableStoragePaths = storagePaths.filter(
      (storagePath) => !referencedElsewhere.has(storagePath),
    );
  }

  const { error } = await client
    .from(wallpapersTable)
    .delete()
    .in("id", wallpaperIds);

  if (error) {
    throw new Error(`Failed to delete wallpaper: ${error.message}`);
  }

  if (deletableStoragePaths.length > 0) {
    await deleteR2Objects(deletableStoragePaths);
  }

  revalidateWallpaperPublicData({
    creatorUsernames: wallpapers.map((wallpaper) => wallpaper.creator?.username),
    identifiers: wallpapers.flatMap((wallpaper) => [wallpaper.id, wallpaper.slug]),
  });

  return {
    deletedCount: wallpapers.length,
    deletedStoragePaths: deletableStoragePaths,
  };
}

function createSequencedTitles(titles: string[]) {
  const counts = new Map<string, number>();

  for (const title of titles) {
    counts.set(title, (counts.get(title) ?? 0) + 1);
  }

  const used = new Map<string, number>();

  return titles.map((title) => {
    const total = counts.get(title) ?? 0;

    if (total <= 1) {
      return title;
    }

    const nextIndex = (used.get(title) ?? 0) + 1;
    used.set(title, nextIndex);

    return `${title} ${String(nextIndex).padStart(Math.max(2, String(total).length), "0")}`;
  });
}

async function loadWallpapersByIdentifiers(identifiers: string[]) {
  const uniqueIdentifiers = [...new Set(identifiers.map((value) => value.trim()).filter(Boolean))];
  const wallpapers = await Promise.all(
    uniqueIdentifiers.map((identifier) => getWallpaperByIdOrSlug(identifier)),
  );

  return wallpapers.filter((wallpaper): wallpaper is Wallpaper => wallpaper !== null);
}

export async function listDuplicateWallpaperGroups(options?: {
  creator?: string;
  limit?: number;
  reason?: "asset_id" | "fallback_fingerprint" | "all";
  status?: WallpaperStatus | "all";
}) {
  if (!isSupabaseConfigured()) {
    return [] satisfies OpenClawDuplicateWallpaperGroup[];
  }

  const client = createSupabaseAdminClient();
  let creatorId: string | number | null = null;

  if (options?.creator) {
    const creator = await getCreatorByUsername(options.creator);

    if (!creator) {
      return [] satisfies OpenClawDuplicateWallpaperGroup[];
    }

    creatorId = creator.id;
  }

  let query = client
    .from(wallpapersTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (creatorId !== null) {
    query = query.eq("user_id", toDbIdValue(creatorId));
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load duplicate wallpaper candidates: ${error.message}`);
  }

  const wallpapers = await hydrateWallpapers(data ?? [], {
    dedupe: false,
  });
  const groups = new Map<string, Wallpaper[]>();

  for (const wallpaper of wallpapers) {
    const key = getWallpaperDeduplicationKey(wallpaper);
    const existing = groups.get(key) ?? [];
    existing.push(wallpaper);
    groups.set(key, existing);
  }

  const duplicateGroups = [...groups.entries()]
    .filter((entry) => entry[1].length > 1)
    .map(([groupKey, groupedWallpapers]) => {
      const sample = groupedWallpapers[0];
      const originalFile = getWallpaperOriginalFile(sample);
      const primarySource =
        originalFile?.storagePath ||
        originalFile?.url ||
        sample.videoUrl ||
        null;
      const assetId = primarySource ? getR2AssetId(primarySource) : null;

      return {
        groupKey,
        assetId,
        reason: assetId ? "asset_id" : "fallback_fingerprint",
        kind: sample.videoUrl ? "video" : "image",
        count: groupedWallpapers.length,
        wallpapers: groupedWallpapers.map((wallpaper) =>
          getDuplicateWallpaperItem(wallpaper),
        ),
      } satisfies OpenClawDuplicateWallpaperGroup;
    })
    .filter((group) =>
      !options?.reason || options.reason === "all"
        ? true
        : group.reason === options.reason,
    )
    .sort((left, right) => {
      return (
        right.count - left.count ||
        Date.parse(right.wallpapers[0]?.createdAt ?? "0") -
          Date.parse(left.wallpapers[0]?.createdAt ?? "0")
      );
    });

  return options?.limit
    ? duplicateGroups.slice(0, options.limit)
    : duplicateGroups;
}

export async function batchRenameWallpapers(
  input: z.infer<typeof batchRenameWallpapersSchema>,
) {
  const autoRenameTargets =
    input.strategy === "displayTitle"
      ? await loadWallpapersByIdentifiers(input.wallpaperIds ?? [])
      : [];
  const generatedTitles = createSequencedTitles(
    autoRenameTargets.map((wallpaper) =>
      buildSemanticWallpaperTitle({
        aiTags: wallpaper.aiTags,
        tags: wallpaper.tags,
        fallback: looksLikeImportedWallpaperTitle(wallpaper.title)
          ? input.fallbackTitle ?? "精选壁纸"
          : wallpaper.title,
      }),
    ),
  );
  const items =
    input.strategy === "explicit"
      ? input.items ?? []
      : autoRenameTargets.map((wallpaper, index) => ({
          id: wallpaper.id,
          title: generatedTitles[index] ?? wallpaper.title,
        }));

  const updatedWallpapers: Array<Wallpaper & { displayTitle: string }> = [];

  for (const item of items) {
    const updated = await updateWallpaperRecord(item.id, {
      title: item.title,
      description: undefined,
      videoUrl: undefined,
    });

    if (updated) {
      updatedWallpapers.push({
        ...updated,
        displayTitle: getWallpaperDisplayTitle(updated),
      });
    }
  }

  return {
    requestedCount: items.length,
    updatedCount: updatedWallpapers.length,
    wallpapers: updatedWallpapers.map((wallpaper) => ({
      id: wallpaper.id,
      slug: wallpaper.slug,
      title: wallpaper.title,
      displayTitle: wallpaper.displayTitle,
    })),
  } satisfies OpenClawBatchRenameResult;
}

export async function batchUpdateWallpapers(
  input: z.infer<typeof batchUpdateWallpapersSchema>,
) {
  const wallpapers = await loadWallpapersByIdentifiers(input.wallpaperIds);
  const removeTags = normalizeTags(input.removeTags ?? []);
  const updatedWallpapers: Array<Wallpaper & { displayTitle: string }> = [];

  for (const wallpaper of wallpapers) {
    const nextTags =
      input.tags !== undefined
        ? normalizeTags(input.tags)
        : normalizeTags([
            ...wallpaper.tags,
            ...(input.appendTags ?? []),
          ]).filter((tag) => !removeTags.includes(tag));

    const updated = await updateWallpaperRecord(wallpaper.id, {
      description: undefined,
      videoUrl: undefined,
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.tags !== undefined ||
      (input.appendTags?.length ?? 0) > 0 ||
      (input.removeTags?.length ?? 0) > 0
        ? { tags: nextTags }
        : {}),
    });

    if (updated) {
      updatedWallpapers.push({
        ...updated,
        displayTitle: getWallpaperDisplayTitle(updated),
      });
    }
  }

  return {
    requestedCount: input.wallpaperIds.length,
    updatedCount: updatedWallpapers.length,
    wallpapers: updatedWallpapers,
  } satisfies OpenClawBatchWallpaperUpdateResult;
}

export async function cleanupDuplicateWallpapers(
  input: z.infer<typeof cleanupDuplicateWallpapersSchema>,
) {
  const duplicateGroups = await listDuplicateWallpaperGroups({
    creator: input.creator,
    limit: input.limit,
    reason: input.reason,
    status: input.status,
  });
  const selectedGroups = input.groupKeys?.length
    ? duplicateGroups.filter((group) => input.groupKeys?.includes(group.groupKey))
    : duplicateGroups;
  const results: OpenClawDuplicateCleanupGroupResult[] = [];
  const wallpapersToDelete: Wallpaper[] = [];

  for (const group of selectedGroups) {
    const hydratedWallpapers = await loadWallpapersByIdentifiers(
      group.wallpapers.map((wallpaper) => wallpaper.id),
    );

    if (hydratedWallpapers.length <= 1) {
      continue;
    }

    const sorted = [...hydratedWallpapers].sort((left, right) =>
      compareWallpapersByRecency(left, right, input.keep),
    );
    const keptWallpaper = sorted[0];
    const deletedWallpapers = sorted.slice(1);

    if (!keptWallpaper || deletedWallpapers.length === 0) {
      continue;
    }

    results.push({
      groupKey: group.groupKey,
      reason: group.reason,
      kind: group.kind,
      dryRun: input.dryRun,
      keptWallpaper: getDuplicateWallpaperItem(keptWallpaper),
      deletedWallpapers: deletedWallpapers.map((wallpaper) =>
        getDuplicateWallpaperItem(wallpaper),
      ),
    });

    if (!input.dryRun) {
      wallpapersToDelete.push(...deletedWallpapers);
    }
  }

  if (!input.dryRun) {
    await deleteWallpapersWithAssetGuard(wallpapersToDelete);
  }

  return {
    requestedGroupCount: selectedGroups.length,
    processedGroupCount: results.length,
    skippedGroupCount: selectedGroups.length - results.length,
    keepStrategy: input.keep,
    dryRun: input.dryRun,
    keptCount: results.length,
    deletedCount: results.reduce(
      (total, result) => total + result.deletedWallpapers.length,
      0,
    ),
    groups: results,
  } satisfies OpenClawDuplicateCleanupResult;
}

export async function listWallpaperReports(options?: {
  creator?: string;
  limit?: number;
  reason?: WallpaperReportReason | "all";
  search?: string;
  status?: WallpaperReportStatus | "all" | "open";
}) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  let query = client
    .from(wallpaperReportsTable)
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status === "open") {
    query = query.in("status", ["pending", "reviewing"]);
  } else if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }

  if (options?.reason && options.reason !== "all") {
    query = query.eq("reason", options.reason);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list wallpaper reports: ${error.message}`);
  }

  const hydratedReports = await hydrateWallpaperReports(data);
  const filteredReports = hydratedReports.filter((report) =>
    matchesReportSearch(report, {
      creator: options?.creator,
      search: options?.search,
    }),
  );

  return options?.limit ? filteredReports.slice(0, options.limit) : filteredReports;
}

export async function getWallpaperReportCounts() {
  if (!isSupabaseConfigured()) {
    return {
      total: 0,
      open: 0,
      pending: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0,
    };
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpaperReportsTable)
    .select("status");

  if (error) {
    throw new Error(`Failed to load wallpaper report counts: ${error.message}`);
  }

  return data.reduce(
    (accumulator, row) => {
      const status = row.status as WallpaperReportStatus;
      accumulator.total += 1;
      accumulator[status] += 1;

      if (status === "pending" || status === "reviewing") {
        accumulator.open += 1;
      }

      return accumulator;
    },
    {
      total: 0,
      open: 0,
      pending: 0,
      reviewing: 0,
      resolved: 0,
      dismissed: 0,
    },
  );
}

export async function getWallpaperReportById(id: string | number) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpaperReportsTable)
    .select("*")
    .eq("id", toDbIdValue(id))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load wallpaper report: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return (await hydrateWallpaperReports([data]))[0] ?? null;
}

export async function getUserLibrarySnapshot(
  userId: string | number,
): Promise<LibrarySnapshot> {
  if (!isSupabaseConfigured()) {
    return {
      collection: null,
      favorites: [],
      downloadHistory: [],
      notifications: [],
      unreadNotificationsCount: 0,
    };
  }

  const client = createSupabaseAdminClient();
  const normalizedUserId = toDbIdValue(userId);
  const collection = await syncFavoritesCollection(userId);
  const { data: favoriteLinks, error: favoritesError } = await client
    .from(collectionItemsTable)
    .select("wallpaper_id, added_at")
    .eq("collection_id", collection.id)
    .order("added_at", { ascending: false });

  if (favoritesError) {
    throw new Error(
      `Failed to load favorite wallpapers: ${favoritesError.message}`,
    );
  }

  const favoriteWallpaperIds = favoriteLinks.map((item) => item.wallpaper_id);
  let favorites: Wallpaper[] = [];

  if (favoriteWallpaperIds.length > 0) {
    const { data: favoriteRows, error: favoriteRowsError } = await client
      .from(wallpapersTable)
      .select("*")
      .in("id", favoriteWallpaperIds)
      .eq("status", "published");

    if (favoriteRowsError) {
      throw new Error(
        `Failed to hydrate favorite wallpapers: ${favoriteRowsError.message}`,
      );
    }

    favorites = orderWallpapersByIds(
      (await hydrateWallpapers(favoriteRows)).map(withDisplayTitle),
      favoriteWallpaperIds,
    );
  }

  const { data: downloadRows, error: downloadsError } = await client
    .from(downloadsTable)
    .select("*")
    .eq("user_id", normalizedUserId)
    .order("downloaded_at", { ascending: false })
    .limit(24);

  if (downloadsError) {
    throw new Error(
      `Failed to load download history: ${downloadsError.message}`,
    );
  }

  const uniqueDownloadedWallpaperIds = [
    ...new Set(downloadRows.map((row) => String(row.wallpaper_id))),
  ];

  let downloadHistory: DownloadHistoryItem[] = [];
  let notifications: LibraryNotificationItem[] = [];
  let unreadNotificationsCount = 0;

  if (uniqueDownloadedWallpaperIds.length > 0) {
    const { data: historyRows, error: historyRowsError } = await client
      .from(wallpapersTable)
      .select("*")
      .in("id", uniqueDownloadedWallpaperIds);

    if (historyRowsError) {
      throw new Error(
        `Failed to hydrate download history wallpapers: ${historyRowsError.message}`,
      );
    }

    const wallpaperMap = new Map(
      (await hydrateWallpapers(historyRows)).map(withDisplayTitle).map((wallpaper) => [
        String(wallpaper.id),
        wallpaper,
      ]),
    );

    downloadHistory = downloadRows
      .map((row: DownloadRow) => {
        const wallpaper = wallpaperMap.get(String(row.wallpaper_id));

        if (!wallpaper) {
          return null;
        }

        return {
          id: String(row.id),
          downloadedAt: row.downloaded_at,
          variant: row.variant,
          wallpaper,
        } satisfies DownloadHistoryItem;
      })
      .filter((item): item is DownloadHistoryItem => item !== null);
  }

  const { data: notificationRows, error: notificationsError } = await client
    .from(notificationsTable)
    .select("*")
    .eq("user_id", normalizedUserId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (notificationsError) {
    throw new Error(
      `Failed to load notifications: ${notificationsError.message}`,
    );
  }

  unreadNotificationsCount = notificationRows.filter(
    (row) => row.read_at === null,
  ).length;

  const notificationWallpaperIds = [
    ...new Set(
      notificationRows.flatMap((row) =>
        row.wallpaper_id === null ? [] : [String(row.wallpaper_id)],
      ),
    ),
  ];

  if (notificationWallpaperIds.length > 0) {
    const { data: notificationWallpaperRows, error: notificationWallpapersError } =
      await client
        .from(wallpapersTable)
        .select("*")
        .in("id", notificationWallpaperIds);

    if (notificationWallpapersError) {
      throw new Error(
        `Failed to hydrate notification wallpapers: ${notificationWallpapersError.message}`,
      );
    }

    const wallpaperMap = new Map(
      (await hydrateWallpapers(notificationWallpaperRows)).map((wallpaper) => [
        String(wallpaper.id),
        wallpaper,
      ]),
    );

    notifications = notificationRows.map((row) =>
      mapNotification(
        row,
        row.wallpaper_id === null
          ? null
          : (wallpaperMap.get(String(row.wallpaper_id)) ?? null),
      ),
    );
  } else {
    notifications = notificationRows.map((row) => mapNotification(row, null));
  }

  return {
    collection: mapCollection(collection),
    favorites,
    downloadHistory,
    notifications,
    unreadNotificationsCount,
  };
}

export async function getUnreadNotificationsCount(userId: string | number) {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const client = createSupabaseAdminClient();
  const { data, error, count } = await client
    .from(notificationsTable)
    .select("id", {
      count: "exact",
      head: false,
    })
    .eq("user_id", toDbIdValue(userId))
    .is("read_at", null);

  if (error) {
    throw new Error(`Failed to load unread notifications: ${error.message}`);
  }

  return count ?? data.length;
}

export async function createUserNotification(input: {
  body: string;
  href?: string | null;
  kind: string;
  title: string;
  userId: string | number;
  wallpaperId?: string | number | null;
}) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(notificationsTable)
    .insert({
      user_id: toDbIdValue(input.userId),
      wallpaper_id:
        input.wallpaperId === undefined || input.wallpaperId === null
          ? null
          : toDbIdValue(input.wallpaperId),
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }

  return data;
}

export async function markNotificationAsRead(
  notificationId: string | number,
  userId: string | number,
) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(notificationsTable)
    .update({
      read_at: new Date().toISOString(),
    })
    .eq("id", toDbIdValue(notificationId))
    .eq("user_id", toDbIdValue(userId))
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  let wallpaper: Wallpaper | null = null;

  if (data.wallpaper_id !== null) {
    wallpaper = await getWallpaperByIdOrSlug(String(data.wallpaper_id));
  }

  return mapNotification(data, wallpaper);
}

export async function markAllNotificationsAsRead(userId: string | number) {
  if (!isSupabaseConfigured()) {
    return {
      readAt: new Date().toISOString(),
      updatedCount: 0,
    };
  }

  const client = createSupabaseAdminClient();
  const readAt = new Date().toISOString();
  const { data, error } = await client
    .from(notificationsTable)
    .update({
      read_at: readAt,
    })
    .eq("user_id", toDbIdValue(userId))
    .is("read_at", null)
    .select("id");

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }

  return {
    readAt,
    updatedCount: data.length,
  };
}

export async function createWallpaperRecord(
  input: z.infer<typeof createWallpaperSchema>,
  options?: {
    creatorId?: string | number | null;
    preserveSourceObjects?: boolean;
    skipAiEnrichment?: boolean;
    skipVariantGeneration?: boolean;
  },
) {
  return Sentry.startSpan(
    {
      attributes: {
        "wallpaper.featured": input.featured,
        "wallpaper.has_creator": Boolean(options?.creatorId ?? input.creator),
      },
      name: "wallpaper.create",
      op: "media.upload_pipeline",
    },
    async () => {
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not configured. Add the required environment variables before creating wallpapers.",
        );
      }

      const client = createSupabaseAdminClient();
      const creatorId =
        options?.creatorId ?? (await resolveCreatorId(input.creator));
      const preserveSourceObjects = options?.preserveSourceObjects ?? false;
      const skipAiEnrichment = options?.skipAiEnrichment ?? false;
      const skipVariantGeneration = options?.skipVariantGeneration ?? false;
      const preservedSourcePaths = new Set(
        [
          normalizeR2StoragePath(input.original.storagePath),
          input.posterOriginal?.storagePath
            ? normalizeR2StoragePath(input.posterOriginal.storagePath)
            : null,
        ].filter((path): path is string => Boolean(path)),
      );
      const getCleanupPaths = (paths: Array<string | null | undefined>) =>
        paths
          .map((path) => (path ? normalizeR2StoragePath(path) : ""))
          .filter(Boolean)
          .filter((path) =>
            preserveSourceObjects ? !preservedSourcePaths.has(path) : true,
          );
      const slug = await ensureUniqueSlug(toSlug(input.title));
      const isVideoWallpaper = isVideoWallpaperInput(input);

      try {
        await assertR2ObjectMatchesUpload({
          declaredSize: input.original.size,
          expectedContentType: input.original.contentType ?? null,
          path: input.original.storagePath,
        });

        if (input.posterOriginal) {
          await assertR2ObjectMatchesUpload({
            declaredSize: input.posterOriginal.size,
            expectedContentType: input.posterOriginal.contentType ?? null,
            path: input.posterOriginal.storagePath,
          });
        }
      } catch (error) {
        await deleteR2Objects(
          getCleanupPaths([
            input.original.storagePath,
            input.posterOriginal?.storagePath,
          ]),
        );
        throw error;
      }

      const videoOriginalFile = {
        variant: "original" as const,
        storagePath: input.original.storagePath,
        url: input.original.url || getR2ObjectUrl(input.original.storagePath),
        size: input.original.size,
        format: input.original.format,
        width: input.original.width ?? null,
        height: input.original.height ?? null,
      };
      const imageOriginalFile = {
        variant: "original" as const,
        storagePath: input.original.storagePath,
        url: input.original.url || getR2ObjectUrl(input.original.storagePath),
        size: input.original.size,
        format: input.original.format,
        width: input.original.width ?? null,
        height: input.original.height ?? null,
      };
      const generatedFiles = skipVariantGeneration
        ? null
        : isVideoWallpaper
          ? input.posterOriginal
            ? await generateWallpaperVariantFiles(input.posterOriginal).catch(
                async (error) => {
                  await deleteR2Objects(
                    getCleanupPaths([
                      input.original.storagePath,
                      input.posterOriginal?.storagePath,
                    ]),
                  );
                  throw error;
                },
              )
            : null
          : await generateWallpaperVariantFiles(input.original).catch(
              async (error) => {
                await deleteR2Objects(
                  getCleanupPaths([input.original.storagePath]),
                );
                throw error;
              },
            );
      const wallpaperWidth = isVideoWallpaper
        ? input.width ?? input.original.width ?? null
        : input.width ??
          (skipVariantGeneration ? null : generatedFiles?.original.width) ??
          input.original.width ??
          null;
      const wallpaperHeight = isVideoWallpaper
        ? input.height ?? input.original.height ?? null
        : input.height ??
          (skipVariantGeneration ? null : generatedFiles?.original.height) ??
          input.original.height ??
          null;
      const fileRecords = (
        isVideoWallpaper
          ? [videoOriginalFile, ...(skipVariantGeneration ? [] : generatedFiles?.variants ?? [])]
          : skipVariantGeneration
            ? [imageOriginalFile]
            : [generatedFiles!.original, ...generatedFiles!.variants]
      ).map((file) => ({
        variant: file.variant,
        storage_path: file.storagePath,
        url: file.url || getR2ObjectUrl(file.storagePath),
        size: file.size,
        format: file.format,
        width: file.width,
        height: file.height,
      }));
      const cleanupPaths = skipVariantGeneration
        ? getCleanupPaths([input.posterOriginal?.storagePath])
        : isVideoWallpaper
          ? getCleanupPaths([
              input.original.storagePath,
              ...(generatedFiles?.cleanupPaths ?? []),
            ])
          : getCleanupPaths(generatedFiles!.cleanupPaths);

      const { data: wallpaper, error: wallpaperError } = await client
        .from(wallpapersTable)
        .insert({
          user_id: creatorId,
          title: input.title,
          slug,
          description: input.description ?? null,
          video_url: input.videoUrl ?? null,
          status: input.status,
          tags: normalizeTags(input.tags),
          colors: normalizeColors(input.colors),
          width: wallpaperWidth,
          height: wallpaperHeight,
          featured: input.featured,
          license_confirmed_at: new Date().toISOString(),
          license_version: input.licenseVersion,
        })
        .select("*")
        .single();

      if (wallpaperError) {
        await deleteR2Objects(cleanupPaths);
        throw new Error(`Failed to create wallpaper: ${wallpaperError.message}`);
      }

      const { error: fileError } = await client.from(wallpaperFilesTable).insert(
        fileRecords.map((file) => ({
          wallpaper_id: wallpaper.id,
          ...file,
        })),
      );

      if (fileError) {
        await Promise.allSettled([
          client.from(wallpapersTable).delete().eq("id", wallpaper.id),
          deleteR2Objects(cleanupPaths),
        ]);
        throw new Error(`Failed to create wallpaper file: ${fileError.message}`);
      }

      if (
        isVideoWallpaper &&
        input.posterOriginal?.storagePath &&
        !preserveSourceObjects
      ) {
        await deleteR2Objects([input.posterOriginal.storagePath]);
      }

      const previewFile = isVideoWallpaper
        ? skipVariantGeneration
          ? null
          : generatedFiles?.variants.find((file) => file.variant === "preview") ??
            generatedFiles?.variants[0] ??
            null
        : skipVariantGeneration
          ? imageOriginalFile
          : generatedFiles!.variants.find((file) => file.variant === "preview") ??
            generatedFiles!.variants[0] ??
            generatedFiles!.original;

      if (skipAiEnrichment) {
        await persistWallpaperAiMetadata(wallpaper.id, {
          ai_analysis_status: "skipped",
          ai_analysis_error: null,
        });
      } else if (previewFile?.url) {
        await enrichWallpaperWithAiMetadata(wallpaper.id, {
          title: input.title,
          description: input.description ?? null,
          imageUrl: previewFile.url,
        });
      } else {
        await persistWallpaperAiMetadata(wallpaper.id, {
          ai_analysis_status: "skipped",
          ai_analysis_error: null,
        });
      }

      const createdWallpaper = await getWallpaperByIdOrSlug(String(wallpaper.id));

      if (createdWallpaper) {
        revalidateWallpaperPublicData({
          creatorUsernames: [createdWallpaper.creator?.username],
          identifiers: [createdWallpaper.id, createdWallpaper.slug],
        });
      }

      return createdWallpaper;
    },
  );
}

export function canCreateWallpapers() {
  return isSupabaseConfigured();
}

export function getDefaultWallpaperStatus(): WallpaperStatus {
  return "published";
}

export async function updateWallpaperRecord(
  identifier: string,
  input: z.infer<typeof updateWallpaperSchema>,
) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add the required environment variables before updating wallpapers.",
    );
  }

  const wallpaper = await getWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const payload: Database["public"]["Tables"]["wallpapers"]["Update"] = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    payload.title = input.title;
  }

  if (input.description !== undefined) {
    payload.description = input.description;
  }

  if (input.videoUrl !== undefined) {
    payload.video_url = input.videoUrl;
  }

  if (input.tags !== undefined) {
    payload.tags = normalizeTags(input.tags);
  }

  if (input.colors !== undefined) {
    payload.colors = normalizeColors(input.colors);
  }

  if (input.featured !== undefined) {
    payload.featured = input.featured;
  }

  if (input.status !== undefined) {
    payload.status = input.status;
  }

  const { error } = await client
    .from(wallpapersTable)
    .update(payload)
    .eq("id", toDbIdValue(wallpaper.id));

  if (error) {
    throw new Error(`Failed to update wallpaper: ${error.message}`);
  }

  const updatedWallpaper = await getWallpaperByIdOrSlug(wallpaper.id);

  if (updatedWallpaper) {
    revalidateWallpaperPublicData({
      creatorUsernames: [updatedWallpaper.creator?.username],
      identifiers: [updatedWallpaper.id, updatedWallpaper.slug],
    });
  }

  return updatedWallpaper;
}

export async function deleteWallpaperRecord(identifier: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add the required environment variables before deleting wallpapers.",
    );
  }

  const wallpaper = await getWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    return false;
  }

  await deleteWallpapersWithAssetGuard([wallpaper]);

  return true;
}

export async function reanalyzeWallpaperMetadata(identifier: string) {
  return Sentry.startSpan(
    {
      attributes: {
        "wallpaper.identifier": identifier,
      },
      name: "wallpaper.ai.reanalyze",
      op: "ai.inference",
    },
    async () => {
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not configured. Add the required environment variables before analyzing wallpapers.",
        );
      }

      const wallpaper = await getWallpaperByIdOrSlug(identifier);

      if (!wallpaper) {
        return null;
      }

      const previewFile =
        wallpaper.files.find((file) => file.variant === "preview") ??
        wallpaper.files.find((file) => file.variant === "thumb") ??
        wallpaper.files[0];

      if (!previewFile?.url) {
        await persistWallpaperAiMetadata(wallpaper.id, {
          ai_analysis_status: "failed",
          ai_analysis_error: "No preview image is available for AI analysis.",
          ai_analyzed_at: new Date().toISOString(),
        });

        const failedWallpaper = await getWallpaperByIdOrSlug(wallpaper.id);

        if (failedWallpaper) {
          revalidateWallpaperPublicData({
            creatorUsernames: [failedWallpaper.creator?.username],
            identifiers: [failedWallpaper.id, failedWallpaper.slug],
          });
        }

        return failedWallpaper;
      }

      await enrichWallpaperWithAiMetadata(wallpaper.id, {
        title: wallpaper.title,
        description: wallpaper.description,
        imageUrl: previewFile.url,
      });

      const analyzedWallpaper = await getWallpaperByIdOrSlug(wallpaper.id);

      if (analyzedWallpaper) {
        revalidateWallpaperPublicData({
          creatorUsernames: [analyzedWallpaper.creator?.username],
          identifiers: [analyzedWallpaper.id, analyzedWallpaper.slug],
        });
      }

      return analyzedWallpaper;
    },
  );
}

export async function createWallpaperReport(
  identifier: string,
  input: z.infer<typeof createWallpaperReportSchema>,
  options?: {
    reporterEmail?: string | null;
    reporterIp?: string | null;
    reporterUserId?: string | number | null;
  },
) {
  if (!isSupabaseConfigured()) {
    const fallbackWallpaper = getFallbackWallpaperByIdentifier(identifier);

    if (!fallbackWallpaper) {
      return null;
    }

    return {
      id: `fallback-report-${Date.now()}`,
      wallpaperId: fallbackWallpaper.id,
      reason: input.reason,
      status: "pending",
      reporterEmail:
        (input.reporterEmail ?? options?.reporterEmail ?? null)
          ?.trim()
          .toLowerCase() || null,
      createdAt: new Date().toISOString(),
    } satisfies WallpaperReportReceipt;
  }

  const wallpaper = await getPublishedWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const reporterEmail = (
    input.reporterEmail ??
    options?.reporterEmail ??
    null
  )?.trim().toLowerCase() || null;
  const { data: report, error } = await client
    .from(wallpaperReportsTable)
    .insert({
      wallpaper_id: toDbIdValue(wallpaper.id),
      reporter_user_id: options?.reporterUserId
        ? toDbIdValue(options.reporterUserId)
        : null,
      reporter_email: reporterEmail,
      reporter_ip: options?.reporterIp?.trim() || null,
      reason: input.reason,
      details: input.details ?? null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create wallpaper report: ${error.message}`);
  }

  const { error: summaryError } = await client
    .from(wallpapersTable)
    .update({
      reports_count: wallpaper.reportsCount + 1,
      last_reported_at: report.created_at,
    })
    .eq("id", toDbIdValue(wallpaper.id));

  if (summaryError) {
    console.error("Failed to update wallpaper report summary", summaryError);
  }

  return mapWallpaperReportReceipt(report);
}

export async function updateWallpaperReportReview(
  id: string | number,
  input: z.infer<typeof reviewWallpaperReportSchema>,
) {
  return Sentry.startSpan(
    {
      attributes: {
        "moderation.report_id": String(id),
        "moderation.status": input.status,
        "moderation.wallpaper_status": input.wallpaperStatus ?? "unchanged",
      },
      name: "moderation.review",
      op: "moderation.review",
    },
    async () => {
      if (!isSupabaseConfigured()) {
        throw new Error(
          "Supabase is not configured. Add the required environment variables before reviewing reports.",
        );
      }

      const report = await getWallpaperReportById(id);

      if (!report) {
        return null;
      }

      const client = createSupabaseAdminClient();
      const reviewedAt =
        input.status === "pending" ? null : new Date().toISOString();
      const { error: reportError } = await client
        .from(wallpaperReportsTable)
        .update({
          status: input.status,
          review_note:
            input.reviewNote === undefined ? report.reviewNote : input.reviewNote,
          reviewed_at: reviewedAt,
        })
        .eq("id", toDbIdValue(report.id));

      if (reportError) {
        throw new Error(`Failed to update wallpaper report: ${reportError.message}`);
      }

      if (input.wallpaperStatus && report.wallpaper) {
        const { error: wallpaperError } = await client
          .from(wallpapersTable)
          .update({
            status: input.wallpaperStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", toDbIdValue(report.wallpaper.id));

        if (wallpaperError) {
          throw new Error(
            `Failed to update reported wallpaper: ${wallpaperError.message}`,
          );
        }
      }

      const updatedReport = await getWallpaperReportById(report.id);

      if (
        updatedReport &&
        updatedReport.wallpaper?.creator?.email &&
        (updatedReport.status === "resolved" ||
          updatedReport.status === "dismissed") &&
        isResendConfigured()
      ) {
        const moderationStatusLabel =
          updatedReport.status === "resolved" ? "已解决" : "已忽略";
        const actionLabel =
          input.wallpaperStatus === "rejected"
            ? "作品已暂时下架"
            : input.wallpaperStatus === "published"
              ? "作品保持公开"
              : "未变更作品公开状态";
        const baseUrl = (
          process.env.NEXTAUTH_URL ?? "http://localhost:3000"
        ).replace(/\/+$/, "");

        try {
          await sendModerationResultEmail({
            actionLabel,
            email: updatedReport.wallpaper.creator.email,
            moderationStatusLabel,
            reviewNote: updatedReport.reviewNote,
            wallpaperTitle: updatedReport.wallpaper.title,
            wallpaperUrl: `${baseUrl}/wallpaper/${updatedReport.wallpaper.slug}`,
          });
        } catch (error) {
          console.warn(
            "[moderation-email] Failed to notify creator:",
            error instanceof Error ? error.message : error,
          );
        }
      }

      if (
        updatedReport &&
        updatedReport.wallpaper?.creator?.id &&
        updatedReport.wallpaper
      ) {
        const moderationStatusLabel =
          updatedReport.status === "resolved"
            ? "已处理"
            : updatedReport.status === "dismissed"
              ? "已忽略"
              : updatedReport.status === "reviewing"
                ? "审查中"
                : "待处理";
        const actionLabel =
          input.wallpaperStatus === "rejected"
            ? "作品已暂时下架"
            : input.wallpaperStatus === "published"
              ? "作品保持公开"
              : "作品公开状态未变更";

        try {
          await createUserNotification({
            body: `${moderationStatusLabel} · ${actionLabel}${
              updatedReport.reviewNote ? ` · ${updatedReport.reviewNote}` : ""
            }`,
            href: `/wallpaper/${updatedReport.wallpaper.slug}`,
            kind: "moderation_result",
            title: `《${updatedReport.wallpaper.title}》有新的审核结果`,
            userId: updatedReport.wallpaper.creator.id,
            wallpaperId: updatedReport.wallpaper.id,
          });
        } catch (error) {
          console.warn(
            "[moderation-notification] Failed to create notification:",
            error instanceof Error ? error.message : error,
          );
        }
      }

      if (updatedReport?.wallpaper) {
        revalidateWallpaperPublicData({
          creatorUsernames: [updatedReport.wallpaper.creator?.username],
          identifiers: [updatedReport.wallpaper.id, updatedReport.wallpaper.slug],
        });
      }

      return updatedReport;
    },
  );
}

export async function updateWallpaperReportReviewsBatch(
  reportIds: Array<string | number>,
  input: z.infer<typeof reviewWallpaperReportSchema>,
) {
  const results: WallpaperReport[] = [];

  for (const reportId of reportIds) {
    const report = await updateWallpaperReportReview(reportId, input);

    if (report) {
      results.push(report);
    }
  }

  return results;
}

export async function incrementWallpaperDownloads(
  identifier: string,
  options?: {
    userId?: string | number | null;
    variant?: z.infer<typeof variantSchema> | null;
  },
) {
  if (!isSupabaseConfigured()) {
    const wallpaper = getFallbackWallpaperByIdentifier(identifier);

    return {
      wallpaperId: wallpaper?.id ?? identifier,
      downloadsCount: (wallpaper?.downloadsCount ?? 0) + 1,
    };
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .rpc("increment_wallpaper_downloads", {
      p_identifier: identifier,
    })
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to increment wallpaper downloads: ${error.message}`,
    );
  }

  const row = data as IncrementWallpaperDownloadsRow | null;

  if (!row) {
    throw new Error("Wallpaper was not found while incrementing downloads.");
  }

  if (options?.userId) {
    const wallpaperId = toDbIdValue(row.wallpaper_id);

    await client.from(downloadsTable).insert({
      user_id: toDbIdValue(options.userId),
      wallpaper_id: wallpaperId,
      variant: options.variant ?? null,
    });
  }

  const updatedWallpaper = await getWallpaperByIdOrSlug(String(row.wallpaper_id));
  revalidateWallpaperPublicData({
    creatorUsernames: [updatedWallpaper?.creator?.username],
    identifiers: [
      identifier,
      row.wallpaper_id,
      updatedWallpaper?.slug,
    ],
  });

  return {
    wallpaperId: row.wallpaper_id,
    downloadsCount: row.downloads_count,
  };
}

export async function getWallpaperFavoriteState(
  identifier: string,
  userId?: string | number | null,
) {
  const fallbackWallpaper = getFallbackWallpaperByIdentifier(identifier);
  const fallbackLikesCount = fallbackWallpaper?.likesCount ?? 0;

  if (!isSupabaseConfigured()) {
    return {
      likesCount: fallbackLikesCount,
      isFavorited: false,
    } satisfies WallpaperFavoriteSnapshot;
  }

  const wallpaper = await getPublishedWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    return {
      likesCount: fallbackLikesCount,
      isFavorited: false,
    } satisfies WallpaperFavoriteSnapshot;
  }

  if (!userId) {
    return {
      likesCount: wallpaper.likesCount,
      isFavorited: false,
    } satisfies WallpaperFavoriteSnapshot;
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(likesTable)
    .select("user_id")
    .eq("wallpaper_id", toDbIdValue(wallpaper.id))
    .eq("user_id", toDbIdValue(userId))
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load wallpaper like state: ${error.message}`);
  }

  return {
    likesCount: wallpaper.likesCount,
    isFavorited: Boolean(data),
  } satisfies WallpaperFavoriteSnapshot;
}

export async function toggleWallpaperFavorite(
  identifier: string,
  userId: string | number,
) {
  if (!isSupabaseConfigured()) {
    const fallbackWallpaper = getFallbackWallpaperByIdentifier(identifier);

    return {
      likesCount: (fallbackWallpaper?.likesCount ?? 0) + 1,
      isFavorited: true,
    } satisfies WallpaperFavoriteSnapshot;
  }

  const wallpaper = await getPublishedWallpaperByIdOrSlug(identifier);

  if (!wallpaper) {
    throw new Error("Wallpaper was not found while toggling favorite.");
  }

  const client = createSupabaseAdminClient();
  const wallpaperId = toDbIdValue(wallpaper.id);
  const normalizedUserId = toDbIdValue(userId);
  const favoritesCollection = await getOrCreateFavoritesCollection(userId);
  const { data: existingLike, error: lookupError } = await client
    .from(likesTable)
    .select("user_id")
    .eq("wallpaper_id", wallpaperId)
    .eq("user_id", normalizedUserId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(
      `Failed to inspect wallpaper likes: ${lookupError.message}`,
    );
  }

  const nextFavorited = !existingLike;
  const nextLikesCount = nextFavorited
    ? wallpaper.likesCount + 1
    : Math.max(wallpaper.likesCount - 1, 0);

  if (nextFavorited) {
    const { error: insertError } = await client.from(likesTable).insert({
      user_id: normalizedUserId,
      wallpaper_id: wallpaperId,
    });

    if (insertError) {
      throw new Error(
        `Failed to create wallpaper like: ${insertError.message}`,
      );
    }

    const { error: collectionInsertError } = await client
      .from(collectionItemsTable)
      .upsert(
        {
          collection_id: favoritesCollection.id,
          wallpaper_id: wallpaperId,
        },
        {
          onConflict: "collection_id,wallpaper_id",
        },
      );

    if (collectionInsertError) {
      throw new Error(
        `Failed to sync favorites collection item: ${collectionInsertError.message}`,
      );
    }
  } else {
    const { error: deleteError } = await client
      .from(likesTable)
      .delete()
      .eq("wallpaper_id", wallpaperId)
      .eq("user_id", normalizedUserId);

    if (deleteError) {
      throw new Error(
        `Failed to remove wallpaper like: ${deleteError.message}`,
      );
    }

    const { error: collectionDeleteError } = await client
      .from(collectionItemsTable)
      .delete()
      .eq("collection_id", favoritesCollection.id)
      .eq("wallpaper_id", wallpaperId);

    if (collectionDeleteError) {
      throw new Error(
        `Failed to remove favorites collection item: ${collectionDeleteError.message}`,
      );
    }
  }

  const { error: countError } = await client
    .from(wallpapersTable)
    .update({
      likes_count: nextLikesCount,
    })
    .eq("id", wallpaperId);

  if (countError) {
    throw new Error(
      `Failed to update wallpaper likes count: ${countError.message}`,
    );
  }

  revalidateWallpaperPublicData({
    creatorUsernames: [wallpaper.creator?.username],
    identifiers: [wallpaper.id, wallpaper.slug],
  });

  return {
    likesCount: nextLikesCount,
    isFavorited: nextFavorited,
  } satisfies WallpaperFavoriteSnapshot;
}
