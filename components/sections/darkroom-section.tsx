import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DarkroomCard } from "@/components/wallpaper/darkroom-card";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { DarkroomItem } from "@/types/home";
import type { SupportedLocale } from "@/types/i18n";
import Link from "next/link";

type DarkroomSectionProps = {
  items: DarkroomItem[];
  locale: SupportedLocale;
};

export function DarkroomSection({ items, locale }: DarkroomSectionProps) {
  const copy = getHomeUiCopy(locale);

  return (
    <section className="px-5 py-14 sm:px-6 md:px-10 md:py-section">
      <Reveal className="mb-10 text-ink">
        <SectionHeading
          eyebrow={copy.darkroom.eyebrow}
          hint={
            <span className="text-right leading-5 text-muted">
              {copy.darkroom.hintLine1}
              <br />
              {copy.darkroom.hintLine2}
            </span>
          }
          title={
            <>
              {copy.darkroom.titleLine1}
              <br />
              <span className="text-red">{copy.darkroom.titleAccent}</span>{" "}
              {copy.darkroom.titleLine2}
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          {copy.darkroom.body}
        </p>
        <div className="mt-6">
          <Link className="section-entry-link" href="/darkroom">
            {copy.darkroom.cta}
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal
        stagger
        className="glass-surface grid auto-rows-[200px] gap-3 p-3 sm:grid-cols-2 lg:auto-rows-[220px] lg:grid-cols-4 xl:auto-rows-[240px]"
        y={30}
        duration={0.7}
      >
        {items.map((item) => (
          <div
            key={item.title}
            className={item.featured ? "sm:col-span-2 lg:row-span-2" : ""}
          >
            <DarkroomCard item={item} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
