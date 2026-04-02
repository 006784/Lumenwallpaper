import type { CreatorPageSnapshot } from "@/types/creator-api";
import { getCreatorByUsername, listWallpapersByCreator } from "@/lib/wallpapers";

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

export async function getCreatorPageSnapshot(
  username: string,
): Promise<CreatorPageSnapshot | null> {
  const creator = await getCreatorByUsername(username);

  if (!creator) {
    return null;
  }

  const wallpapers = await listWallpapersByCreator(creator.username);

  return {
    creator,
    stats: summarizeCreatorWallpapers(wallpapers),
    wallpapers,
  };
}
