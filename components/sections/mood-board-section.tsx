"use client";

import Link from "next/link";

import { DraggableStrip } from "@/components/ui/draggable-strip";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { MoodCard } from "@/components/wallpaper/mood-card";
import type { MoodCardData } from "@/types/home";

type MoodBoardSectionProps = {
  cards: MoodCardData[];
};

export function MoodBoardSection({ cards }: MoodBoardSectionProps) {
  return (
    <section className="pt-14 sm:pt-16 md:pt-section">
      <Reveal className="px-5 pb-7 sm:px-6 md:px-10">
        <SectionHeading
          eyebrow="01 — 情绪版"
          hint={
            <span className="inline-flex items-center gap-2">
              <span className="drag-arrow inline-block text-lg">→</span>
              左右滑动
            </span>
          }
          title={
            <>
              按<em className="not-italic italic text-red">心情</em>找壁纸
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          专门保留静态壁纸。这里更适合按氛围、角色和颜色慢慢挑，不混入动态内容。
        </p>
        <div className="mt-5 sm:mt-6">
          <Link className="section-entry-link" href="/explore">
            进入情绪版
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal y={20} duration={0.8}>
        <DraggableStrip
          className="px-5 pb-12 sm:px-6 md:px-10 md:pb-14"
          trackClassName="flex w-max gap-4 pb-2 sm:gap-5"
        >
          {cards.map((card) => (
            <MoodCard key={card.id} card={card} />
          ))}
        </DraggableStrip>
      </Reveal>
    </section>
  );
}
