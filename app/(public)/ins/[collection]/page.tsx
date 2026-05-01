import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { InsPicksGallery } from "@/components/sections/ins-picks-gallery";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getInsPicksUiCopy } from "@/lib/i18n-ui";
import {
  getCachedInsPicksSnapshot,
  getInsPickCollection,
} from "@/lib/ins-picks";
import { createPublicPageMetadata } from "@/lib/site-url";

type InsPickCollectionPageProps = {
  params: {
    collection: string;
  };
};

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: InsPickCollectionPageProps): Promise<Metadata> {
  const locale = getLocaleFromHeaders(headers());
  const copy = getInsPicksUiCopy(locale);
  const collection = await getInsPickCollection(params.collection);

  if (!collection) {
    return {
      title: copy.metadata.title,
    };
  }

  const localized = copy.collections.details[collection.slug];

  return createPublicPageMetadata({
    path: collection.href,
    title: `${collection.label} · ${copy.metadata.title}`,
    description: localized?.description ?? collection.description,
  });
}

export default async function InsPickCollectionPage({
  params,
}: InsPickCollectionPageProps) {
  const locale = getLocaleFromHeaders(headers());
  const collection = await getInsPickCollection(params.collection);

  if (!collection) {
    notFound();
  }

  const snapshot = await getCachedInsPicksSnapshot({
    collectionSlug: collection.slug,
    limit: 48,
  });

  if (!snapshot.selectedCollection) {
    notFound();
  }

  return (
    <InsPicksGallery locale={locale} mode="collection" snapshot={snapshot} />
  );
}
