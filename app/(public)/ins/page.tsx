import type { Metadata } from "next";

import { InsPicksGallery } from "@/components/sections/ins-picks-gallery";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCachedInsPicksSnapshot } from "@/lib/ins-picks";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: "INS Picks",
  description:
    "Celebrity Instagram-style wallpaper collections for IU, Lim Yoona, Jang Wonyoung, Irene, Karina, Bae Suzy, Kim Jisoo, and future muse sets.",
};

export default async function InsPicksPage() {
  const snapshot = await getCachedInsPicksSnapshot({
    limit: 24,
  });

  return <InsPicksGallery mode="index" snapshot={snapshot} />;
}
