import type { Metadata } from "next";
import { headers } from "next/headers";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getDarkroomPageCopy } from "@/lib/i18n-ui";
import { getCachedFeaturedWallpapers } from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDarkroomPageCopy(locale);

  return createPublicPageMetadata({
    path: "/darkroom",
    title:
      locale === "zh-CN"
        ? "暗室精选"
        : locale === "ja"
          ? "暗室セレクト"
          : locale === "ko"
            ? "다크룸 픽"
            : "Darkroom Picks",
    description: copy.description,
  });
}

export default async function DarkroomPage() {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDarkroomPageCopy(locale);
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
              {copy.title}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
              {copy.description}
            </p>
          </div>
          <div className="glass-surface-soft grid gap-2 px-4 py-4 text-[10px] uppercase tracking-[0.22em] text-muted">
            <span>{copy.metricCurated}</span>
            <span>{copy.sort}</span>
            <span>{copy.count(wallpapers.length)}</span>
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
            {copy.empty}
          </div>
        )}
      </div>
    </section>
  );
}
