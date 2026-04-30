import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { InsPicksGallery } from "@/components/sections/ins-picks-gallery";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getCachedInsPicksSnapshot,
  getInsPickCollection,
} from "@/lib/ins-picks";

type InsPickCollectionPageProps = {
  params: {
    collection: string;
  };
};

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateMetadata({
  params,
}: InsPickCollectionPageProps): Promise<Metadata> {
  const collection = await getInsPickCollection(params.collection);

  if (!collection) {
    return {
      title: "INS Picks",
    };
  }

  return {
    title: `${collection.label} · INS Picks`,
    description: collection.description,
  };
}

export default async function InsPickCollectionPage({
  params,
}: InsPickCollectionPageProps) {
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

  return <InsPicksGallery mode="collection" snapshot={snapshot} />;
}
