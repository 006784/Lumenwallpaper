import type { Wallpaper, WallpaperVariant } from "@/types/wallpaper";

export interface LibraryCollection {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  itemCount?: number;
}

export interface LibraryCollectionDetail extends LibraryCollection {
  wallpapers: Wallpaper[];
}

export interface LibraryCollectionMutationResult {
  collection: LibraryCollection;
}

export interface LibraryCollectionItemMutationResult {
  collection: LibraryCollectionDetail;
  wallpaper: Wallpaper;
}

export interface DownloadHistoryItem {
  id: string;
  downloadedAt: string;
  variant: WallpaperVariant | null;
  wallpaper: Wallpaper;
}

export interface LibraryNotificationItem {
  id: string;
  kind: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  wallpaper: Wallpaper | null;
}

export interface LibrarySnapshot {
  collection: LibraryCollection | null;
  favorites: Wallpaper[];
  downloadHistory: DownloadHistoryItem[];
  notifications: LibraryNotificationItem[];
  unreadNotificationsCount: number;
}
