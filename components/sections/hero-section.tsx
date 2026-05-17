import Link from "next/link";

import { HeroFilmPanel } from "@/components/sections/hero-film-panel";
import { getLocalizedHeroStats } from "@/lib/data/home";
import { EXPLORE_CATEGORIES } from "@/lib/explore";
import { getExploreCategoryCopy } from "@/lib/i18n";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { FilmCellData } from "@/types/home";
import type { SupportedLocale } from "@/types/i18n";

type HeroSectionProps = {
  filmRows?: FilmCellData[][];
  locale: SupportedLocale;
};

export function HeroSection({ filmRows, locale }: HeroSectionProps) {
  const copy = getHomeUiCopy(locale);
  const heroStats = getLocalizedHeroStats(locale);
  const primaryCategories = EXPLORE_CATEGORIES.slice(0, 5);

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pb-14 lg:pt-28">
      <div className="relative mx-auto grid max-w-[1600px] gap-10 lg:min-h-[calc(100svh-96px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.8fr)] lg:items-stretch">
        {/* 左栏：文案 + 交互 */}
        <div className="flex min-w-0 flex-col justify-between gap-10 py-4 lg:py-8">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-ink/8 bg-white/60 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-muted backdrop-blur-sm dark:border-paper/10 dark:bg-paper/6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red shadow-[0_0_10px_rgba(255,109,45,0.7)]" />
              </span>
              {copy.hero.badge}
            </div>

            {/* H1 */}
            <div className="max-w-4xl space-y-5">
              <h1 className="max-w-[10.5em] font-display text-[clamp(2.8rem,6.4vw,6rem)] font-medium leading-[0.95] tracking-tight text-ink [text-wrap:balance]">
                <span className="block">{copy.hero.h1Line1}</span>
                <span className="block text-red/90">{copy.hero.h1Line2}</span>
              </h1>
              <p className="max-w-xl text-base leading-8 text-muted md:text-[17px]">
                {copy.hero.subtitle}
              </p>
            </div>

            {/* 搜索框 */}
            <form
              action="/explore"
              className="grid max-w-2xl overflow-hidden rounded-[18px] border border-ink/8 bg-white/72 shadow-[0_8px_32px_rgba(23,79,80,0.08),-4px_-4px_16px_rgba(255,255,255,0.7)] backdrop-blur-md dark:border-paper/10 dark:bg-paper/8 dark:shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:grid-cols-[1fr_auto]"
              method="get"
            >
              <label className="sr-only" htmlFor="home-hero-search">
                {copy.hero.searchLabel}
              </label>
              <input
                id="home-hero-search"
                className="min-h-[56px] min-w-0 bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-muted/60"
                name="q"
                placeholder={copy.hero.searchPlaceholder}
                type="search"
              />
              <button
                className="m-1.5 rounded-[12px] bg-ink px-6 text-[11px] uppercase tracking-[0.22em] text-paper transition hover:opacity-90 dark:bg-paper dark:text-ink"
                type="submit"
              >
                {copy.hero.searchSubmit}
              </button>
            </form>

            {/* 快捷分类 */}
            <div className="flex flex-wrap gap-2">
              <Link
                className="glass-chip-active px-4 py-2 text-[10px] uppercase tracking-[0.18em]"
                href="/explore?sort=popular"
              >
                {copy.hero.categoryPopular}
              </Link>
              <Link
                className="glass-chip px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-red transition hover:text-red/70 focus-visible:outline-none"
                href="/explore?featured=true"
              >
                {copy.hero.categoryFeatured}
              </Link>
              {primaryCategories.map((category) => (
                <Link
                  key={category.slug}
                  className="glass-chip px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:text-red focus-visible:outline-none"
                  href={category.href}
                >
                  {getExploreCategoryCopy(locale, category.slug)?.label ??
                    category.label}
                </Link>
              ))}
            </div>
          </div>

          {/* 数据统计 */}
          <div className="grid gap-3 pt-4 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-[16px] border border-ink/8 bg-white/55 px-5 py-5 dark:border-paper/10 dark:bg-paper/6"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(255,109,45,0.5),transparent)]" />
                <div className="font-mono text-[2rem] leading-none text-ink dark:text-paper">
                  {stat.value}
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右栏：Film panel + 快捷入口 */}
        <div className="flex flex-col gap-4 lg:py-4">
          <div className="relative min-h-[440px] flex-1 overflow-hidden rounded-[24px] border border-ink/8 shadow-[0_24px_64px_rgba(23,79,80,0.14)] dark:border-paper/10">
            <HeroFilmPanel rows={filmRows} />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-3">
            {[
              [copy.hero.shortcutMotion, "/explore?motion=true"],
              [copy.hero.shortcutDarkroom, "/darkroom"],
              [copy.hero.shortcutUpload, "/creator/studio"],
            ].map(([label, href]) => (
              <Link
                key={label}
                className="group flex min-h-[60px] items-center justify-between rounded-[14px] border border-ink/8 bg-white/55 px-5 text-[11px] uppercase tracking-[0.18em] text-muted transition hover:border-red/20 hover:text-red dark:border-paper/10 dark:bg-paper/6 dark:hover:border-red/25"
                href={href}
              >
                {label}
                <span aria-hidden className="opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-80">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
