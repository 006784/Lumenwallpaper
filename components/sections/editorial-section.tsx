import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { GRADIENTS } from "@/lib/gradients";
import type { EditorialFeature, EditorialItem } from "@/types/home";

type EditorialSectionProps = {
  feature: EditorialFeature;
  items: EditorialItem[];
};

export function EditorialSection({ feature, items }: EditorialSectionProps) {
  const editorialFeature = feature;
  const editorialItems = items;
  return (
    <section className="border-b-frame border-ink">
      <Reveal className="md:grid md:grid-cols-[1.2fr_1fr]" y={30} duration={0.7}>
      <Link
        className="group relative block min-h-[360px] overflow-hidden border-b-frame border-ink md:min-h-[540px] md:border-b-0 md:border-r-frame"
        href={editorialFeature.href}
      >
        <div
          className="absolute inset-0 transition duration-card ease-out group-hover:scale-[1.04]"
          style={{ backgroundImage: GRADIENTS[editorialFeature.gradient] }}
        />
        {/* 右上角箭头 */}
        <div className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 text-paper/50 opacity-0 backdrop-blur-sm transition duration-hover group-hover:opacity-100 group-hover:border-paper/60 group-hover:text-paper">
          ↗
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent px-6 pb-8 pt-16 text-paper md:px-10">
          <p className="mb-3 text-[9px] uppercase tracking-[0.35em] text-gold">
            ✦ {editorialFeature.eyebrow}
          </p>
          <h2 className="max-w-[12ch] font-display text-[clamp(2rem,4vw,2.5rem)] leading-[1.06] transition-[letter-spacing] duration-300 group-hover:tracking-[0.005em]">
            {editorialFeature.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/65">
            {editorialFeature.description}
          </p>
        </div>
      </Link>

      <div className="flex flex-col">
        {editorialItems.map((item) => (
          <Link
            key={item.number}
            className="group grid flex-1 grid-cols-[88px_1fr] border-b-frame border-ink transition last:border-b-0 hover:bg-paper2 md:grid-cols-[100px_1fr]"
            href={item.href}
          >
            <div className="overflow-hidden border-r-frame border-ink">
              <div
                className="h-full transition duration-card ease-out group-hover:scale-[1.08]"
                style={{ backgroundImage: GRADIENTS[item.gradient] }}
              />
            </div>
            <div className="flex flex-col justify-between px-5 py-5">
              <p className="font-mono text-[11px] tracking-[0.2em] text-muted">
                {item.number}
              </p>
              <p className="font-display text-[20px] leading-[1.2]">{item.title}</p>
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.25em] text-muted">
                  {item.meta}
                </p>
                <span className="translate-x-1 text-sm text-ink/20 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      </Reveal>
    </section>
  );
}
