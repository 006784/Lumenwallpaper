import {
  EXPLORE_ASPECT_OPTIONS,
  EXPLORE_CATEGORIES,
  EXPLORE_MEDIA_OPTIONS,
  EXPLORE_ORIENTATION_OPTIONS,
  EXPLORE_RESOLUTION_OPTIONS,
  EXPLORE_SORT_OPTIONS,
  matchesExploreCategory,
  matchesWallpaperAspect,
  matchesWallpaperMedia,
  matchesWallpaperOrientation,
  matchesWallpaperResolution,
} from "@/lib/explore";
import {
  getPreferredWallpaperFile,
  getWallpaperDisplayTitle,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import { getWallpaperByIdOrSlug, listPublishedWallpapers } from "@/lib/wallpapers";
import type {
  Wallpaper,
  WallpaperExploreFacetOption,
  WallpaperExploreFacetsSnapshot,
  WallpaperSeoSnapshot,
} from "@/types/wallpaper";

const DEFAULT_SITE_URL = "https://byteify.icu";
const FACET_WALLPAPER_LIMIT = 1000;
const TOP_COLOR_LIMIT = 16;
const TOP_STYLE_LIMIT = 18;
const TOP_TAG_LIMIT = 24;
const STOP_STYLE_TERMS = new Set([
  "lumen",
  "manual",
  "manual import",
  "openclaw",
  "wallpaper",
  "手动导入",
  "壁纸",
  "精选",
]);

function getSiteBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

function normalizeFacetValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeHexColor(value: string) {
  const normalized = value.trim().replace(/^#/, "").toLowerCase();

  if (!/^[0-9a-f]{6}$/.test(normalized)) {
    return null;
  }

  return `#${normalized}`;
}

function incrementCount(map: Map<string, number>, value: string) {
  map.set(value, (map.get(value) ?? 0) + 1);
}

function createFixedOption(
  option: {
    description?: string;
    label: string;
    value: string;
  },
  count: number,
): WallpaperExploreFacetOption {
  return {
    count,
    description: option.description,
    label: option.label,
    value: option.value,
  };
}

function createCountedOptions(
  counts: Map<string, number>,
  options?: {
    limit?: number;
    swatches?: boolean;
  },
): WallpaperExploreFacetOption[] {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, options?.limit)
    .map(([value, count]) => ({
      count,
      label: value,
      ...(options?.swatches ? { swatch: value } : {}),
      value,
    }));
}

function getStyleTerms(wallpaper: Wallpaper) {
  return [
    ...wallpaper.aiTags,
    wallpaper.aiCategory ?? "",
    wallpaper.tags[0] ?? "",
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => !STOP_STYLE_TERMS.has(normalizeFacetValue(term)));
}

function getTagTerms(wallpaper: Wallpaper) {
  return wallpaper.tags
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term) => !STOP_STYLE_TERMS.has(normalizeFacetValue(term)));
}

function getSeoDescription(wallpaper: Wallpaper) {
  const normalizedDescription = wallpaper.description?.trim();

  if (
    normalizedDescription &&
    !/Cloudflare R2|手动导入|原图/i.test(normalizedDescription)
  ) {
    return normalizedDescription;
  }

  const terms = [
    ...wallpaper.aiTags,
    ...wallpaper.tags,
    wallpaper.aiCategory ?? "",
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 5);

  return `${getWallpaperDisplayTitle(wallpaper)} · ${terms.join(" · ") || "高质感壁纸"} · 来自 Lumen 的 4K 高清壁纸。`;
}

function getSeoKeywords(wallpaper: Wallpaper) {
  return [
    getWallpaperDisplayTitle(wallpaper),
    ...wallpaper.aiTags,
    ...wallpaper.tags,
    wallpaper.aiCategory ?? "",
    wallpaper.videoUrl ? "动态壁纸" : "静态壁纸",
    "4K壁纸",
    "Lumen",
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term, index, array) => array.indexOf(term) === index)
    .slice(0, 18);
}

export async function getWallpaperExploreFacets(): Promise<WallpaperExploreFacetsSnapshot> {
  const wallpapers = await listPublishedWallpapers({
    limit: FACET_WALLPAPER_LIMIT,
  });
  const colorCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const motionCount = wallpapers.filter((wallpaper) => wallpaper.videoUrl).length;

  for (const wallpaper of wallpapers) {
    const seenColors = new Set<string>();
    const seenStyles = new Set<string>();
    const seenTags = new Set<string>();

    for (const color of wallpaper.colors) {
      const normalizedColor = normalizeHexColor(color);

      if (normalizedColor) {
        seenColors.add(normalizedColor);
      }
    }

    for (const term of getStyleTerms(wallpaper)) {
      seenStyles.add(term);
    }

    for (const term of getTagTerms(wallpaper)) {
      seenTags.add(term);
    }

    for (const color of seenColors) {
      incrementCount(colorCounts, color);
    }

    for (const style of seenStyles) {
      incrementCount(styleCounts, style);
    }

    for (const tag of seenTags) {
      incrementCount(tagCounts, tag);
    }
  }

  return {
    filters: {
      aspect: EXPLORE_ASPECT_OPTIONS.map((option) =>
        createFixedOption(
          option,
          wallpapers.filter((wallpaper) =>
            matchesWallpaperAspect(wallpaper, option.value),
          ).length,
        ),
      ),
      category: EXPLORE_CATEGORIES.map((category) =>
        createFixedOption(
          {
            description: category.description,
            label: category.label,
            value: category.slug,
          },
          wallpapers.filter((wallpaper) =>
            matchesExploreCategory(wallpaper, category.slug),
          ).length,
        ),
      ),
      color: createCountedOptions(colorCounts, {
        limit: TOP_COLOR_LIMIT,
        swatches: true,
      }),
      media: EXPLORE_MEDIA_OPTIONS.map((option) =>
        createFixedOption(
          option,
          option.value === "all"
            ? wallpapers.length
            : wallpapers.filter((wallpaper) =>
                matchesWallpaperMedia(wallpaper, {
                  media: option.value,
                }),
              ).length,
        ),
      ),
      orientation: EXPLORE_ORIENTATION_OPTIONS.map((option) =>
        createFixedOption(
          option,
          wallpapers.filter((wallpaper) =>
            matchesWallpaperOrientation(wallpaper, option.value),
          ).length,
        ),
      ),
      resolution: EXPLORE_RESOLUTION_OPTIONS.map((option) =>
        createFixedOption(
          option,
          wallpapers.filter((wallpaper) =>
            matchesWallpaperResolution(wallpaper, option.value),
          ).length,
        ),
      ),
      sort: EXPLORE_SORT_OPTIONS.map((option) =>
        createFixedOption(option, wallpapers.length),
      ),
      style: createCountedOptions(styleCounts, {
        limit: TOP_STYLE_LIMIT,
      }),
      tag: createCountedOptions(tagCounts, {
        limit: TOP_TAG_LIMIT,
      }),
    },
    generatedAt: new Date().toISOString(),
    totals: {
      all: wallpapers.length,
      motion: motionCount,
      static: wallpapers.length - motionCount,
    },
  };
}

export async function getWallpaperSeoSnapshot(
  identifier: string,
): Promise<WallpaperSeoSnapshot | null> {
  const wallpaper = await getWallpaperByIdOrSlug(identifier);

  if (!wallpaper || wallpaper.status !== "published") {
    return null;
  }

  const siteBaseUrl = getSiteBaseUrl();
  const title = `${getWallpaperDisplayTitle(wallpaper)} - Lumen 高清壁纸`;
  const description = getSeoDescription(wallpaper);
  const canonicalUrl = `${siteBaseUrl}/wallpaper/${encodeURIComponent(wallpaper.slug)}`;
  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const imageUrl =
    preferredFile?.url && !preferredFile.url.startsWith("data:")
      ? preferredFile.url
      : (getWallpaperPreviewUrl(wallpaper, "large") ?? null);
  const image = {
    alt: getWallpaperDisplayTitle(wallpaper),
    height: preferredFile?.height ?? wallpaper.height,
    url: imageUrl,
    width: preferredFile?.width ?? wallpaper.width,
  };
  const keywords = getSeoKeywords(wallpaper);
  const creatorName = wallpaper.creator?.username ?? "Lumen";

  return {
    canonicalUrl,
    description,
    image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      author: {
        "@type": "Person",
        name: creatorName,
      },
      contentUrl: imageUrl,
      datePublished: wallpaper.createdAt,
      description,
      height: image.height,
      keywords,
      license: wallpaper.licenseVersion
        ? `${siteBaseUrl}/license/${encodeURIComponent(wallpaper.licenseVersion)}`
        : undefined,
      name: getWallpaperDisplayTitle(wallpaper),
      url: canonicalUrl,
      width: image.width,
    },
    keywords,
    openGraph: {
      description,
      images: imageUrl
        ? [
            {
              alt: image.alt,
              height: image.height,
              url: imageUrl,
              width: image.width,
            },
          ]
        : [],
      title,
      type: "article",
      url: canonicalUrl,
    },
    source: {
      id: wallpaper.id,
      slug: wallpaper.slug,
      title: getWallpaperDisplayTitle(wallpaper),
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      image: imageUrl,
      title,
    },
  };
}
