import { Suspense } from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { EXPLORE_CATEGORIES, getExploreCategory } from "@/lib/explore";
import { getExploreCategoryCopy, getLocaleFromHeaders } from "@/lib/i18n";
import { getExploreUiCopy } from "@/lib/i18n-ui";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
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

export default function ExploreCategoryPage({
  params,
}: ExploreCategoryPageProps) {
  const category = getExploreCategory(params.category);
  const locale = getLocaleFromHeaders(headers());

  if (!category) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <ExploreCatalogLoading categorySlug={category.slug} locale={locale} />
      }
    >
      <ExploreCatalog categorySlug={category.slug} locale={locale} />
    </Suspense>
  );
}
