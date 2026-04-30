import {
  darkroomItems as fallbackDarkroomItems,
  editorialFeature as fallbackEditorialFeature,
  editorialItems as fallbackEditorialItems,
  heroFilmRows as fallbackHeroFilmRows,
  moodCards as fallbackMoodCards,
} from "@/lib/data/home";
import { DEFAULT_LOCALE, translateStaticText } from "@/lib/i18n";
import {
  getCachedFeaturedWallpapers,
  getCachedPublishedWallpapers,
} from "@/lib/public-wallpaper-cache";
import {
  wallpaperToDarkroomItem,
  wallpaperToEditorialFeature,
  wallpaperToEditorialItem,
  wallpaperToFilmCell,
  wallpaperToMoodCard,
} from "@/lib/wallpaper-presenters";
import type { SupportedLocale } from "@/types/i18n";
import type { HomePageSnapshot } from "@/types/home-api";
import type { Wallpaper } from "@/types/wallpaper";

const HOME_PUBLISHED_POOL_LIMIT = 96;
const HOME_FEATURED_POOL_LIMIT = 36;
const HOME_MOTION_LIMIT = 9;
const HOME_IOS_POOL_LIMIT = 72;

async function loadHomePool(label: string, loader: () => Promise<Wallpaper[]>) {
  try {
    return await loader();
  } catch (error) {
    console.warn(`[home] failed to load ${label}`, error);
    return [];
  }
}

function getAdaptiveHomeLimits(staticPoolSize: number) {
  if (staticPoolSize >= 72) {
    return {
      darkroom: 12,
      editorialItems: 6,
      ios: 15,
      mood: 18,
    };
  }

  if (staticPoolSize >= 40) {
    return {
      darkroom: 10,
      editorialItems: 5,
      ios: 10,
      mood: 14,
    };
  }

  if (staticPoolSize >= 20) {
    return {
      darkroom: 8,
      editorialItems: 4,
      ios: 8,
      mood: 10,
    };
  }

  if (staticPoolSize >= 12) {
    return {
      darkroom: 5,
      editorialItems: 2,
      ios: 5,
      mood: 7,
    };
  }

  return {
    darkroom: 2,
    editorialItems: 1,
    ios: 2,
    mood: 4,
  };
}

function getUniqueWallpapers(sources: Wallpaper[][]) {
  const seen = new Set<string>();
  const items: Wallpaper[] = [];

  for (const source of sources) {
    for (const wallpaper of source) {
      if (seen.has(wallpaper.id)) {
        continue;
      }

      seen.add(wallpaper.id);
      items.push(wallpaper);
    }
  }

  return items;
}

function takeUniqueWallpapers(options: {
  limit: number;
  predicate?: (wallpaper: Wallpaper) => boolean;
  sources: Wallpaper[][];
  usedIds: Set<string>;
}) {
  const items: Wallpaper[] = [];

  for (const source of options.sources) {
    for (const wallpaper of source) {
      if (items.length >= options.limit) {
        return items;
      }

      if (options.usedIds.has(wallpaper.id)) {
        continue;
      }

      if (options.predicate && !options.predicate(wallpaper)) {
        continue;
      }

      options.usedIds.add(wallpaper.id);
      items.push(wallpaper);
    }
  }

  return items;
}

function groupFilmRows(cells: HomePageSnapshot["heroFilmRows"][number]) {
  return [cells.slice(0, 3), cells.slice(3, 6), cells.slice(6, 9)].filter(
    (row) => row.length > 0,
  );
}

function isPortraitWallpaper(wallpaper: Wallpaper) {
  if (
    typeof wallpaper.width === "number" &&
    typeof wallpaper.height === "number" &&
    wallpaper.width > 0 &&
    wallpaper.height > 0
  ) {
    return wallpaper.height > wallpaper.width;
  }

  const previewFile = wallpaper.files.find(
    (file) => file.variant === "preview",
  );

  if (
    typeof previewFile?.width === "number" &&
    typeof previewFile?.height === "number" &&
    previewFile.width > 0 &&
    previewFile.height > 0
  ) {
    return previewFile.height > previewFile.width;
  }

  return false;
}

function getFallbackHomePageSnapshot(
  locale: SupportedLocale = DEFAULT_LOCALE,
): HomePageSnapshot {
  return {
    darkroomItems: fallbackDarkroomItems.map((item) => ({
      ...item,
      badge: item.badge ? translateStaticText(item.badge, locale) : undefined,
      meta: translateStaticText(item.meta, locale),
      title: translateStaticText(item.title, locale),
    })),
    editorialFeature: {
      ...fallbackEditorialFeature,
      description: translateStaticText(
        fallbackEditorialFeature.description,
        locale,
      ),
      eyebrow: translateStaticText(fallbackEditorialFeature.eyebrow, locale),
      title: translateStaticText(fallbackEditorialFeature.title, locale),
    },
    editorialItems: fallbackEditorialItems.map((item) => ({
      ...item,
      meta: translateStaticText(item.meta, locale),
      title: translateStaticText(item.title, locale),
    })),
    heroFilmRows: fallbackHeroFilmRows.map((row) =>
      row.map((cell) => ({
        ...cell,
        label: translateStaticText(cell.label, locale),
      })),
    ),
    iosWallpapers: [],
    locale,
    moodCards: fallbackMoodCards.map((card) => ({
      ...card,
      meta: translateStaticText(card.meta, locale),
      name: translateStaticText(card.name, locale),
    })),
  };
}

export async function getHomePageSnapshot(
  locale: SupportedLocale = DEFAULT_LOCALE,
): Promise<HomePageSnapshot> {
  const [
    publishedWallpapers,
    featuredWallpapers,
    motionWallpapers,
    iosCandidates,
  ] = await Promise.all([
    loadHomePool("published wallpapers", () =>
      getCachedPublishedWallpapers({
        limit: HOME_PUBLISHED_POOL_LIMIT,
        sort: "latest",
        motion: false,
      }),
    ),
    loadHomePool("featured wallpapers", () =>
      getCachedFeaturedWallpapers({
        limit: HOME_FEATURED_POOL_LIMIT,
        sort: "popular",
        motion: false,
      }),
    ),
    loadHomePool("motion wallpapers", () =>
      getCachedPublishedWallpapers({
        limit: HOME_MOTION_LIMIT,
        sort: "latest",
        motion: true,
      }),
    ),
    loadHomePool("ios wallpapers", () =>
      getCachedPublishedWallpapers({
        limit: HOME_IOS_POOL_LIMIT,
        sort: "latest",
        motion: false,
      }),
    ),
  ]);

  const fallbackSnapshot = getFallbackHomePageSnapshot(locale);
  const staticPool = getUniqueWallpapers([
    featuredWallpapers,
    iosCandidates,
    publishedWallpapers,
  ]);
  const adaptiveLimits = getAdaptiveHomeLimits(staticPool.length);
  const usedStaticWallpapers = new Set<string>();

  const editorialFeatureWallpaper =
    takeUniqueWallpapers({
      limit: 1,
      sources: [featuredWallpapers, publishedWallpapers],
      usedIds: usedStaticWallpapers,
    })[0] ?? null;
  const iosWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.ios,
    predicate: isPortraitWallpaper,
    sources: [iosCandidates, publishedWallpapers, featuredWallpapers],
    usedIds: usedStaticWallpapers,
  });
  const moodWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.mood,
    sources: [publishedWallpapers, featuredWallpapers, iosCandidates],
    usedIds: usedStaticWallpapers,
  });
  const editorialItemsWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.editorialItems,
    sources: [featuredWallpapers, publishedWallpapers],
    usedIds: usedStaticWallpapers,
  });
  const darkroomWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.darkroom,
    sources: [featuredWallpapers, publishedWallpapers],
    usedIds: usedStaticWallpapers,
  });
  const motionCells = motionWallpapers.map((wallpaper) =>
    wallpaperToFilmCell(wallpaper, locale),
  );
  const heroFilmRows =
    motionCells.length > 0
      ? groupFilmRows(
          [...motionCells, ...fallbackHeroFilmRows.flatMap((row) => row)].slice(
            0,
            HOME_MOTION_LIMIT,
          ),
        )
      : fallbackSnapshot.heroFilmRows;

  return {
    locale,
    moodCards:
      moodWallpapers.length > 0
        ? moodWallpapers.map((wallpaper, index) =>
            wallpaperToMoodCard(wallpaper, index, locale),
          )
        : fallbackSnapshot.moodCards,
    editorialFeature: editorialFeatureWallpaper
      ? wallpaperToEditorialFeature(editorialFeatureWallpaper, locale)
      : fallbackSnapshot.editorialFeature,
    editorialItems:
      editorialItemsWallpapers.length > 0
        ? editorialItemsWallpapers.map((wallpaper, index) =>
            wallpaperToEditorialItem(wallpaper, index, locale),
          )
        : fallbackSnapshot.editorialItems,
    heroFilmRows,
    iosWallpapers,
    darkroomItems:
      darkroomWallpapers.length > 0
        ? darkroomWallpapers.map((wallpaper, index) =>
            wallpaperToDarkroomItem(wallpaper, {
              featured: index === 0,
              locale,
            }),
          )
        : fallbackSnapshot.darkroomItems,
  };
}
