import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DarkroomCard } from "@/components/wallpaper/darkroom-card";
import type { DarkroomItem } from "@/types/home";
import Link from "next/link";

type DarkroomSectionProps = {
  items: DarkroomItem[];
};

export function DarkroomSection({ items }: DarkroomSectionProps) {
  return (
    <section className="dm-light border-b border-paper/10 bg-[radial-gradient(circle_at_top,rgba(245,200,66,0.08),transparent_24%),linear-gradient(180deg,#090805,#0d0b07_36%,#12100a_100%)] px-5 py-14 sm:px-6 md:px-10 md:py-section">
      <Reveal className="mb-10 text-paper">
        <SectionHeading
          eyebrow="04 — 暗室精选"
          hint={
            <span className="text-right leading-5 text-paper/35">
              每周策展
              <br />
              编辑团队推荐
            </span>
          }
          title={
            <>
              让高反差与
              <br />
              <span className="italic text-gold">低照度</span> 留下来
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/48">
          这一组更强调夜色、戏剧光影和更深的氛围密度。它不追求轻快，而是把画面压进更像暗房冲印的观看环境里。
        </p>
        <div className="mt-6">
          <Link className="section-entry-link section-entry-link--dark" href="/darkroom">
            进入暗室精选
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal
        stagger
        className="grid gap-[4px] border border-paper/10 bg-paper/5 p-[4px] sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:grid-rows-[260px_260px] xl:grid-rows-[280px_280px]"
        y={30}
        duration={0.7}
      >
        {items.map((item) => (
          <div
            key={item.title}
            className={
              item.featured
                ? "min-h-[200px] sm:col-span-2 lg:col-auto lg:row-span-2"
                : "min-h-[180px]"
            }
          >
            <DarkroomCard item={item} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
