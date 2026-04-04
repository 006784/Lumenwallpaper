import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExploreCatalog } from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getExploreCategory,
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type ExploreCategoryPageProps = {
  params: {
    category: string;
  };
  searchParams?: {
    featured?: string;
    motion?: string;
    q?: string;
    sort?: string;
    tag?: string;
  };
};

export function generateMetadata({
  params,
  searchParams,
}: ExploreCategoryPageProps): Metadata {
  const category = getExploreCategory(params.category);

  if (!category) {
    return {};
  }

  const featuredOnly = isFeaturedFilterEnabled(searchParams?.featured);
  const motionOnly = isMotionFilterEnabled(searchParams?.motion);
  const sort = getExploreSort(searchParams?.sort);
  const titleParts = [
    category.label,
    featuredOnly ? "精选" : null,
    motionOnly ? "动态壁纸" : null,
    sort === "popular" ? "下载热度" : null,
    sort === "likes" ? "收藏热度" : null,
  ].filter(Boolean);

  return {
    title: titleParts.join(" · "),
    description: `${category.description} 在 Lumen 中继续探索 ${category.label} 相关的高质感壁纸。`,
  };
}

export default function ExploreCategoryPage({
  params,
  searchParams,
}: ExploreCategoryPageProps) {
  const category = getExploreCategory(params.category);

  if (!category) {
    notFound();
  }

  return (
    <ExploreCatalog categorySlug={category.slug} searchParams={searchParams} />
  );
}
