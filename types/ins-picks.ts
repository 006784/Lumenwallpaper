import type { GradientKey } from "@/types/home";
import type { Wallpaper } from "@/types/wallpaper";

export type InsPickCollectionStatus = "active" | "planned";

export interface InsPickCollectionDefinition {
  aliases: string[];
  description: string;
  gradient: GradientKey;
  href: string;
  label: string;
  nativeName: string;
  requiredTags: string[];
  slug: string;
  status: InsPickCollectionStatus;
  subtitle: string;
}

export interface InsPickCollectionSummary extends InsPickCollectionDefinition {
  count: number;
  latestWallpaper: Wallpaper | null;
  previewWallpapers: Wallpaper[];
}

export interface InsPicksSnapshot {
  collections: InsPickCollectionSummary[];
  latestWallpapers: Wallpaper[];
  selectedCollection: InsPickCollectionSummary | null;
  sourceTags: string[];
  upload: {
    href: string;
    note: string;
    requiredTags: string[];
  };
  wallpapers: Wallpaper[];
}
