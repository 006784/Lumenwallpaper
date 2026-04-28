import type { Metadata } from "next";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCachedFeaturedWallpapers } from "@/lib/public-wallpaper-cache";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: "暗室精选",
  description:
    "Lumen 的编辑精选流，聚合更具情绪密度和下载热度的作品，用于暗室主题与专题推荐展示。",
};

export default async function DarkroomPage() {
  const wallpapers = await getCachedFeaturedWallpapers({
    limit: 12,
    sort: "popular",
  }).catch((error) => {
    console.warn("[darkroom] failed to load featured wallpapers", error);
    return [];
  });

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Darkroom
        </p>
        <div className="grid gap-8 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="font-body text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[1.02]">
              编辑挑出的暗室精选
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
              这里优先汇集更具情绪密度、视觉张力和下载热度的作品。当前精选会直接读取已标记
              `featured` 的壁纸，并按热度排序。
            </p>
          </div>
          <div className="glass-surface-soft grid gap-2 px-4 py-4 text-[10px] uppercase tracking-[0.22em] text-muted">
            <span>Curated by editor flag</span>
            <span>排序依据：下载热度</span>
            <span>当前精选 {wallpapers.length}</span>
          </div>
        </div>

        {wallpapers.length > 0 ? (
          <div className="wallpaper-card-grid mt-10">
            {wallpapers.map((wallpaper) => (
              <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
            ))}
          </div>
        ) : (
          <div className="glass-surface-soft mt-10 px-6 py-12 text-sm leading-7 text-muted">
            还没有任何精选作品。你可以先在管理台把一张作品标记为
            featured，这里就会自动出现。
          </div>
        )}
      </div>
    </section>
  );
}
