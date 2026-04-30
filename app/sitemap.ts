import type { MetadataRoute } from "next";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { EXPLORE_CATEGORIES } from "@/lib/explore";
import { listInsPickCollections } from "@/lib/ins-picks";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const wallpapers = await getCachedPublishedWallpapers({
    limit: 500,
    sort: "latest",
  });
  const insPickCollections = await listInsPickCollections();
  const creatorUsernames = [
    ...new Set(
      wallpapers.map((item) => item.creator?.username).filter(Boolean),
    ),
  ];

  return [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/darkroom`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ins`,
      changeFrequency: "weekly",
      priority: 0.78,
    },
    ...EXPLORE_CATEGORIES.map((category) => ({
      url: `${baseUrl}${category.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...insPickCollections.map((collection) => ({
      url: `${baseUrl}${collection.href}`,
      changeFrequency: "weekly" as const,
      priority: 0.72,
    })),
    ...wallpapers.map((wallpaper) => ({
      url: `${baseUrl}/wallpaper/${wallpaper.slug}`,
      lastModified: wallpaper.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...creatorUsernames.map((username) => ({
      url: `${baseUrl}/creator/${username}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
