"use client";

import Link from "next/link";

import { DraggableStrip } from "@/components/ui/draggable-strip";
import { Reveal } from "@/components/ui/reveal";
import { MoodCard } from "@/components/wallpaper/mood-card";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { MoodCardData } from "@/types/home";
import type { SupportedLocale } from "@/types/i18n";

type MoodBoardSectionProps = {
  cards: MoodCardData[];
  locale: SupportedLocale;
};

export function MoodBoardSection({ cards, locale }: MoodBoardSectionProps) {
  const copy = getHomeUiCopy(locale);

  return (
    <section className="px-5 py-12 sm:px-6 md:px-10 md:py-16">
      <Reveal
        className="glass-surface mx-auto max-w-[1600px] overflow-hidden p-3 sm:p-4 md:p-5"
        y={24}
        duration={0.7}
      >
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[18px] border border-ink/8 bg-white/55 p-5 dark:border-paper/10 dark:bg-paper/6 sm:p-6">
            <div className="absolute inset-y-0 right-0 w-[2px] bg-[linear-gradient(180deg,transparent,rgba(255,109,45,0.35)_40%,rgba(255,109,45,0.15)_70%,transparent)]" />
            <div>
              <p className="mb-5 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-muted/60">
                <span className="h-px w-6 bg-red/50" />
                {copy.mood.eyebrow}
              </p>
              <h2 className="max-w-[8em] font-body text-[clamp(1.9rem,4vw,3.2rem)] font-semibold leading-[1.04] tracking-tight">
                {copy.mood.titlePrefix}
                <span className="text-red">{copy.mood.titleAccent}</span>
                {copy.mood.titleSuffix}
              </h2>
              <p className="mt-4 max-w-[18rem] text-[14px] leading-7 text-muted">
                {copy.mood.body}
              </p>
            </div>
            <Link
              className="mt-7 inline-flex w-fit items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-red"
              href="/explore"
            >
              {copy.mood.cta}
              <span aria-hidden className="text-red/60">↗</span>
            </Link>
          </div>

          <div className="min-w-0 overflow-hidden rounded-[24px] bg-white/24 px-2 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.56)] dark:bg-paper/6 dark:shadow-[inset_0_0_0_1px_rgba(237,247,244,0.08)]">
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
