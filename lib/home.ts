import {
  darkroomItems as fallbackDarkroomItems,
  editorialFeature as fallbackEditorialFeature,
  editorialItems as fallbackEditorialItems,
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
  wallpaperToMoodCard,
} from "@/lib/wallpaper-presenters";
import type { HomePageSnapshot } from "@/types/home-api";

const HOME_MOOD_CARD_LIMIT = 10;
const HOME_FEATURED_LIMIT = 5;

function getFallbackHomePageSnapshot(): HomePageSnapshot {
  return {
    darkroomItems: fallbackDarkroomItems,
    editorialFeature: fallbackEditorialFeature,
    editorialItems: fallbackEditorialItems,
    moodCards: fallbackMoodCards,
  };
}

export async function getHomePageSnapshot(): Promise<HomePageSnapshot> {
  const [publishedWallpapers, featuredWallpapers] = await Promise.all([
    getCachedPublishedWallpapers({
      limit: HOME_MOOD_CARD_LIMIT,
      sort: "latest",
    }),
    getCachedFeaturedWallpapers({
      limit: HOME_FEATURED_LIMIT,
      sort: "popular",
    }),
  ]);

  const fallbackSnapshot = getFallbackHomePageSnapshot();
  const featureSource =
    featuredWallpapers.length > 0 ? featuredWallpapers : publishedWallpapers;
  const editorialFeatureWallpaper = featureSource[0] ?? null;
  const editorialItemsWallpapers = featureSource.slice(1, 4);
  const darkroomSource =
    featuredWallpapers.length >= HOME_FEATURED_LIMIT
      ? featuredWallpapers
      : publishedWallpapers;

  return {
    moodCards:
      publishedWallpapers.length > 0
        ? publishedWallpapers.map((wallpaper, index) =>
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
    darkroomItems:
      darkroomSource.length > 0
        ? darkroomSource.slice(0, HOME_FEATURED_LIMIT).map((wallpaper, index) =>
            wallpaperToDarkroomItem(wallpaper, {
              featured: index === 0,
            }),
          )
        : fallbackSnapshot.darkroomItems,
  };
}
