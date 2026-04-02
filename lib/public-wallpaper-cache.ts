import { unstable_cache } from "next/cache";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import type { WallpaperListOptions } from "@/types/wallpaper";
import {
  getCreatorByUsername,
  getWallpaperByIdOrSlug,
  listFeaturedWallpapers,
  listPublishedWallpapers,
  listWallpapersByCreator,
} from "@/lib/wallpapers";

function serializeWallpaperListOptions(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return JSON.stringify({
    category: options.category ?? null,
    featured: options.featured ?? null,
    limit: options.limit ?? null,
    search: options.search ?? null,
    sort: options.sort ?? null,
    tag: options.tag ?? null,
  });
}

export async function getCachedPublishedWallpapers(
  options: Omit<WallpaperListOptions, "status"> = {},
) {
  return unstable_cache(
    async () => listPublishedWallpapers(options),
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
    async () => listFeaturedWallpapers(options),
    ["wallpapers:featured", serializeWallpaperListOptions(options)],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "wallpapers:featured"],
    },
  )();
}

export async function getCachedWallpaperByIdentifier(identifier: string) {
  return unstable_cache(
    async () => getWallpaperByIdOrSlug(identifier),
    ["wallpaper", identifier],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", `wallpaper:${identifier}`],
    },
  )();
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

export async function getCachedWallpapersByCreator(username: string) {
  return unstable_cache(
    async () => listWallpapersByCreator(username),
    ["creator-wallpapers", username],
    {
      revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS,
      tags: ["wallpapers", "creators", `creator:${username}`],
    },
  )();
}
