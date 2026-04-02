import type { CreatorProfile, Wallpaper } from "@/types/wallpaper";

export interface CreatorPageStats {
  featuredWallpapers: number;
  latestPublishedAt: string | null;
  totalDownloads: number;
  totalLikes: number;
  totalWallpapers: number;
}

export interface CreatorPageSnapshot {
  creator: CreatorProfile;
  stats: CreatorPageStats;
  wallpapers: Wallpaper[];
}
