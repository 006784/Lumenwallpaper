import { unstable_cache } from "next/cache";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import type {
  InsPickCollectionDefinition,
  InsPickCollectionSummary,
  InsPicksSnapshot,
} from "@/types/ins-picks";
import type { Wallpaper } from "@/types/wallpaper";

const INS_PICKS_CACHE_VERSION = "v1";
const DEFAULT_COLLECTION_LIMIT = 24;
const PREVIEW_WALLPAPER_LIMIT = 4;

export const INS_PICK_SOURCE_TAGS = [
  "ins",
  "instagram",
  "instagram-post",
  "celebrity",
  "editorial",
];

export const INS_PICK_COLLECTIONS: InsPickCollectionDefinition[] = [
  {
    slug: "jang-wonyoung",
    label: "Jang Wonyoung",
    nativeName: "张元英",
    subtitle: "IVE / Instagram archive",
    description:
      "Stage polish, mirror selfies, airport looks, and clean phone-wallpaper crops.",
    gradient: "blush",
    href: "/ins/jang-wonyoung",
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
  },
  {
    slug: "iu",
    label: "IU",
    nativeName: "李知恩",
    subtitle: "IU / Instagram archive",
    description:
      "Soft portraits, concert moments, travel frames, and calm warm-toned crops.",
    gradient: "ice",
    href: "/ins/iu",
    status: "active",
    aliases: ["iu", "李知恩", "李智恩", "이지은", "아이유", "lee jieun"],
    requiredTags: ["ins", "iu", "李知恩"],
  },
  {
    slug: "lim-yoona",
    label: "Lim Yoona",
    nativeName: "林允儿",
    subtitle: "Yoona / Instagram archive",
    description:
      "Elegant portraits, city travel, fashion details, and bright magazine-like stills.",
    gradient: "moss",
    href: "/ins/lim-yoona",
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
  },
  {
    slug: "liu-yifei",
    label: "Liu Yifei",
    nativeName: "刘亦菲",
    subtitle: "Coming next / domestic archive",
    description:
      "A reserved slot for future domestic celebrity sets, posters, and editorial crops.",
    gradient: "dusk",
    href: "/ins/liu-yifei",
    status: "planned",
    aliases: ["liu yifei", "刘亦菲", "劉亦菲", "crystal liu"],
    requiredTags: ["ins", "liu-yifei", "刘亦菲"],
  },
];

function normalizeMatchValue(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[.#_@/\\|()[\]{}:;'"，。、“”‘’·・\-\s]+/g, "");
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
  const aliases = collection.aliases.map(normalizeMatchValue);

  return aliases.some((alias) => {
    return values.some(
      (value) => value === alias || value.includes(alias) || alias.includes(value),
    );
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

async function buildInsPicksSnapshot(options: {
  collectionSlug?: string;
  limit?: number;
} = {}): Promise<InsPicksSnapshot> {
  const allWallpapers = await getCachedPublishedWallpapers({
    limit: 1000,
    sort: "latest",
  });
  const limit = Math.max(1, Math.min(options.limit ?? DEFAULT_COLLECTION_LIMIT, 100));

  const collectionBuckets = INS_PICK_COLLECTIONS.map((collection) => {
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
      : collections.find((collection) => collection.slug === options.collectionSlug) ??
        null;

  const selectedWallpapers = selectedCollection
    ? (collectionBuckets.find(
        ({ collection }) => collection.slug === selectedCollection.slug,
      )?.wallpapers ?? [])
    : [];

  const latestWallpapers = uniqueWallpapers(
    collectionBuckets.flatMap(({ wallpapers }) => wallpapers),
  ).slice(0, limit);

  return {
    collections,
    latestWallpapers,
    selectedCollection,
    sourceTags: INS_PICK_SOURCE_TAGS,
    upload: {
      href: "/creator/studio",
      note:
        "Use the existing upload studio. Add the source tag plus the person tag so this zone can classify it automatically.",
      requiredTags: INS_PICK_SOURCE_TAGS,
    },
    wallpapers: selectedCollection
      ? selectedWallpapers.slice(0, limit)
      : latestWallpapers,
  };
}

export function getInsPickCollection(slug: string | undefined) {
  if (!slug) {
    return null;
  }

  return (
    INS_PICK_COLLECTIONS.find(
      (collection) => collection.slug === slug.trim().toLowerCase(),
    ) ?? null
  );
}

export async function getCachedInsPicksSnapshot(options: {
  collectionSlug?: string;
  limit?: number;
} = {}) {
  return unstable_cache(
    async () => buildInsPicksSnapshot(options),
    [
      "ins-picks",
      INS_PICKS_CACHE_VERSION,
      options.collectionSlug ?? "all",
      String(options.limit ?? "default"),
    ],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "wallpapers:ins-picks"],
    },
  )();
}
