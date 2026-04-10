import { Suspense } from "react";

import type { Metadata } from "next";

import {
  ExploreCatalog,
  ExploreCatalogLoading,
} from "@/components/wallpaper/explore-catalog";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "探索高质感壁纸目录",
  description:
    "按关键词、标签、分类和热度探索 Lumen 的壁纸目录，发现适合桌面与移动端的精选画面。",
};

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreCatalogLoading />}>
      <ExploreCatalog />
    </Suspense>
  );
}
