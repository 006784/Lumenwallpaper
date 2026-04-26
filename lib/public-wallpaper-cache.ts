import { unstable_cache } from "next/cache";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCreatorPageSnapshot } from "@/lib/creators";
import { getWallpaperDisplayTitle } from "@/lib/wallpaper-presenters";
import type {
  WallpaperAspectFilter,
  WallpaperListFiltersSnapshot,
  WallpaperListOptions,
  WallpaperMediaFilter,
  WallpaperOrientationFilter,
  WallpaperResolutionFilter,
  WallpaperSort,
} from "@/types/wallpaper";
import {
  getCreatorByUsername,
  getWallpaperByIdOrSlug,
  listFeaturedWallpapers,
  listPublishedWallpapers,
  listWallpapersByCreator,
} from "@/lib/wallpapers";

const PUBLIC_WALLPAPER_CACHE_VERSION = "v4";

function normalizeWallpaperTags(tags: string[]) {
  return tags.map((tag) => (tag === "手动导入" ? "像素" : tag));
}

function withDisplayTitle<
  T extends { title: string; aiTags: string[]; tags: string[] },
>(wallpaper: T) {
  const normalizedTags = normalizeWallpaperTags(wallpaper.tags);

  return {
    ...wallpaper,
    tags: normalizedTags,
    title: getWallpaperDisplayTitle({
      ...wallpaper,
      tags: normalizedTags,
    }),
  };
}

function serializeWallpaperListOptions(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return JSON.stringify({
    aspect: options.aspect ?? null,
    category: options.category ?? null,
    color: options.color ?? null,
    featured: options.featured ?? null,
    limit: options.limit ?? null,
    media: options.media ?? null,
    minHeight: options.minHeight ?? null,
    minWidth: options.minWidth ?? null,
    motion: options.motion ?? null,
    offset: options.offset ?? null,
    orientation: options.orientation ?? null,
    resolution: options.resolution ?? null,
    search: options.search ?? null,
    sort: options.sort ?? null,
    style: options.style ?? null,
    tag: options.tag ?? null,
  });
}

export async function getCachedPublishedWallpapers(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return unstable_cache(
    async () => (await listPublishedWallpapers(options)).map(withDisplayTitle),
    [
      "wallpapers:published",
      PUBLIC_WALLPAPER_CACHE_VERSION,
      serializeWallpaperListOptions(options),
    ],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "wallpapers:explore"],
    },
  )();
}

export async function getCachedFeaturedWallpapers(
  options: Omit<WallpaperListOptions, "featured" | "status"> = {},
) {
  return unstable_cache(
    async () => (await listFeaturedWallpapers(options)).map(withDisplayTitle),
    [
      "wallpapers:featured",
      PUBLIC_WALLPAPER_CACHE_VERSION,
      serializeWallpaperListOptions(options),
    ],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "wallpapers:featured"],
    },
  )();
}

export async function getCachedWallpaperByIdentifier(identifier: string) {
  const wallpaper = await unstable_cache(
    async () => getWallpaperByIdOrSlug(identifier),
    ["wallpaper", PUBLIC_WALLPAPER_CACHE_VERSION, identifier],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", `wallpaper:${identifier}`],
    },
  )();

  return wallpaper ? withDisplayTitle(wallpaper) : null;
}

export async function getCachedCreatorByUsername(username: string) {
  return unstable_cache(
    async () => getCreatorByUsername(username),
    ["creator", username],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["creators", `creator:${username}`],
    },
  )();
}

export async function getCachedCreatorPageSnapshot(username: string) {
  const snapshot = await unstable_cache(
    async () => getCreatorPageSnapshot(username),
    ["creator-page", PUBLIC_WALLPAPER_CACHE_VERSION, username],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["creators", "wallpapers", `creator:${username}`],
    },
  )();

  if (!snapshot) {
    return null;
  }

  const wallpapers = snapshot.wallpapers.map(withDisplayTitle);

  return {
    ...snapshot,
    wallpapers,
  };
}

export async function getCachedWallpapersByCreator(username: string) {
  return unstable_cache(
    async () => (await listWallpapersByCreator(username)).map(withDisplayTitle),
    ["creator-wallpapers", PUBLIC_WALLPAPER_CACHE_VERSION, username],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "creators", `creator:${username}`],
    },
  )();
}

export const EXPLORE_PAGE_SIZE = 24;

function normalizeWallpaperListFilters(
  options: Omit<WallpaperListOptions, "limit" | "offset" | "status"> = {},
): WallpaperListFiltersSnapshot {
  const media =
    options.media ??
    (options.motion === undefined
      ? "all"
      : options.motion
        ? "motion"
        : "static");

  return {
    aspect: (options.aspect ?? null) as WallpaperAspectFilter | null,
    category: options.category?.trim() || null,
    color: options.color?.trim() || null,
    featured: options.featured ?? false,
    media: media as WallpaperMediaFilter,
    minHeight: options.minHeight ?? null,
    minWidth: options.minWidth ?? null,
    motion: media === "motion",
    orientation: (options.orientation ??
      null) as WallpaperOrientationFilter | null,
    query: options.search?.trim() || null,
    resolution: (options.resolution ??
      null) as WallpaperResolutionFilter | null,
    sort: (options.sort ?? "latest") as WallpaperSort,
    style: options.style?.trim() || null,
    tag: options.tag?.trim() || null,
  };
}

export async function getCachedPublishedWallpapersPage(
  options: Omit<WallpaperListOptions, "status" | "limit" | "offset"> = {},
  page: number,
  pageSize = EXPLORE_PAGE_SIZE,
) {
  const all = await getCachedPublishedWallpapers({ ...options, limit: 1000 });
  const total = all.length;
  const safePageSize = Math.max(1, pageSize);
  const offset = Math.max(0, page - 1) * safePageSize;
  const wallpapers = all.slice(offset, offset + safePageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const filters = normalizeWallpaperListFilters(options);

  return {
    wallpapers,
    count: wallpapers.length,
    filters,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    page,
    pageSize: safePageSize,
    total,
    totalPages,
  };
}
