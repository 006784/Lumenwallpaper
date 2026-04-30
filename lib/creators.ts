import type { CreatorPageSnapshot } from "@/types/creator-api";
import {
  getCreatorByUsername,
  isInsPickWallpaper,
  listWallpapersByCreator,
} from "@/lib/wallpapers";
import { getWallpaperDisplayTitle } from "@/lib/wallpaper-presenters";

function summarizeCreatorWallpapers(
  wallpapers: CreatorPageSnapshot["wallpapers"],
): CreatorPageSnapshot["stats"] {
  return {
    featuredWallpapers: wallpapers.filter((wallpaper) => wallpaper.featured).length,
    latestPublishedAt: wallpapers[0]?.createdAt ?? null,
    totalDownloads: wallpapers.reduce(
      (sum, wallpaper) => sum + wallpaper.downloadsCount,
      0,
    ),
    totalLikes: wallpapers.reduce((sum, wallpaper) => sum + wallpaper.likesCount, 0),
    totalWallpapers: wallpapers.length,
  };
}

function normalizeWallpaperTags(tags: string[]) {
  return tags.map((tag) => (tag === "手动导入" ? "像素" : tag));
}

export async function getCreatorPageSnapshot(
  username: string,
): Promise<CreatorPageSnapshot | null> {
  const creator = await getCreatorByUsername(username);

  if (!creator) {
    return null;
  }

  const wallpapers = (await listWallpapersByCreator(creator.username)).filter(
    (wallpaper) => !isInsPickWallpaper(wallpaper),
  );
  const displayWallpapers = wallpapers.map((wallpaper) => ({
    ...wallpaper,
    tags: normalizeWallpaperTags(wallpaper.tags),
    title: getWallpaperDisplayTitle({
      ...wallpaper,
      tags: normalizeWallpaperTags(wallpaper.tags),
    }),
  }));

  return {
    creator,
    stats: summarizeCreatorWallpapers(displayWallpapers),
    wallpapers: displayWallpapers,
  };
}
