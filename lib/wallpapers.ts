import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { moodCards } from "@/lib/data/home";
import { revalidateWallpaperPublicData } from "@/lib/revalidate";
import { matchesExploreCategory, sortWallpapers } from "@/lib/explore";
import {
  deleteR2Objects,
  getR2ObjectUrl,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/lib/r2";
import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  isResendConfigured,
  sendModerationResultEmail,
} from "@/lib/resend";
import { analyzeWallpaperWithFallback } from "@/lib/wallpaper-ai";
import { generateWallpaperVariantFiles } from "@/lib/wallpaper-variants";
import type { Database } from "@/types/database";
import type {
  DownloadHistoryItem,
  LibraryCollection,
  LibraryNotificationItem,
  LibrarySnapshot,
} from "@/types/library";
import type {
  CreatorProfile,
  Wallpaper,
  WallpaperAiAnalysisStatus,
  WallpaperFile,
  WallpaperFavoriteSnapshot,
  WallpaperListOptions,
  WallpaperReport,
  WallpaperReportReceipt,
  WallpaperReportReason,
  WallpaperReportStatus,
  WallpaperStatus,
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

export const presignUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
});

export const createWallpaperSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z
    .string()
    .trim()
    .max(2000)
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
    width: z.number().int().positive().max(20000).optional(),
    height: z.number().int().positive().max(20000).optional(),
    variant: variantSchema.optional().default("original"),
  }),
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

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type WallpaperRow = Database["public"]["Tables"]["wallpapers"]["Row"];
type WallpaperFileRow = Database["public"]["Tables"]["wallpaper_files"]["Row"];
type WallpaperReportRow =
  Database["public"]["Tables"]["wallpaper_reports"]["Row"];
type DownloadRow = Database["public"]["Tables"]["downloads"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type IncrementWallpaperDownloadsRow =
  Database["public"]["Functions"]["increment_wallpaper_downloads"]["Returns"][number];

function normalizeTags(tags: string[]) {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
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
  return {
    id: String(row.id),
    wallpaperId: String(row.wallpaper_id),
    variant: row.variant,
    storagePath: row.storage_path,
    url: row.url,
    size: row.size,
    format: row.format,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
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
    description: row.description,
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

function createFallbackWallpaper(index: number): Wallpaper {
  const card = moodCards[index];

  return {
    id: card.id,
    userId: null,
    title: card.name,
    slug: card.id,
    description: null,
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
    width:
      card.shape === "landscape"
        ? 380
        : card.shape === "square"
          ? 280
          : card.shape === "tall"
            ? 180
            : 220,
    height:
      card.shape === "landscape"
        ? 240
        : card.shape === "square"
          ? 280
          : card.shape === "tall"
            ? 380
            : 340,
    downloadsCount: 0,
    likesCount: 0,
    reportsCount: 0,
    featured: index < 3,
    licenseConfirmedAt: null,
    licenseVersion: DEFAULT_LICENSE_VERSION,
    lastReportedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
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

function filterWallpapers(
  wallpapers: Wallpaper[],
  options: Pick<
    WallpaperListOptions,
    "category" | "featured" | "search" | "sort" | "tag"
  >,
) {
  const filteredWallpapers = wallpapers.filter((wallpaper) => {
    const matchesFeatured =
      options.featured === undefined || wallpaper.featured === options.featured;

    return (
      matchesFeatured &&
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
) {
  await persistWallpaperAiMetadata(wallpaperId, {
    ai_analysis_status: "pending",
    ai_analysis_error: null,
  });

  try {
    const analysis = await analyzeWallpaperWithFallback(input);

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
  const { data, error } = await client
    .from(wallpaperFilesTable)
    .select("*")
    .in("wallpaper_id", wallpaperIds);

  if (error) {
    throw new Error(`Failed to load wallpaper files: ${error.message}`);
  }

  const map = new Map<string, WallpaperFile[]>();

  for (const row of data) {
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

async function hydrateWallpapers(rows: WallpaperRow[]) {
  const fileMap = await fetchFilesMap(rows.map((row) => row.id));
  const creatorMap = await fetchCreatorsMap(
    rows.flatMap((row) => (row.user_id ? [row.user_id] : [])),
  );

  return rows.map((row) =>
    mapWallpaper(
      row,
      fileMap.get(String(row.id)) ?? [],
      row.user_id ? (creatorMap.get(String(row.user_id)) ?? null) : null,
    ),
  );
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
  if (!creator?.username && !creator?.email) {
    return null;
  }

  const client = createSupabaseAdminClient();
  const normalizedEmail = creator.email ?? null;

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

  const desiredUsername = creator.username
    ? creator.username
    : toSlug(normalizedEmail?.split("@")[0] ?? "creator");
  const uniqueUsername = await ensureUniqueUsername(desiredUsername);
  const { data, error } = await client
    .from(usersTable)
    .insert({
      email: normalizedEmail,
      username: uniqueUsername,
      bio: creator.bio ?? null,
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

export async function listWallpapers(options: WallpaperListOptions = {}) {
  if (!isSupabaseConfigured()) {
    const filteredWallpapers = filterWallpapers(
      getFallbackWallpapers().filter((wallpaper) => {
        return wallpaper.status === (options.status ?? "published");
      }),
      {
        search: options.search,
        tag: options.tag,
        category: options.category,
        featured: options.featured,
        sort: options.sort,
      },
    );

    return options.limit
      ? filteredWallpapers.slice(0, options.limit)
      : filteredWallpapers;
  }

  const client = createSupabaseAdminClient();
  let query = client
    .from(wallpapersTable)
    .select("*")
    .eq("status", options.status ?? "published")
    .order("created_at", { ascending: false });

  if (options.featured !== undefined) {
    query = query.eq("featured", options.featured);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list wallpapers: ${error.message}`);
  }

  const wallpapers = filterWallpapers(await hydrateWallpapers(data), {
    search: options.search,
    tag: options.tag,
    category: options.category,
    featured: options.featured,
    sort: options.sort,
  });

  return options.limit ? wallpapers.slice(0, options.limit) : wallpapers;
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

export async function getWallpaperByIdOrSlug(identifier: string) {
  if (!isSupabaseConfigured()) {
    return getFallbackWallpaperByIdentifier(identifier);
  }

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

export async function listManagedWallpapers(userId: string | number) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(wallpapersTable)
    .select("*")
    .eq("user_id", toDbIdValue(userId))
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list managed wallpapers: ${error.message}`);
  }

  return hydrateWallpapers(data);
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
      await hydrateWallpapers(favoriteRows),
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
      (await hydrateWallpapers(historyRows)).map((wallpaper) => [
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
      const slug = await ensureUniqueSlug(toSlug(input.title));
      const generatedFiles = await generateWallpaperVariantFiles(
        input.original,
      ).catch(async (error) => {
        await deleteR2Objects([input.original.storagePath]);
        throw error;
      });
      const wallpaperWidth =
        input.width ??
        generatedFiles.original.width ??
        input.original.width ??
        null;
      const wallpaperHeight =
        input.height ??
        generatedFiles.original.height ??
        input.original.height ??
        null;
      const fileRecords = [generatedFiles.original, ...generatedFiles.variants].map(
        (file) => ({
          variant: file.variant,
          storage_path: file.storagePath,
          url: file.url || getR2ObjectUrl(file.storagePath),
          size: file.size,
          format: file.format,
          width: file.width,
          height: file.height,
        }),
      );

      const { data: wallpaper, error: wallpaperError } = await client
        .from(wallpapersTable)
        .insert({
          user_id: creatorId,
          title: input.title,
          slug,
          description: input.description ?? null,
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
        await deleteR2Objects(generatedFiles.cleanupPaths);
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
          deleteR2Objects(generatedFiles.cleanupPaths),
        ]);
        throw new Error(`Failed to create wallpaper file: ${fileError.message}`);
      }

      const previewFile =
        generatedFiles.variants.find((file) => file.variant === "preview") ??
        generatedFiles.variants[0] ??
        generatedFiles.original;

      await enrichWallpaperWithAiMetadata(wallpaper.id, {
        title: input.title,
        description: input.description ?? null,
        imageUrl: previewFile.url,
      });

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

  const client = createSupabaseAdminClient();
  const storagePaths = wallpaper.files
    .map((file) => file.storagePath)
    .filter(Boolean);

  if (storagePaths.length > 0) {
    await deleteR2Objects(storagePaths);
  }

  const { error } = await client
    .from(wallpapersTable)
    .delete()
    .eq("id", toDbIdValue(wallpaper.id));

  if (error) {
    throw new Error(`Failed to delete wallpaper: ${error.message}`);
  }

  revalidateWallpaperPublicData({
    creatorUsernames: [wallpaper.creator?.username],
    identifiers: [wallpaper.id, wallpaper.slug],
  });

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
    throw new Error(
      "Supabase is not configured. Add the required environment variables before reporting wallpapers.",
    );
  }

  const wallpaper = await getWallpaperByIdOrSlug(identifier);

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

  const wallpaper = await getWallpaperByIdOrSlug(identifier);

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

  const wallpaper = await getWallpaperByIdOrSlug(identifier);

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
