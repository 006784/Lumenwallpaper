"use client";

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
    <section className="border-b-frame border-ink pt-section">
      <Reveal className="px-4 pb-10 md:px-10">
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
      </Reveal>

      <Reveal y={20} duration={0.8}>
        <DraggableStrip
          className="px-4 pb-12 md:px-10 md:pb-14"
          trackClassName="flex w-max gap-4 pb-1"
        >
          {cards.map((card) => (
            <MoodCard key={card.id} card={card} />
          ))}
        </DraggableStrip>
      </Reveal>
    </section>
  );
}
