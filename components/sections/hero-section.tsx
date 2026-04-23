import Link from "next/link";

import { HeroFilmPanel } from "@/components/sections/hero-film-panel";
import { heroStats } from "@/lib/data/home";
import { EXPLORE_CATEGORIES } from "@/lib/explore";
import type { FilmCellData } from "@/types/home";

type HeroSectionProps = {
  filmRows?: FilmCellData[][];
};

export function HeroSection({ filmRows }: HeroSectionProps) {
  const primaryCategories = EXPLORE_CATEGORIES.slice(0, 5);

  return (
    <section className="relative overflow-hidden border-b border-ink/10 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(10,8,4,0.045)_1px,transparent_1px),linear-gradient(180deg,rgba(10,8,4,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 dark:opacity-20" />

      <div className="relative mx-auto grid max-w-[1600px] gap-8 lg:min-h-[calc(100svh-96px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.8fr)] lg:items-stretch">
        <div className="flex min-w-0 flex-col justify-between gap-8 py-4 lg:py-8">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-3 border border-ink/10 bg-paper/70 px-3 py-2 text-[10px] uppercase text-muted backdrop-blur dark:bg-paper2/70">
              <span className="h-2 w-2 bg-red" />
              Lumen Gallery is live
            </div>

            <div className="max-w-4xl space-y-6">
              <h1 className="max-w-[11em] font-display text-[clamp(2.75rem,6.4vw,5.8rem)] font-normal leading-[1.08] text-ink [text-wrap:balance]">
                <span className="block">每一帧，</span>
                <span className="block">都值得被看见。</span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-muted md:text-lg">
                Lumen 收录 4K 静态壁纸、动态预览、创作者作品和暗色精选。
                从一个关键词开始，再按分类、热度和精选状态慢慢缩小范围。
              </p>
            </div>

            <form
              action="/explore"
              className="grid max-w-3xl border border-ink bg-paper shadow-[10px_10px_0_0_rgba(10,8,4,0.08)] dark:border-ink/20 dark:bg-paper2 dark:shadow-none sm:grid-cols-[1fr_auto]"
              method="get"
            >
              <label className="sr-only" htmlFor="home-hero-search">
                搜索壁纸
              </label>
              <input
                id="home-hero-search"
                className="min-h-[58px] min-w-0 bg-transparent px-5 text-base outline-none placeholder:text-muted/70 focus:bg-paper2/60 dark:focus:bg-paper/5"
                name="q"
                placeholder="搜索自然、暗色、城市、宇宙、极简..."
                type="search"
              />
              <button
                className="min-h-[58px] border-t border-ink bg-ink px-6 text-[12px] uppercase text-paper transition hover:bg-red focus-visible:bg-red sm:border-l sm:border-t-0"
                type="submit"
              >
                搜索
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              <Link
                className="border border-red/25 bg-red/10 px-3 py-2 text-[11px] uppercase text-red transition hover:bg-red hover:text-paper"
                href="/explore?sort=popular"
              >
                热门下载
              </Link>
              <Link
                className="border border-gold/25 bg-gold/10 px-3 py-2 text-[11px] uppercase text-gold transition hover:bg-gold hover:text-ink"
                href="/explore?featured=true"
              >
                编辑精选
              </Link>
              {primaryCategories.map((category) => (
                <Link
                  key={category.slug}
                  className="border border-ink/10 bg-paper/60 px-3 py-2 text-[11px] uppercase text-muted transition hover:border-ink hover:text-ink dark:bg-paper2/70"
                  href={category.href}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 border-t border-ink/10 pt-6 sm:grid-cols-3">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="border border-ink/10 bg-paper/60 px-4 py-4 dark:bg-paper2/60"
              >
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
          <div className="min-h-[440px] overflow-hidden border border-ink bg-ink shadow-[14px_14px_0_0_rgba(10,8,4,0.08)] dark:border-ink/20 dark:shadow-none">
            <HeroFilmPanel rows={filmRows} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Motion", "/explore?motion=true"],
              ["Darkroom", "/darkroom"],
              ["Upload", "/creator/studio"],
            ].map(([label, href]) => (
              <Link
                key={label}
                className="flex min-h-[64px] items-center justify-between border border-ink/10 bg-paper/70 px-4 text-[12px] uppercase text-muted transition hover:border-ink hover:bg-ink hover:text-paper dark:bg-paper2/70"
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
