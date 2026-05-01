import type { Metadata } from "next";
import { headers } from "next/headers";

import { InsPicksGallery } from "@/components/sections/ins-picks-gallery";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getInsPicksUiCopy } from "@/lib/i18n-ui";
import { getCachedInsPicksSnapshot } from "@/lib/ins-picks";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const copy = getInsPicksUiCopy(locale);

  return createPublicPageMetadata({
    path: "/ins",
    title: copy.metadata.title,
    description: copy.metadata.description,
  });
}

export default async function InsPicksPage() {
  const locale = getLocaleFromHeaders(headers());
  const snapshot = await getCachedInsPicksSnapshot({
    limit: 24,
  });

  return <InsPicksGallery locale={locale} mode="index" snapshot={snapshot} />;
}
