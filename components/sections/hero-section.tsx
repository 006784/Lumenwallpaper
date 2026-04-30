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
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-8 pt-24 sm:px-6 lg:px-10 lg:pb-12 lg:pt-28">
      <div className="relative mx-auto grid max-w-[1600px] gap-8 lg:min-h-[calc(100svh-96px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.8fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-8 py-4 lg:py-8">
          <div className="space-y-7">
            <div className="glass-chip inline-flex items-center gap-3 px-4 py-2 text-[10px] uppercase text-muted backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-red shadow-[0_0_18px_rgba(255,109,45,0.5)]" />
              {copy.hero.badge}
            </div>

            <div className="max-w-4xl space-y-6">
              <h1 className="max-w-[10.5em] font-display text-[clamp(2.75rem,6.4vw,5.75rem)] font-medium leading-[0.98] text-ink [text-wrap:balance]">
                <span className="block">{copy.hero.h1Line1}</span>
                <span className="block">{copy.hero.h1Line2}</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                {copy.hero.subtitle}
              </p>
            </div>

            <form
              action="/explore"
              className="glass-surface-soft grid max-w-3xl gap-2 p-2 sm:grid-cols-[1fr_auto]"
              method="get"
            >
              <label className="sr-only" htmlFor="home-hero-search">
                {copy.hero.searchLabel}
              </label>
              <input
                id="home-hero-search"
                className="glass-field min-h-[58px] min-w-0 px-5 text-base outline-none placeholder:text-muted/70"
                name="q"
                placeholder={copy.hero.searchPlaceholder}
                type="search"
              />
              <button
                className="glass-primary min-h-[58px] px-7 text-[12px] uppercase"
                type="submit"
              >
                {copy.hero.searchSubmit}
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <Link
                className="glass-chip-active px-4 py-2 text-[11px] uppercase"
                href="/explore?sort=popular"
              >
                {copy.hero.categoryPopular}
              </Link>
              <Link
                className="glass-chip px-4 py-2 text-[11px] uppercase text-red transition hover:text-ink"
                href="/explore?featured=true"
              >
                {copy.hero.categoryFeatured}
              </Link>
              {primaryCategories.map((category) => (
                <Link
                  key={category.slug}
                  className="glass-chip px-4 py-2 text-[11px] uppercase text-muted transition hover:text-ink"
                  href={category.href}
                >
                  {getExploreCategoryCopy(locale, category.slug)?.label ??
                    category.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 pt-6 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div key={stat.label} className="glass-surface-soft px-4 py-4">
                <div className="font-mono text-3xl leading-none text-ink">
                  {stat.value}
                </div>
                <div className="mt-2 text-[11px] uppercase text-muted">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:py-4">
          <div className="glass-surface min-h-[440px] overflow-hidden p-3">
            <HeroFilmPanel rows={filmRows} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [copy.hero.shortcutMotion, "/explore?motion=true"],
              [copy.hero.shortcutDarkroom, "/darkroom"],
              [copy.hero.shortcutUpload, "/creator/studio"],
            ].map(([label, href]) => (
              <Link
                key={label}
                className="glass-control flex min-h-[64px] items-center justify-between px-5 text-[12px] uppercase text-muted transition hover:text-ink"
                href={href}
              >
                {label}
                <span aria-hidden>+</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
