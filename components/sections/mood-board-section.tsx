"use client";

import Link from "next/link";

import { DraggableStrip } from "@/components/ui/draggable-strip";
import { Reveal } from "@/components/ui/reveal";
import { MoodCard } from "@/components/wallpaper/mood-card";
import type { MoodCardData } from "@/types/home";

type MoodBoardSectionProps = {
  cards: MoodCardData[];
};

export function MoodBoardSection({ cards }: MoodBoardSectionProps) {
  return (
    <section className="px-5 py-12 sm:px-6 md:px-10 md:py-16">
      <Reveal
        className="glass-surface mx-auto max-w-[1600px] overflow-hidden p-3 sm:p-4 md:p-5"
        y={24}
        duration={0.7}
      >
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="glass-surface-soft flex min-h-[280px] flex-col justify-between p-5 sm:p-6">
            <div>
              <p className="mb-5 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted">
                <span className="h-px w-7 bg-current opacity-40" />
                01 · 情绪版
              </p>
              <h2 className="max-w-[8em] font-body text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[1.02]">
                按<span className="text-red">心情</span>找壁纸
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted">
                保留静态壁纸，把氛围、角色和色彩放到同一个浏览节奏里。
              </p>
            </div>
            <Link className="section-entry-link mt-7 w-fit" href="/explore">
              进入情绪版
              <span aria-hidden>↗</span>
            </Link>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[24px] bg-white/24 px-2 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.56)]">
            <DraggableStrip
              className="pb-1"
              trackClassName="flex w-max gap-3 md:gap-4"
            >
              {cards.map((card) => (
                <MoodCard key={card.id} card={card} />
              ))}
            </DraggableStrip>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
