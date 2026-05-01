import { Suspense } from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_CATEGORIES,
  getExploreCategory,
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";
import { getExploreCategoryCopy, getLocaleFromHeaders } from "@/lib/i18n";
import { getExploreUiCopy } from "@/lib/i18n-ui";
import {
  EXPLORE_PAGE_SIZE,
  getCachedPublishedWallpapersPage,
} from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export const dynamicParams = false;

type ExploreCategoryPageProps = {
  params: {
    category: string;
  };
  searchParams?: {
    featured?: string;
    motion?: string;
    page?: string;
    q?: string;
    sort?: string;
    tag?: string;
  };
};

export function generateStaticParams() {
  return EXPLORE_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export function generateMetadata({
  params,
}: ExploreCategoryPageProps): Metadata {
  const category = getExploreCategory(params.category);
  const locale = getLocaleFromHeaders(headers());

  if (!category) {
    return {};
  }

  const categoryCopy = getExploreCategoryCopy(locale, category.slug);

  return createPublicPageMetadata({
    path: category.href,
    title: `${categoryCopy?.label ?? category.label} · ${
      getExploreUiCopy(locale).allDirectory
    }`,
    description:
      categoryCopy?.description ??
      `${category.description} 在 Lumen 中继续探索 ${category.label} 相关的高质感壁纸。`,
  });
}

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ExploreCategoryPage({
  params,
  searchParams,
}: ExploreCategoryPageProps) {
  const category = getExploreCategory(params.category);
  const locale = getLocaleFromHeaders(headers());

  if (!category) {
    notFound();
  }

  const copy = getExploreUiCopy(locale);
  const tagValue = searchParams?.tag?.trim() || "";
  const tag = tagValue && tagValue !== copy.allTag ? tagValue : undefined;
  const sort = getExploreSort(searchParams?.sort ?? DEFAULT_EXPLORE_SORT);
  const initialResult = await getCachedPublishedWallpapersPage(
    {
      category: category.slug,
      featured: isFeaturedFilterEnabled(searchParams?.featured),
      motion: isMotionFilterEnabled(searchParams?.motion),
      search: searchParams?.q?.trim() || undefined,
      sort,
      tag,
    },
    parsePage(searchParams?.page),
    EXPLORE_PAGE_SIZE,
  );

  return (
    <Suspense
      fallback={
        <ExploreCatalogLoading categorySlug={category.slug} locale={locale} />
      }
    >
      <ExploreCatalog
        categorySlug={category.slug}
        initialResult={initialResult}
        locale={locale}
      />
    </Suspense>
  );
}
