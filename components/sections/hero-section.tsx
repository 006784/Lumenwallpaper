import Link from "next/link";

import { HeroFilmPanel } from "@/components/sections/hero-film-panel";
import { heroStats } from "@/lib/data/home";

export function HeroSection() {
  return (
    <section className="border-b-frame border-ink md:grid md:min-h-[calc(100svh-56px)] md:grid-cols-[1.04fr_0.96fr]">
      {/* ── 左侧文案区 ── */}
      <div className="relative flex flex-col justify-between gap-8 overflow-hidden border-b-frame border-ink bg-[radial-gradient(circle_at_top_left,rgba(245,200,66,0.16),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.35),transparent_46%)] px-4 py-10 md:border-b-0 md:border-r-frame md:px-12 md:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red/25 to-transparent" />
        <div className="pointer-events-none absolute right-10 top-8 hidden items-center gap-3 text-[9px] uppercase tracking-[0.34em] text-muted/70 md:flex">
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
          <h1 className="max-w-[9ch] font-display text-[clamp(3rem,9vw,6rem)] leading-[0.92] tracking-[-0.06em]">
            每一帧
            <br />
            <em className="not-italic italic text-red">都值得</em>
            <br />
            <span className="text-outline">被看见</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-sm leading-7 text-muted md:text-[15px]">
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
            className="group inline-flex items-center gap-4 font-mono text-[22px] tracking-[0.18em] transition-[gap] duration-300 hover:gap-6"
            href="/explore"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-frame border-ink bg-paper/70 shadow-[8px_8px_0_0_rgba(10,8,4,0.08)] transition-[background-color,color,box-shadow] duration-200 group-hover:bg-ink group-hover:text-paper group-hover:shadow-[12px_12px_0_0_rgba(10,8,4,0.14)]">
              →
            </span>
            进入画廊
          </Link>
        </div>

        {/* 4 — 数据统计 */}
        <div
          className="fade-up grid gap-3 border-t border-ink/10 pt-8 sm:grid-cols-3"
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

        <div className="pointer-events-none absolute bottom-0 left-6 font-mono text-[100px] leading-none tracking-[-0.08em] text-ink/5 md:text-[140px]">
          48K
        </div>
      </div>

      {/* ── 右侧动态壁纸区 ── */}
      <HeroFilmPanel />
    </section>
  );
}
