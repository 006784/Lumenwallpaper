import type { Database } from "@/types/database";

export type WallpaperStatus = Database["public"]["Enums"]["wallpaper_status"];
export type WallpaperVariant = Database["public"]["Enums"]["wallpaper_variant"];
export type WallpaperReportStatus =
  Database["public"]["Enums"]["wallpaper_report_status"];
export type WallpaperSort = "latest" | "popular" | "likes";
export type WallpaperAiAnalysisStatus =
  | "pending"
  | "completed"
  | "failed"
  | "skipped";
export type WallpaperReportReason =
  | "copyright"
  | "sensitive"
  | "spam"
  | "misleading"
  | "other";

export interface CreatorProfile {
  id: string;
  email: string | null;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface WallpaperFile {
  id: string;
  wallpaperId: string;
  variant: WallpaperVariant;
  storagePath: string;
  url: string;
  size: number | null;
  format: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface Wallpaper {
  id: string;
  userId: string | null;
  title: string;
  slug: string;
  description: string | null;
  videoUrl: string | null;
  status: WallpaperStatus;
  tags: string[];
  aiTags: string[];
  aiCategory: string | null;
  aiCaption: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  aiAnalysisStatus: WallpaperAiAnalysisStatus;
  aiAnalysisError: string | null;
  aiAnalyzedAt: string | null;
  colors: string[];
  width: number | null;
  height: number | null;
  downloadsCount: number;
  likesCount: number;
  reportsCount: number;
  featured: boolean;
  licenseConfirmedAt: string | null;
  licenseVersion: string | null;
  lastReportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  files: WallpaperFile[];
  creator: CreatorProfile | null;
}

export interface WallpaperFavoriteSnapshot {
  likesCount: number;
  isFavorited: boolean;
}

export interface WallpaperReportReceipt {
  id: string;
  wallpaperId: string;
  reason: WallpaperReportReason;
  status: WallpaperReportStatus;
  reporterEmail: string | null;
  createdAt: string;
}

export interface WallpaperReport {
  id: string;
  wallpaperId: string;
  reporterUserId: string | null;
  reporterEmail: string | null;
  reporterIp: string | null;
  reason: WallpaperReportReason;
  details: string | null;
  status: WallpaperReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
  wallpaper: Wallpaper | null;
  reporter: CreatorProfile | null;
}

export interface WallpaperListOptions {
  limit?: number;
  search?: string;
  tag?: string;
  category?: string;
  featured?: boolean;
  sort?: WallpaperSort;
  status?: WallpaperStatus;
}

export interface PresignedUploadPayload {
  key: string;
  presignedUrl: string;
  publicUrl: string;
  headers: Record<string, string>;
  method: "PUT";
  expiresIn: number;
}
