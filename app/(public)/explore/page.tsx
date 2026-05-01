import { Suspense } from "react";

import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getExploreUiCopy } from "@/lib/i18n-ui";
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

export default function ExplorePage() {
  const locale = getLocaleFromHeaders(headers());

  return (
    <Suspense fallback={<ExploreCatalogLoading locale={locale} />}>
      <ExploreCatalog locale={locale} />
    </Suspense>
  );
}
