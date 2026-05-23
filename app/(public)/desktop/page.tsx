import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";
import {
  getWallpaperCoverSources,
  getWallpaperDisplayTitle,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { SupportedLocale } from "@/types/i18n";
import type { Wallpaper } from "@/types/wallpaper";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

function getDesktopPageCopy(locale: SupportedLocale) {
  if (locale === "zh-CN") {
    return {
      title: "电脑壁纸",
      eyebrow: "Desktop Wallpapers",
      description:
        "为桌面、笔记本、外接显示器和带鱼屏筛选的横向高分辨率壁纸。画面留白更稳，图标区更干净，适合长时间工作与沉浸式浏览。",
      metaTitle: "电脑壁纸 · 高清桌面壁纸精选",
      metaDescription:
        "发现适合电脑、Mac、Windows、4K 显示器和带鱼屏的高清桌面壁纸。",
      primaryAction: "浏览全部桌面比例",
      secondaryAction: "查看动态壁纸",
      spotlightLabel: "桌面首选",
      resolutionLabel: "优先 4K+",
      ratioLabel: "横向比例",
      gridTitle: "适合电脑屏幕的作品",
      gridDescription:
        "优先展示 16:9、16:10、21:9 等横向构图，适合直接设为桌面背景。",
      ultrawideTitle: "带鱼屏灵感",
      empty: "暂时没有匹配的电脑壁纸，先去探索页看看全部作品。",
    };
  }

  if (locale === "ja") {
    return {
      title: "デスクトップ壁紙",
      eyebrow: "Desktop Wallpapers",
      description:
        "Desktop, laptop, external display, and ultrawide-friendly wallpapers with clean landscape framing.",
      metaTitle: "Desktop Wallpapers",
      metaDescription:
        "Browse high-resolution landscape wallpapers for desktop, Mac, Windows, 4K displays, and ultrawide monitors.",
      primaryAction: "Browse desktop ratio",
      secondaryAction: "View motion wallpapers",
      spotlightLabel: "Desktop pick",
      resolutionLabel: "4K+ first",
      ratioLabel: "Landscape",
      gridTitle: "Made for computer screens",
      gridDescription:
        "Landscape compositions selected for desktops, laptops, and larger displays.",
      ultrawideTitle: "Ultrawide inspiration",
      empty: "No desktop wallpapers matched yet. Browse the full catalog.",
    };
  }

  if (locale === "ko") {
    return {
      title: "데스크톱 배경화면",
      eyebrow: "Desktop Wallpapers",
      description:
        "Desktop, laptop, external display, and ultrawide-friendly wallpapers with clean landscape framing.",
      metaTitle: "Desktop Wallpapers",
      metaDescription:
        "Browse high-resolution landscape wallpapers for desktop, Mac, Windows, 4K displays, and ultrawide monitors.",
      primaryAction: "Browse desktop ratio",
      secondaryAction: "View motion wallpapers",
      spotlightLabel: "Desktop pick",
      resolutionLabel: "4K+ first",
      ratioLabel: "Landscape",
      gridTitle: "Made for computer screens",
      gridDescription:
        "Landscape compositions selected for desktops, laptops, and larger displays.",
      ultrawideTitle: "Ultrawide inspiration",
      empty: "No desktop wallpapers matched yet. Browse the full catalog.",
    };
  }

  return {
    title: "Desktop Wallpapers",
    eyebrow: "Desktop Wallpapers",
    description:
      "Landscape, high-resolution wallpapers selected for desktops, laptops, external displays, and ultrawide monitors.",
    metaTitle: "Desktop Wallpapers",
    metaDescription:
      "Browse high-resolution landscape wallpapers for desktop, Mac, Windows, 4K displays, and ultrawide monitors.",
    primaryAction: "Browse desktop ratio",
    secondaryAction: "View motion wallpapers",
    spotlightLabel: "Desktop pick",
    resolutionLabel: "4K+ first",
    ratioLabel: "Landscape",
    gridTitle: "Made for computer screens",
    gridDescription:
      "Landscape compositions selected for desktops, laptops, and larger displays.",
    ultrawideTitle: "Ultrawide inspiration",
    empty: "No desktop wallpapers matched yet. Browse the full catalog.",
  };
}

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDesktopPageCopy(locale);

  return createPublicPageMetadata({
    path: "/desktop",
    title: copy.metaTitle,
    description: copy.metaDescription,
  });
}

async function getDesktopWallpapers() {
  const primary = await getCachedPublishedWallpapers({
    aspect: "desktop",
    orientation: "landscape",
    resolution: "4k",
    limit: 36,
    sort: "popular",
  });

  if (primary.length > 0) {
    return primary;
  }

  return getCachedPublishedWallpapers({
    aspect: "desktop",
    orientation: "landscape",
    limit: 36,
    sort: "popular",
  });
}

function DesktopSpotlight({
  copy,
  wallpapers,
}: {
  copy: ReturnType<typeof getDesktopPageCopy>;
  wallpapers: Wallpaper[];
}) {
  const featured = wallpapers[0];

  if (!featured) {
    return (
      <div className="glass-surface-soft mt-8 flex min-h-[360px] items-center justify-center overflow-hidden p-8 text-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
            {copy.spotlightLabel}
          </p>
          <p className="mt-4 max-w-md text-[14px] leading-7 text-muted">
            {copy.empty}
          </p>
          <Link
            className="mt-7 inline-flex rounded-full border border-ink/10 px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-ink transition hover:border-red/40 hover:text-red dark:border-paper/10 dark:text-paper"
            href="/explore"
          >
            {copy.primaryAction}
          </Link>
        </div>
      </div>
    );
  }

  const previewUrl = getWallpaperPreviewUrl(featured, "large");
  const displayTitle = getWallpaperDisplayTitle(featured);

  return (
    <Link
      className="glass-surface-soft group mt-8 block overflow-hidden p-2.5 transition duration-card hover:-translate-y-1 hover:border-red/20 dark:hover:border-red/30 md:p-3"
      href={`/wallpaper/${featured.slug}`}
    >
      <div className="relative min-h-[360px] overflow-hidden rounded-[24px] bg-ink text-paper md:min-h-[540px]">
        <WallpaperCoverImage
          alt={displayTitle}
          gradient="night"
          imageClassName="brightness-[.9] contrast-[1.04] saturate-[1.08] transition duration-700 group-hover:scale-[1.035]"
          sizes="100vw"
          sources={getWallpaperCoverSources(featured)}
          src={previewUrl}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,111,77,0.24),transparent_30%),linear-gradient(90deg,rgba(5,7,8,0.78),rgba(5,7,8,0.18)_54%,rgba(5,7,8,0.48))]" />
        <div className="absolute inset-x-0 top-0 h-px bg-paper/20" />
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-red/80">
              {copy.spotlightLabel}
            </p>
            <h2 className="mt-4 max-w-xl font-display text-[clamp(2rem,5vw,4.6rem)] leading-[0.98] tracking-tight">
              {displayTitle}
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {[getWallpaperMeta(featured), copy.resolutionLabel, copy.ratioLabel]
                .filter(Boolean)
                .map((item) => (
                  <span
                    className="rounded-full border border-paper/18 bg-paper/8 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-paper/74 backdrop-blur-md"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-4 top-4 hidden rounded-full border border-paper/15 bg-paper/8 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/64 backdrop-blur-md sm:block">
          16:9 · 16:10 · 21:9
        </div>
      </div>
    </Link>
  );
}

export default async function DesktopWallpapersPage() {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDesktopPageCopy(locale);
  const [wallpapers, ultrawideWallpapers] = await Promise.all([
    getDesktopWallpapers().catch((error) => {
      console.warn("[desktop] failed to load desktop wallpapers", error);
      return [];
    }),
    getCachedPublishedWallpapers({
      aspect: "ultrawide",
      limit: 6,
      sort: "popular",
    }).catch((error) => {
      console.warn("[desktop] failed to load ultrawide wallpapers", error);
      return [];
    }),
  ]);

  const gridWallpapers = wallpapers.slice(1);

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-24 md:px-10 md:pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_64%_at_58%_0%,rgba(212,43,43,0.08),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.32),transparent_42%)] dark:bg-[radial-gradient(ellipse_86%_60%_at_58%_0%,rgba(255,111,77,0.12),transparent_58%),linear-gradient(180deg,rgba(242,237,228,0.04),transparent_44%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-red/70" />
                <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-red/70">
                  {copy.eyebrow}
                </p>
              </div>
              <h1 className="mt-5 max-w-4xl font-display text-[clamp(3rem,8vw,7rem)] font-medium leading-[0.95] tracking-tight text-ink">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-2xl text-[14px] leading-7 text-muted md:text-[15px]">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  className="rounded-full bg-ink px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-paper transition hover:bg-red dark:bg-paper dark:text-ink dark:hover:bg-red dark:hover:text-paper"
                  href="/explore?aspect=desktop&orientation=landscape&resolution=4k"
                >
                  {copy.primaryAction}
                </Link>
                <Link
                  className="rounded-full border border-ink/10 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-ink transition hover:border-red/40 hover:text-red dark:border-paper/12 dark:text-paper"
                  href="/explore?motion=true"
                >
                  {copy.secondaryAction}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 overflow-hidden rounded-[18px] border border-ink/8 bg-white/42 dark:border-paper/10 dark:bg-paper/5 lg:grid-cols-1">
              {[
                { label: copy.resolutionLabel, value: "4K+" },
                { label: copy.ratioLabel, value: "16:9" },
                { label: copy.ultrawideTitle, value: "21:9" },
              ].map((item) => (
                <div
                  className="border-r border-ink/6 px-4 py-4 last:border-r-0 dark:border-paper/8 lg:border-b lg:border-r-0 lg:last:border-b-0"
                  key={item.label}
                >
                  <p className="font-mono text-[24px] leading-none text-ink">
                    {item.value}
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-muted/70">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <DesktopSpotlight copy={copy} wallpapers={wallpapers} />
        </div>
      </section>

      <section className="px-4 pb-16 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 border-t border-ink/10 pt-8 dark:border-paper/10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-red/70">
                Gallery
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3.8rem)] leading-none text-ink">
                {copy.gridTitle}
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-6 text-muted">
              {copy.gridDescription}
            </p>
          </div>

          {wallpapers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(gridWallpapers.length > 0 ? gridWallpapers : wallpapers).map(
                (wallpaper, index) => (
                  <WallpaperGridCard
                    aspectRatio="aspect-[16/10]"
                    imageQuality="medium"
                    key={wallpaper.id}
                    loading={index < 6 ? "eager" : "lazy"}
                    wallpaper={wallpaper}
                  />
                ),
              )}
            </div>
          ) : (
            <div className="glass-surface-soft flex flex-col items-center gap-5 py-20 text-center">
              <p className="max-w-md text-[14px] leading-7 text-muted">
                {copy.empty}
              </p>
              <Link
                className="rounded-full border border-ink/10 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-ink transition hover:border-red/40 hover:text-red dark:border-paper/10 dark:text-paper"
                href="/explore"
              >
                Explore
              </Link>
            </div>
          )}
        </div>
      </section>

      {ultrawideWallpapers.length > 0 ? (
        <section className="px-4 pb-24 md:px-10 md:pb-section">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-display text-[clamp(1.8rem,3vw,3rem)] leading-none text-ink">
                {copy.ultrawideTitle}
              </h2>
              <Link
                className="text-[10px] uppercase tracking-[0.22em] text-muted transition hover:text-red"
                href="/explore?aspect=ultrawide"
              >
                21:9
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {ultrawideWallpapers.slice(0, 4).map((wallpaper, index) => (
                <WallpaperGridCard
                  aspectRatio="aspect-[21/9]"
                  imageQuality="medium"
                  key={wallpaper.id}
                  loading={index < 2 ? "eager" : "lazy"}
                  wallpaper={wallpaper}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
