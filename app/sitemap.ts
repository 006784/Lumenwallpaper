import type { MetadataRoute } from "next";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { EXPLORE_CATEGORIES } from "@/lib/explore";
import { listInsPickCollections } from "@/lib/ins-picks";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const wallpapers = await getCachedPublishedWallpapers({
    limit: 500,
    sort: "latest",
  }).catch((error) => {
    console.warn("[sitemap] failed to load wallpapers", error);
    return [];
  });
  const insPickCollections = await listInsPickCollections().catch((error) => {
    console.warn("[sitemap] failed to load INS collections", error);
    return [];
  });
  const creatorUsernames = [
    ...new Set(
      wallpapers.map((item) => item.creator?.username).filter(Boolean),
    ),
  ];

  return [
    {
      url: getSiteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: getSiteUrl("/explore"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: getSiteUrl("/darkroom"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getSiteUrl("/ins"),
      changeFrequency: "weekly",
      priority: 0.78,
    },
    ...EXPLORE_CATEGORIES.map((category) => ({
      url: getSiteUrl(category.href),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...insPickCollections.map((collection) => ({
      url: getSiteUrl(collection.href),
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...wallpapers.map((wallpaper) => ({
      url: getSiteUrl(`/wallpaper/${wallpaper.slug}`),
      lastModified: wallpaper.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...creatorUsernames.map((username) => ({
      url: getSiteUrl(`/creator/${username}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
