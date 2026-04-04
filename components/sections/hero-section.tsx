import Link from "next/link";

import { HeroFilmPanel } from "@/components/sections/hero-film-panel";
import { heroStats } from "@/lib/data/home";
import type { FilmCellData } from "@/types/home";

type HeroSectionProps = {
  filmRows?: FilmCellData[][];
};

export function HeroSection({ filmRows }: HeroSectionProps) {
  return (
    <section className="border-b-frame border-ink lg:grid lg:min-h-[calc(100svh-56px)] lg:grid-cols-[1.04fr_0.96fr]">
      {/* ── 左侧文案区 ── */}
      <div className="relative flex flex-col justify-between gap-8 overflow-hidden border-b-frame border-ink bg-[radial-gradient(circle_at_top_left,rgba(245,200,66,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_46%)] px-5 py-8 sm:px-6 sm:py-10 lg:border-b-0 lg:border-r-frame lg:px-12 lg:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red/25 to-transparent" />
        <div className="pointer-events-none absolute right-8 top-7 hidden items-center gap-3 text-[9px] uppercase tracking-[0.34em] text-muted/70 lg:flex">
          <span>Issue 01</span>
          <span className="h-px w-10 bg-ink/15" />
          <span>Curated Screens</span>
        </div>

        {/* 1 — 状态标签 */}
        <div
          className="fade-up inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-red"
          style={{ animationDelay: "0ms" }}
        >
          <span className="live-dot inline-block h-[7px] w-[7px] rounded-full bg-red" />
          每日更新中
        </div>

        {/* 2 — 标题 */}
        <div className="fade-up" style={{ animationDelay: "110ms" }}>
          <h1 className="max-w-[9ch] font-display text-[clamp(2.9rem,14vw,6rem)] leading-[0.9] tracking-[-0.06em]">
            每一帧
            <br />
            <em className="not-italic italic text-red">都值得</em>
            <br />
            <span className="text-outline">被看见</span>
          </h1>
          <p className="mt-5 max-w-[34rem] text-sm leading-7 text-muted sm:mt-6 md:text-[15px]">
            不只是壁纸，是你与世界相处的方式。收录来自全球摄影师与数字艺术家的
            48,000+ 作品，4K 画质，免费下载。
          </p>
        </div>

        {/* 3 — CTA */}
        <div className="fade-up" style={{ animationDelay: "240ms" }}>
          <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-muted">
            策展入口
          </p>
          <Link
            className="group inline-flex items-center gap-3 font-mono text-[18px] tracking-[0.14em] transition-[gap] duration-300 hover:gap-5 sm:gap-4 sm:text-[22px] sm:tracking-[0.18em] sm:hover:gap-6"
            href="/explore"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-frame border-ink bg-paper/70 shadow-[8px_8px_0_0_rgba(10,8,4,0.08)] transition-[background-color,color,box-shadow] duration-200 group-hover:bg-ink group-hover:text-paper group-hover:shadow-[12px_12px_0_0_rgba(10,8,4,0.14)] sm:h-14 sm:w-14">
              →
            </span>
            进入画廊
          </Link>
        </div>

        {/* 4 — 数据统计 */}
        <div
          className="fade-up grid gap-3 border-t border-ink/10 pt-7 sm:grid-cols-2 xl:grid-cols-3"
          style={{ animationDelay: "360ms" }}
        >
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="group border border-ink/10 bg-paper/45 px-4 py-4 backdrop-blur transition-colors duration-200 hover:border-ink/20 hover:bg-paper/70"
            >
              <div className="font-mono text-[32px] leading-none tracking-[-0.05em] transition-colors group-hover:text-red">
                {stat.value}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-0 left-5 font-mono text-[72px] leading-none tracking-[-0.08em] text-ink/5 sm:text-[100px] lg:left-6 lg:text-[140px]">
          48K
        </div>
      </div>

      {/* ── 右侧动态壁纸区 ── */}
      <HeroFilmPanel rows={filmRows} />
    </section>
  );
}
