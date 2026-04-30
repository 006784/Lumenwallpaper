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
  DEFAULT_LOCALE,
  getExploreCategoryCopy,
  getExploreOptionCopy,
  getI18nMessages,
  translateStaticTerm,
} from "@/lib/i18n";
import {
  getPreferredWallpaperFile,
  getWallpaperDisplayTitle,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { SupportedLocale } from "@/types/i18n";
import {
  getWallpaperByIdOrSlug,
  listPublishedWallpapers,
} from "@/lib/wallpapers";
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

function localizeFixedOption(
  option: {
    description?: string;
    label: string;
    value: string;
  },
  options: {
    count: number;
    group: "aspect" | "media" | "orientation" | "resolution" | "sort";
    locale: SupportedLocale;
  },
) {
  const copy = getExploreOptionCopy(
    options.locale,
    options.group,
    option.value,
  );

  return createFixedOption(
    {
      ...option,
      description: copy?.description ?? option.description,
      label: copy?.label ?? option.label,
    },
    options.count,
  );
}

function createCountedOptions(
  counts: Map<string, number>,
  options?: {
    limit?: number;
    locale?: SupportedLocale;
    swatches?: boolean;
  },
): WallpaperExploreFacetOption[] {
  return [...counts.entries()]
    .sort(
      (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
    )
    .slice(0, options?.limit)
    .map(([value, count]) => ({
      count,
      label: translateStaticTerm(value, options?.locale ?? DEFAULT_LOCALE),
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

function getSeoDescription(wallpaper: Wallpaper, locale: SupportedLocale) {
  const normalizedDescription = wallpaper.description?.trim();

  if (
    normalizedDescription &&
    !/Cloudflare R2|手动导入|原图/i.test(normalizedDescription)
  ) {
    return normalizedDescription;
  }

  const messages = getI18nMessages(locale);
  const terms = [
    ...wallpaper.aiTags,
    ...wallpaper.tags,
    wallpaper.aiCategory ?? "",
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 5);

  return `${getWallpaperDisplayTitle(wallpaper, locale)} · ${
    terms.map((term) => translateStaticTerm(term, locale)).join(" · ") ||
    messages.wallpaper.curated
  } · ${messages.wallpaper.seoDescriptionFallback}`;
}

function getSeoKeywords(wallpaper: Wallpaper, locale: SupportedLocale) {
  const messages = getI18nMessages(locale);

  return [
    getWallpaperDisplayTitle(wallpaper, locale),
    ...wallpaper.aiTags.map((term) => translateStaticTerm(term, locale)),
    ...wallpaper.tags.map((term) => translateStaticTerm(term, locale)),
    translateStaticTerm(wallpaper.aiCategory ?? "", locale),
    wallpaper.videoUrl
      ? messages.wallpaper.motionWallpaper
      : messages.wallpaper.staticWallpaper,
    messages.wallpaper.seoTitleSuffix,
    "Lumen",
  ]
    .map((term) => term.trim())
    .filter(Boolean)
    .filter((term, index, array) => array.indexOf(term) === index)
    .slice(0, 18);
}

export async function getWallpaperExploreFacets(
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<WallpaperExploreFacetsSnapshot> {
  const wallpapers = await listPublishedWallpapers({
    limit: FACET_WALLPAPER_LIMIT,
  });
  const colorCounts = new Map<string, number>();
  const styleCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  const motionCount = wallpapers.filter(
    (wallpaper) => wallpaper.videoUrl,
  ).length;

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
        localizeFixedOption(option, {
          count: wallpapers.filter((wallpaper) =>
            matchesWallpaperAspect(wallpaper, option.value),
          ).length,
          group: "aspect",
          locale,
        }),
      ),
      category: EXPLORE_CATEGORIES.map((category) =>
        createFixedOption(
          {
            description:
              getExploreCategoryCopy(locale, category.slug)?.description ??
              category.description,
            label:
              getExploreCategoryCopy(locale, category.slug)?.label ??
              category.label,
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
        localizeFixedOption(option, {
          count:
            option.value === "all"
              ? wallpapers.length
              : wallpapers.filter((wallpaper) =>
                  matchesWallpaperMedia(wallpaper, {
                    media: option.value,
                  }),
                ).length,
          group: "media",
          locale,
        }),
      ),
      orientation: EXPLORE_ORIENTATION_OPTIONS.map((option) =>
        localizeFixedOption(option, {
          count: wallpapers.filter((wallpaper) =>
            matchesWallpaperOrientation(wallpaper, option.value),
          ).length,
          group: "orientation",
          locale,
        }),
      ),
      resolution: EXPLORE_RESOLUTION_OPTIONS.map((option) =>
        localizeFixedOption(option, {
          count: wallpapers.filter((wallpaper) =>
            matchesWallpaperResolution(wallpaper, option.value),
          ).length,
          group: "resolution",
          locale,
        }),
      ),
      sort: EXPLORE_SORT_OPTIONS.map((option) =>
        localizeFixedOption(option, {
          count: wallpapers.length,
          group: "sort",
          locale,
        }),
      ),
      style: createCountedOptions(styleCounts, {
        limit: TOP_STYLE_LIMIT,
        locale,
      }),
      tag: createCountedOptions(tagCounts, {
        limit: TOP_TAG_LIMIT,
        locale,
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
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<WallpaperSeoSnapshot | null> {
  const wallpaper = await getWallpaperByIdOrSlug(identifier);

  if (!wallpaper || wallpaper.status !== "published") {
    return null;
  }

  const messages = getI18nMessages(locale);
  const siteBaseUrl = getSiteBaseUrl();
  const displayTitle = getWallpaperDisplayTitle(wallpaper, locale);
  const title = `${displayTitle} - ${messages.wallpaper.seoTitleSuffix}`;
  const description = getSeoDescription(wallpaper, locale);
  const canonicalUrl = `${siteBaseUrl}/wallpaper/${encodeURIComponent(wallpaper.slug)}`;
  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const imageUrl =
    preferredFile?.url && !preferredFile.url.startsWith("data:")
      ? preferredFile.url
      : (getWallpaperPreviewUrl(wallpaper, "large") ?? null);
  const image = {
    alt: displayTitle,
    height: preferredFile?.height ?? wallpaper.height,
    url: imageUrl,
    width: preferredFile?.width ?? wallpaper.width,
  };
  const keywords = getSeoKeywords(wallpaper, locale);
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
      name: displayTitle,
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
      title: displayTitle,
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
