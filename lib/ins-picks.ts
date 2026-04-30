import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import { isR2Configured, putR2Object } from "@/lib/r2";
import {
  createSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase";
import type { Database } from "@/types/database";
import type {
  InsPickCollectionDefinition,
  InsPickCollectionSummary,
  InsPickUploadMetadata,
  InsPicksSnapshot,
} from "@/types/ins-picks";
import type { Wallpaper } from "@/types/wallpaper";

const DEFAULT_COLLECTION_LIMIT = 24;
const INS_PICKS_CANDIDATE_LIMIT = 500;
const PREVIEW_WALLPAPER_LIMIT = 4;
const INS_PICK_R2_ROOT = "originals/ins-picks";
const insPickCollectionsTable =
  "ins_pick_collections" satisfies keyof Database["public"]["Tables"];

type InsPickCollectionRow =
  Database["public"]["Tables"]["ins_pick_collections"]["Row"];

export const INS_PICK_SOURCE_TAGS = [
  "ins",
  "instagram",
  "instagram-post",
  "celebrity",
  "editorial",
];

export const INS_PICK_UPLOAD_SOURCE_TAGS = ["ins", "instagram", "celebrity"];

export function createInsPickSlug(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || `ins-set-${crypto.randomUUID().slice(0, 8)}`
  );
}

export function getInsPickR2Prefix(slug: string) {
  return `${INS_PICK_R2_ROOT}/${createInsPickSlug(slug)}`;
}

function staticCollection(
  collection: Omit<
    InsPickCollectionDefinition,
    "href" | "r2Prefix" | "source"
  >,
): InsPickCollectionDefinition {
  return {
    ...collection,
    href: `/ins/${collection.slug}`,
    r2Prefix: getInsPickR2Prefix(collection.slug),
    source: "static",
  };
}

export const INS_PICK_COLLECTIONS: InsPickCollectionDefinition[] = [
  staticCollection({
    slug: "jang-wonyoung",
    label: "Jang Wonyoung",
    nativeName: "张元英",
    subtitle: "IVE / Instagram archive",
    description:
      "Stage polish, mirror selfies, airport looks, and clean phone-wallpaper crops.",
    gradient: "blush",
    status: "active",
    aliases: [
      "jang wonyoung",
      "wonyoung",
      "张元英",
      "張員瑛",
      "장원영",
      "ive wonyoung",
    ],
    requiredTags: ["ins", "jang-wonyoung", "wonyoung", "张元英"],
  }),
  staticCollection({
    slug: "iu",
    label: "IU",
    nativeName: "李知恩",
    subtitle: "IU / Instagram archive",
    description:
      "Soft portraits, concert moments, travel frames, and calm warm-toned crops.",
    gradient: "ice",
    status: "active",
    aliases: ["iu", "李知恩", "李智恩", "이지은", "아이유", "lee jieun"],
    requiredTags: ["ins", "iu", "李知恩"],
  }),
  staticCollection({
    slug: "lim-yoona",
    label: "Lim Yoona",
    nativeName: "林允儿",
    subtitle: "Yoona / Instagram archive",
    description:
      "Elegant portraits, city travel, fashion details, and bright magazine-like stills.",
    gradient: "moss",
    status: "active",
    aliases: [
      "lim yoona",
      "yoona",
      "林允儿",
      "林潤娥",
      "임윤아",
      "snsd yoona",
    ],
    requiredTags: ["ins", "lim-yoona", "yoona", "林允儿"],
  }),
  staticCollection({
    slug: "bae-joohyun",
    label: "Irene",
    nativeName: "裴珠泫",
    subtitle: "Irene / Instagram archive",
    description:
      "Red Velvet elegance, calm portraits, styling details, and clean editorial crops.",
    gradient: "dusk",
    status: "active",
    aliases: [
      "bae joohyun",
      "irene",
      "裴珠泫",
      "裴柱现",
      "배주현",
      "아이린",
      "red velvet irene",
    ],
    requiredTags: ["ins", "bae-joohyun", "irene", "裴珠泫"],
  }),
  staticCollection({
    slug: "karina-yu-jimin",
    label: "Karina",
    nativeName: "柳智敏",
    subtitle: "Karina / Instagram archive",
    description:
      "Aespa stage polish, mirrored details, cyber-clean portraits, and sharp phone crops.",
    gradient: "ice",
    status: "active",
    aliases: [
      "karina",
      "yu jimin",
      "yoo jimin",
      "柳智敏",
      "刘知珉",
      "유지민",
      "카리나",
      "aespa karina",
    ],
    requiredTags: ["ins", "karina-yu-jimin", "karina", "柳智敏"],
  }),
  staticCollection({
    slug: "bae-suzy",
    label: "Bae Suzy",
    nativeName: "裴秀智",
    subtitle: "Suzy / Instagram archive",
    description:
      "Bright natural portraits, actress stills, travel frames, and soft fashion moments.",
    gradient: "moss",
    status: "active",
    aliases: ["bae suzy", "suzy", "裴秀智", "배수지", "miss a suzy"],
    requiredTags: ["ins", "bae-suzy", "suzy", "裴秀智"],
  }),
  staticCollection({
    slug: "kim-jisoo",
    label: "Kim Jisoo",
    nativeName: "金智秀",
    subtitle: "Jisoo / Instagram archive",
    description:
      "Blackpink portraits, city looks, magazine stills, and polished wallpaper-ready crops.",
    gradient: "blush",
    status: "active",
    aliases: [
      "kim jisoo",
      "jisoo",
      "金智秀",
      "김지수",
      "blackpink jisoo",
    ],
    requiredTags: ["ins", "kim-jisoo", "jisoo", "金智秀"],
  }),
  staticCollection({
    slug: "liu-yifei",
    label: "Liu Yifei",
    nativeName: "刘亦菲",
    subtitle: "Coming next / domestic archive",
    description:
      "A reserved slot for future domestic celebrity sets, posters, and editorial crops.",
    gradient: "dusk",
    status: "planned",
    aliases: ["liu yifei", "刘亦菲", "劉亦菲", "crystal liu"],
    requiredTags: ["ins", "liu-yifei", "刘亦菲"],
  }),
];

function normalizeMatchValue(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.#_@/\\|()[\]{}:;'"，。、“”‘’·・\-\s]+/g, "");
}

function uniqueText(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = normalizeMatchValue(trimmed);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function getWallpaperMatchValues(wallpaper: Wallpaper) {
  return [
    wallpaper.title,
    wallpaper.description ?? "",
    wallpaper.aiCaption ?? "",
    wallpaper.aiCategory ?? "",
    wallpaper.creator?.username ?? "",
    ...wallpaper.tags,
    ...wallpaper.aiTags,
  ]
    .map(normalizeMatchValue)
    .filter(Boolean);
}

function wallpaperMatchesCollection(
  wallpaper: Wallpaper,
  collection: InsPickCollectionDefinition,
) {
  const values = getWallpaperMatchValues(wallpaper);
  const aliases = collection.aliases.map(normalizeMatchValue).filter(Boolean);

  return aliases.some((alias) => {
    return values.some((value) => value === alias || value.includes(alias));
  });
}

function uniqueWallpapers(wallpapers: Wallpaper[]) {
  const seen = new Set<string>();

  return wallpapers.filter((wallpaper) => {
    if (seen.has(wallpaper.id)) {
      return false;
    }

    seen.add(wallpaper.id);
    return true;
  });
}

function mapInsPickCollectionRow(
  row: InsPickCollectionRow,
): InsPickCollectionDefinition {
  return {
    aliases: row.aliases,
    createdAt: row.created_at,
    createdBy: row.created_by === null ? null : String(row.created_by),
    description: row.description,
    gradient: "dusk",
    href: `/ins/${row.slug}`,
    label: row.label,
    nativeName: row.native_name,
    requiredTags: row.required_tags,
    r2Prefix: row.r2_prefix,
    slug: row.slug,
    source: "custom",
    status: row.status,
    subtitle: row.subtitle,
    updatedAt: row.updated_at,
  };
}

export function buildInsPickUploadMetadata(
  collections: InsPickCollectionDefinition[],
): InsPickUploadMetadata {
  return {
    archiveEndpoint: "/api/ins-picks/archives",
    collections: collections.map((collection) => ({
      label: collection.label,
      nativeName: collection.nativeName,
      requiredTags: collection.requiredTags,
      r2Prefix: collection.r2Prefix,
      slug: collection.slug,
      source: collection.source,
      status: collection.status,
    })),
    collectionsEndpoint: "/api/ins-picks/collections",
    createEndpoint: "/api/ins-picks/upload",
    href: "/creator/studio",
    note:
      "Use this dedicated INS upload contract after presign. It reuses the standard wallpaper upload pipeline and auto-applies source + person tags.",
    presignEndpoint: "/api/ins-picks/upload/presign",
    sourceTags: INS_PICK_SOURCE_TAGS,
  };
}

export const INS_PICK_UPLOAD_METADATA =
  buildInsPickUploadMetadata(INS_PICK_COLLECTIONS);

export async function listCustomInsPickCollections() {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(insPickCollectionsTable)
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    if (
      error.code === "42P01" ||
      error.message.toLowerCase().includes("does not exist") ||
      error.message.toLowerCase().includes("schema cache") ||
      error.message.toLowerCase().includes("fetch failed")
    ) {
      return [];
    }

    throw new Error(`Failed to load INS pick collections: ${error.message}`);
  }

  return (data ?? []).map(mapInsPickCollectionRow);
}

export async function listInsPickCollections() {
  const customCollections = await listCustomInsPickCollections();
  const staticSlugs = new Set(INS_PICK_COLLECTIONS.map((collection) => collection.slug));

  return [
    ...INS_PICK_COLLECTIONS,
    ...customCollections.filter((collection) => !staticSlugs.has(collection.slug)),
  ];
}

export async function getInsPickCollection(slug: string | undefined) {
  if (!slug) {
    return null;
  }

  const normalizedSlug = createInsPickSlug(slug);
  const collections = await listInsPickCollections();

  return (
    collections.find((collection) => collection.slug === normalizedSlug) ?? null
  );
}

export function getInsPickUploadTags(
  collection: InsPickCollectionDefinition,
  tags: string[] = [],
) {
  const combined = [
    ...INS_PICK_UPLOAD_SOURCE_TAGS,
    ...collection.requiredTags,
    ...tags,
  ];

  return uniqueText(combined).slice(0, 12);
}

export function getInsPickUploadDirectory(
  collection: InsPickCollectionDefinition,
) {
  return collection.r2Prefix.replace(/^originals\/?/, "");
}

export async function createCustomInsPickCollection(input: {
  aliases?: string[];
  description?: string;
  label: string;
  nativeName?: string;
  slug?: string;
  status?: "active" | "planned";
  subtitle?: string;
}, creatorId: string | number | null) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const slug = createInsPickSlug(input.slug ?? input.label);
  const nativeName = input.nativeName?.trim() ?? "";
  const label = input.label.trim();
  const aliases = uniqueText([
    label,
    nativeName,
    slug,
    ...(input.aliases ?? []),
  ]);
  const requiredTags = uniqueText(["ins", slug, label, nativeName]).slice(0, 8);
  const r2Prefix = getInsPickR2Prefix(slug);
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from(insPickCollectionsTable)
    .insert({
      aliases,
      created_by: creatorId,
      description:
        input.description?.trim() ||
        `${label}${nativeName ? ` / ${nativeName}` : ""} Instagram-style archive.`,
      label,
      native_name: nativeName,
      r2_prefix: r2Prefix,
      required_tags: requiredTags,
      slug,
      status: input.status ?? "active",
      subtitle:
        input.subtitle?.trim() ||
        `${nativeName || label} / Instagram archive`,
    })
    .select("*")
    .single();

  if (error) {
    if (
      error.code === "42P01" ||
      error.message.toLowerCase().includes("does not exist") ||
      error.message.toLowerCase().includes("schema cache")
    ) {
      throw new Error(
        "INS pick collections table is missing. Apply migration 202604010010_ins_pick_collections.sql before creating custom collections.",
      );
    }

    throw new Error(`Failed to create INS pick collection: ${error.message}`);
  }

  if (isR2Configured()) {
    await putR2Object({
      body: "",
      cacheControl: "private, max-age=0, no-store",
      contentType: "text/plain; charset=utf-8",
      path: `${r2Prefix}/.keep`,
      variant: "original",
    }).catch(() => undefined);
  }

  return mapInsPickCollectionRow(data);
}

export async function getInsPickCollectionWallpapers(options: {
  collectionSlug: string;
  limit?: number;
}) {
  const collection = await getInsPickCollection(options.collectionSlug);

  if (!collection) {
    return {
      collection: null,
      wallpapers: [],
    };
  }

  const allWallpapers = await getCachedPublishedWallpapers({
    limit: INS_PICKS_CANDIDATE_LIMIT,
    sort: "latest",
  });

  return {
    collection,
    wallpapers: allWallpapers
      .filter((wallpaper) => wallpaperMatchesCollection(wallpaper, collection))
      .slice(0, Math.max(1, Math.min(options.limit ?? 100, 200))),
  };
}

async function buildInsPicksSnapshot(options: {
  collectionSlug?: string;
  limit?: number;
} = {}): Promise<InsPicksSnapshot> {
  const [allWallpapers, allCollections] = await Promise.all([
    getCachedPublishedWallpapers({
      limit: INS_PICKS_CANDIDATE_LIMIT,
      sort: "latest",
    }),
    listInsPickCollections(),
  ]);
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_COLLECTION_LIMIT, 100));

  const collectionBuckets = allCollections.map((collection) => {
    const wallpapers = allWallpapers.filter((wallpaper) =>
      wallpaperMatchesCollection(wallpaper, collection),
    );

    return {
      collection,
      wallpapers,
    };
  });

  const collections: InsPickCollectionSummary[] = collectionBuckets.map(
    ({ collection, wallpapers }) => ({
      ...collection,
      count: wallpapers.length,
      latestWallpaper: wallpapers[0] ?? null,
      previewWallpapers: wallpapers.slice(0, PREVIEW_WALLPAPER_LIMIT),
    }),
  );

  const selectedCollection =
    options.collectionSlug === undefined
      ? null
      : collections.find(
          (collection) => collection.slug === createInsPickSlug(options.collectionSlug ?? ""),
        ) ?? null;

  const selectedWallpapers = selectedCollection
    ? (collectionBuckets.find(
        ({ collection }) => collection.slug === selectedCollection.slug,
      )?.wallpapers ?? [])
    : [];

  const latestWallpapers = uniqueWallpapers(
    collectionBuckets.flatMap(({ wallpapers }) => wallpapers),
  ).slice(0, limit);
  const uploadMetadata = buildInsPickUploadMetadata(allCollections);

  return {
    collections,
    latestWallpapers,
    selectedCollection,
    sourceTags: INS_PICK_SOURCE_TAGS,
    upload: {
      archiveEndpoint: uploadMetadata.archiveEndpoint,
      collectionsEndpoint: uploadMetadata.collectionsEndpoint,
      createEndpoint: uploadMetadata.createEndpoint,
      href: uploadMetadata.href,
      note: uploadMetadata.note,
      presignEndpoint: uploadMetadata.presignEndpoint,
      requiredTags: uploadMetadata.sourceTags,
    },
    wallpapers: selectedCollection
      ? selectedWallpapers.slice(0, limit)
      : latestWallpapers,
  };
}

export async function getCachedInsPicksSnapshot(options: {
  collectionSlug?: string;
  limit?: number;
} = {}) {
  return buildInsPicksSnapshot(options);
}
