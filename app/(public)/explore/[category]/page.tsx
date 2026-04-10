import { Suspense } from "react";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  EXPLORE_CATEGORIES,
  getExploreCategory,
} from "@/lib/explore";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export const dynamic = "force-static";
export const dynamicParams = false;

type ExploreCategoryPageProps = {
  params: {
    category: string;
  };
};

export function generateStaticParams() {
  return EXPLORE_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export function generateMetadata({ params }: ExploreCategoryPageProps): Metadata {
  const category = getExploreCategory(params.category);

  if (!category) {
    return {};
  }

  return {
    title: `${category.label} · 探索目录`,
    description: `${category.description} 在 Lumen 中继续探索 ${category.label} 相关的高质感壁纸。`,
  };
}

export default function ExploreCategoryPage({ params }: ExploreCategoryPageProps) {
  const category = getExploreCategory(params.category);

  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={<ExploreCatalogLoading categorySlug={category.slug} />}>
      <ExploreCatalog categorySlug={category.slug} />
    </Suspense>
  );
}
