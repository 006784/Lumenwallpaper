import type { Metadata } from "next";

import { ExploreCatalog } from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type ExplorePageProps = {
  searchParams?: {
    featured?: string;
    motion?: string;
    q?: string;
    sort?: string;
    tag?: string;
  };
};

export function generateMetadata({ searchParams }: ExplorePageProps): Metadata {
  const query = searchParams?.q?.trim();
  const tag = searchParams?.tag?.trim();
  const featuredOnly = isFeaturedFilterEnabled(searchParams?.featured);
  const motionOnly = isMotionFilterEnabled(searchParams?.motion);
  const sort = getExploreSort(searchParams?.sort);
  const descriptors = [
    query ? `搜索 ${query}` : null,
    tag ? `标签 ${tag}` : null,
    featuredOnly ? "精选目录" : null,
    motionOnly ? "动态壁纸" : null,
    sort === "popular" ? "下载热度" : null,
    sort === "likes" ? "收藏热度" : null,
  ].filter(Boolean);
  const title =
    descriptors.length > 0
      ? `${descriptors.join(" · ")}`
      : "探索高质感壁纸目录";

  return {
    title,
    description:
      "按关键词、标签、分类和热度探索 Lumen 的壁纸目录，发现适合桌面与移动端的精选画面。",
  };
}

export default function ExplorePage({ searchParams }: ExplorePageProps) {
  return <ExploreCatalog searchParams={searchParams} />;
}
