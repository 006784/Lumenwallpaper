import { Suspense } from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  DEFAULT_EXPLORE_SORT,
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getExploreUiCopy } from "@/lib/i18n-ui";
import {
  EXPLORE_PAGE_SIZE,
  getCachedPublishedWallpapersPage,
} from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const copy = getExploreUiCopy(locale);

  return createPublicPageMetadata({
    path: "/explore",
    title:
      locale === "zh-CN"
        ? "探索高质感壁纸目录"
        : locale === "ja"
          ? "高品質な壁紙カタログを探索"
          : locale === "ko"
            ? "고품질 배경화면 카탈로그 탐색"
            : "Explore high-quality wallpaper catalog",
    description: copy.defaultDescription,
  });
}

type ExplorePageProps = {
  searchParams?: {
    featured?: string;
    motion?: string;
    page?: string;
    q?: string;
    sort?: string;
    tag?: string;
  };
};

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const locale = getLocaleFromHeaders(headers());
  const copy = getExploreUiCopy(locale);
  const tagValue = searchParams?.tag?.trim() || "";
  const tag = tagValue && tagValue !== copy.allTag ? tagValue : undefined;
  const sort = getExploreSort(searchParams?.sort ?? DEFAULT_EXPLORE_SORT);
  const initialResult = await getCachedPublishedWallpapersPage(
    {
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
    <Suspense fallback={<ExploreCatalogLoading locale={locale} />}>
      <ExploreCatalog initialResult={initialResult} locale={locale} />
    </Suspense>
  );
}
