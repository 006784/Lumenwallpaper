import type { GradientKey } from "@/types/home";
import type { Wallpaper } from "@/types/wallpaper";

export type InsPickCollectionStatus = "active" | "planned";
export type InsPickCollectionSource = "static" | "custom";

export interface InsPickCollectionDefinition {
  aliases: string[];
  createdAt?: string | null;
  createdBy?: string | null;
  description: string;
  gradient: GradientKey;
  href: string;
  label: string;
  nativeName: string;
  requiredTags: string[];
  r2Prefix: string;
  slug: string;
  source: InsPickCollectionSource;
  status: InsPickCollectionStatus;
  subtitle: string;
  updatedAt?: string | null;
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
    archiveEndpoint: string;
    collectionsEndpoint: string;
    createEndpoint: string;
    href: string;
    note: string;
    presignEndpoint: string;
    requiredTags: string[];
  };
  wallpapers: Wallpaper[];
}

export interface InsPickUploadMetadata {
  collections: Array<{
    label: string;
    nativeName: string;
    requiredTags: string[];
    r2Prefix: string;
    slug: string;
    source: InsPickCollectionSource;
    status: InsPickCollectionStatus;
  }>;
  archiveEndpoint: string;
  collectionsEndpoint: string;
  createEndpoint: string;
  href: string;
  note: string;
  presignEndpoint: string;
  sourceTags: string[];
}

export interface InsPickUploadResult {
  collection: {
    label: string;
    nativeName: string;
    requiredTags: string[];
    r2Prefix: string;
    slug: string;
  };
  upload: InsPickUploadMetadata;
  wallpaper: Wallpaper;
}

export interface InsPickArchiveManifestItem {
  filename: string;
  size: number | null;
  storagePath: string;
  variant: string;
  wallpaperId: string;
  wallpaperSlug: string;
  wallpaperTitle: string;
}

export interface InsPickArchiveQuote {
  collection: {
    label: string;
    nativeName: string;
    r2Prefix: string;
    slug: string;
  };
  endpoint: string;
  estimatedPriceCny: number | null;
  files: InsPickArchiveManifestItem[];
  maxFiles: number;
  paymentMode: "free-preview" | "paid-ready";
  selectedCount: number;
  totalBytes: number;
}
