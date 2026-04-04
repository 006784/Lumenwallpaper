import { unstable_cache } from "next/cache";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCreatorPageSnapshot } from "@/lib/creators";
import { getWallpaperDisplayTitle } from "@/lib/wallpaper-presenters";
import type { WallpaperListOptions } from "@/types/wallpaper";
import {
  getCreatorByUsername,
  getWallpaperByIdOrSlug,
  listFeaturedWallpapers,
  listPublishedWallpapers,
  listWallpapersByCreator,
} from "@/lib/wallpapers";

function normalizeWallpaperTags(tags: string[]) {
  return tags.map((tag) => (tag === "手动导入" ? "像素" : tag));
}

function withDisplayTitle<T extends { title: string; aiTags: string[]; tags: string[] }>(
  wallpaper: T,
) {
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
    category: options.category ?? null,
    featured: options.featured ?? null,
    limit: options.limit ?? null,
    motion: options.motion ?? null,
    offset: options.offset ?? null,
    search: options.search ?? null,
    sort: options.sort ?? null,
    tag: options.tag ?? null,
  });
}

export async function getCachedPublishedWallpapers(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return unstable_cache(
    async () => (await listPublishedWallpapers(options)).map(withDisplayTitle),
    ["wallpapers:published", serializeWallpaperListOptions(options)],
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
    ["wallpapers:featured", serializeWallpaperListOptions(options)],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "wallpapers:featured"],
    },
  )();
}

export async function getCachedWallpaperByIdentifier(identifier: string) {
  const wallpaper = await unstable_cache(
    async () => getWallpaperByIdOrSlug(identifier),
    ["wallpaper", identifier],
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
    ["creator-page", username],
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
    ["creator-wallpapers", username],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "creators", `creator:${username}`],
    },
  )();
}

export const EXPLORE_PAGE_SIZE = 24;

export async function getCachedPublishedWallpapersPage(
  options: Omit<WallpaperListOptions, "status" | "limit" | "offset"> = {},
  page: number,
) {
  const all = await getCachedPublishedWallpapers({ ...options, limit: 1000 });
  const total = all.length;
  const offset = Math.max(0, page - 1) * EXPLORE_PAGE_SIZE;
  const wallpapers = all.slice(offset, offset + EXPLORE_PAGE_SIZE);
  const totalPages = Math.ceil(total / EXPLORE_PAGE_SIZE);
  return { wallpapers, total, page, totalPages };
}
