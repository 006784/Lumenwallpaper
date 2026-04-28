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
    <section className="px-5 py-14 sm:px-6 md:px-10 md:py-section">
      <Reveal className="mb-10 text-ink">
        <SectionHeading
          eyebrow="04 — 暗室精选"
          hint={
            <span className="text-right leading-5 text-muted">
              每周策展
              <br />
              编辑团队推荐
            </span>
          }
          title={
            <>
              让高反差与
              <br />
              <span className="text-red">低照度</span> 留下来
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          这一组更强调夜色、戏剧光影和更深的氛围密度。它不追求轻快，而是把画面压进更像暗房冲印的观看环境里。
        </p>
        <div className="mt-6">
          <Link className="section-entry-link" href="/darkroom">
            进入暗室精选
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
            className={
              item.featured
                ? "sm:col-span-2 lg:row-span-2"
                : ""
            }
          >
            <DarkroomCard item={item} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
