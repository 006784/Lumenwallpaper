import {
  darkroomItems as fallbackDarkroomItems,
  editorialFeature as fallbackEditorialFeature,
  editorialItems as fallbackEditorialItems,
  heroFilmRows as fallbackHeroFilmRows,
  moodCards as fallbackMoodCards,
} from "@/lib/data/home";
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
import type { HomePageSnapshot } from "@/types/home-api";
import type { Wallpaper } from "@/types/wallpaper";

const HOME_PUBLISHED_POOL_LIMIT = 30;
const HOME_FEATURED_POOL_LIMIT = 12;
const HOME_MOTION_LIMIT = 9;
const HOME_IOS_POOL_LIMIT = 24;

function getAdaptiveHomeLimits(staticPoolSize: number) {
  if (staticPoolSize >= 18) {
    return {
      darkroom: 5,
      editorialItems: 3,
      ios: 4,
      mood: 8,
    };
  }

  if (staticPoolSize >= 12) {
    return {
      darkroom: 3,
      editorialItems: 2,
      ios: 3,
      mood: 5,
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

  const previewFile = wallpaper.files.find((file) => file.variant === "preview");

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

function getFallbackHomePageSnapshot(): HomePageSnapshot {
  return {
    darkroomItems: fallbackDarkroomItems,
    editorialFeature: fallbackEditorialFeature,
    editorialItems: fallbackEditorialItems,
    heroFilmRows: fallbackHeroFilmRows,
    iosWallpapers: [],
    moodCards: fallbackMoodCards,
  };
}

export async function getHomePageSnapshot(): Promise<HomePageSnapshot> {
  const [publishedWallpapers, featuredWallpapers, motionWallpapers, iosCandidates] =
    await Promise.all([
    getCachedPublishedWallpapers({
      limit: HOME_PUBLISHED_POOL_LIMIT,
      sort: "latest",
      motion: false,
    }),
    getCachedFeaturedWallpapers({
      limit: HOME_FEATURED_POOL_LIMIT,
      sort: "popular",
      motion: false,
    }),
    getCachedPublishedWallpapers({
      limit: HOME_MOTION_LIMIT,
      sort: "latest",
      motion: true,
    }),
    getCachedPublishedWallpapers({
      limit: HOME_IOS_POOL_LIMIT,
      sort: "latest",
      motion: false,
    }),
  ]);

  const fallbackSnapshot = getFallbackHomePageSnapshot();
  const staticPool = getUniqueWallpapers([
    featuredWallpapers,
    iosCandidates,
    publishedWallpapers,
  ]);
  const adaptiveLimits = getAdaptiveHomeLimits(staticPool.length);
  const usedStaticWallpapers = new Set<string>();

  const moodWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.mood,
    sources: [publishedWallpapers, featuredWallpapers],
    usedIds: usedStaticWallpapers,
  });
  const iosWallpapers = takeUniqueWallpapers({
    limit: adaptiveLimits.ios,
    predicate: isPortraitWallpaper,
    sources: [iosCandidates, publishedWallpapers, featuredWallpapers],
    usedIds: usedStaticWallpapers,
  });
  const editorialFeatureWallpaper =
    takeUniqueWallpapers({
      limit: 1,
      sources: [featuredWallpapers, publishedWallpapers],
      usedIds: usedStaticWallpapers,
    })[0] ?? null;
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
  const motionCells = motionWallpapers.map(wallpaperToFilmCell);
  const heroFilmRows =
    motionCells.length > 0
      ? groupFilmRows([
          ...motionCells,
          ...fallbackHeroFilmRows.flatMap((row) => row),
        ].slice(0, HOME_MOTION_LIMIT))
      : fallbackSnapshot.heroFilmRows;

  return {
    moodCards:
      moodWallpapers.length > 0
        ? moodWallpapers.map((wallpaper, index) =>
            wallpaperToMoodCard(wallpaper, index),
          )
        : fallbackSnapshot.moodCards,
    editorialFeature: editorialFeatureWallpaper
      ? wallpaperToEditorialFeature(editorialFeatureWallpaper)
      : fallbackSnapshot.editorialFeature,
    editorialItems:
      editorialItemsWallpapers.length > 0
        ? editorialItemsWallpapers.map((wallpaper, index) =>
            wallpaperToEditorialItem(wallpaper, index),
          )
        : fallbackSnapshot.editorialItems,
    heroFilmRows,
    iosWallpapers,
    darkroomItems:
      darkroomWallpapers.length > 0
        ? darkroomWallpapers.map((wallpaper, index) =>
            wallpaperToDarkroomItem(wallpaper, {
              featured: index === 0,
            }),
          )
        : fallbackSnapshot.darkroomItems,
  };
}
