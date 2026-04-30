import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
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

export const INS_PICK_SOURCE_TAGS = [
  "ins",
  "instagram",
  "instagram-post",
  "celebrity",
  "editorial",
];

export const INS_PICK_UPLOAD_SOURCE_TAGS = ["ins", "instagram", "celebrity"];

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
    slug: "bae-joohyun",
    label: "Irene",
    nativeName: "裴珠泫",
    subtitle: "Irene / Instagram archive",
    description:
      "Red Velvet elegance, calm portraits, styling details, and clean editorial crops.",
    gradient: "dusk",
    href: "/ins/bae-joohyun",
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
  },
  {
    slug: "karina-yu-jimin",
    label: "Karina",
    nativeName: "柳智敏",
    subtitle: "Karina / Instagram archive",
    description:
      "Aespa stage polish, mirrored details, cyber-clean portraits, and sharp phone crops.",
    gradient: "ice",
    href: "/ins/karina-yu-jimin",
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
  },
  {
    slug: "bae-suzy",
    label: "Bae Suzy",
    nativeName: "裴秀智",
    subtitle: "Suzy / Instagram archive",
    description:
      "Bright natural portraits, actress stills, travel frames, and soft fashion moments.",
    gradient: "moss",
    href: "/ins/bae-suzy",
    status: "active",
    aliases: ["bae suzy", "suzy", "裴秀智", "배수지", "miss a suzy"],
    requiredTags: ["ins", "bae-suzy", "suzy", "裴秀智"],
  },
  {
    slug: "kim-jisoo",
    label: "Kim Jisoo",
    nativeName: "金智秀",
    subtitle: "Jisoo / Instagram archive",
    description:
      "Blackpink portraits, city looks, magazine stills, and polished wallpaper-ready crops.",
    gradient: "blush",
    href: "/ins/kim-jisoo",
    status: "active",
    aliases: [
      "kim jisoo",
      "jisoo",
      "金智秀",
      "김지수",
      "blackpink jisoo",
    ],
    requiredTags: ["ins", "kim-jisoo", "jisoo", "金智秀"],
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

export const INS_PICK_UPLOAD_METADATA: InsPickUploadMetadata = {
  collections: INS_PICK_COLLECTIONS.map((collection) => ({
    label: collection.label,
    nativeName: collection.nativeName,
    requiredTags: collection.requiredTags,
    slug: collection.slug,
    status: collection.status,
  })),
  createEndpoint: "/api/ins-picks/upload",
  href: "/creator/studio",
  note:
    "Use this dedicated INS upload contract after presign. It reuses the standard wallpaper upload pipeline and auto-applies source + person tags.",
  presignEndpoint: "/api/ins-picks/upload/presign",
  sourceTags: INS_PICK_SOURCE_TAGS,
};

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
      (value) => value === alias || value.includes(alias),
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

export function getInsPickUploadTags(
  collection: InsPickCollectionDefinition,
  tags: string[] = [],
) {
  const result: string[] = [];
  const seen = new Set<string>();
  const combined = [
    ...INS_PICK_UPLOAD_SOURCE_TAGS,
    ...collection.requiredTags,
    ...tags,
  ];

  for (const tag of combined) {
    const trimmed = tag.trim();
    const key = normalizeMatchValue(trimmed);

    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(trimmed);

    if (result.length >= 12) {
      break;
    }
  }

  return result;
}

async function buildInsPicksSnapshot(options: {
  collectionSlug?: string;
  limit?: number;
} = {}): Promise<InsPicksSnapshot> {
  const allWallpapers = await getCachedPublishedWallpapers({
    limit: INS_PICKS_CANDIDATE_LIMIT,
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
      createEndpoint: INS_PICK_UPLOAD_METADATA.createEndpoint,
      href: INS_PICK_UPLOAD_METADATA.href,
      note: INS_PICK_UPLOAD_METADATA.note,
      presignEndpoint: INS_PICK_UPLOAD_METADATA.presignEndpoint,
      requiredTags: INS_PICK_UPLOAD_METADATA.sourceTags,
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
  return buildInsPicksSnapshot(options);
}
