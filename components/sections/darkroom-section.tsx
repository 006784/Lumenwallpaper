import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { DarkroomCard } from "@/components/wallpaper/darkroom-card";
import { darkroomItems } from "@/lib/data/home";

export function DarkroomSection() {
  return (
    <section className="border-b border-paper/10 bg-ink px-4 py-14 md:px-10 md:py-section">
      <Reveal className="mb-10 text-paper">
        <SectionHeading
          eyebrow="03 — 暗室精选"
          hint={
            <span className="text-right leading-5 text-paper/35">
              每周策展
              <br />
              编辑团队推荐
            </span>
          }
          title={<span className="italic">暗室精选</span>}
        />
      </Reveal>

      <Reveal
        stagger
        className="grid gap-[3px] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[260px_260px]"
        y={30}
        duration={0.7}
      >
        {darkroomItems.map((item) => (
          <div
            key={item.title}
            className={item.featured ? "min-h-[180px] md:row-span-2" : "min-h-[180px]"}
          >
            <DarkroomCard item={item} />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
