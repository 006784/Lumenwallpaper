import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { GRADIENTS } from "@/lib/gradients";
import type { EditorialFeature, EditorialItem } from "@/types/home";
import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";

type EditorialSectionProps = {
  feature: EditorialFeature;
  items: EditorialItem[];
};

export function EditorialSection({
  feature,
  items,
}: EditorialSectionProps) {
  return (
    <section className="border-b-frame border-ink bg-paper/45 px-4 py-14 md:px-10 md:py-section">
      <Reveal className="mb-10" y={18} duration={0.6}>
        <SectionHeading
          eyebrow="03 — 编辑推荐"
          hint={
            <span className="leading-5 text-right">
              故事感优先
              <br />
              大图慢慢看
            </span>
          }
          title={
            <>
              为值得停留的
              <br />
              <em className="not-italic italic text-red">画面留白</em>
            </>
          }
        />
        <div className="mt-6">
          <Link className="section-entry-link" href="/explore?featured=true">
            查看本周推荐
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal className="overflow-hidden border-frame border-ink bg-paper dark:bg-paper2 shadow-[12px_12px_0_0_rgba(10,8,4,0.06)] dark:shadow-[12px_12px_0_0_rgba(0,0,0,0.35)] md:grid md:grid-cols-[1.16fr_0.84fr]" y={30} duration={0.7}>
      <Link
        className="group relative block min-h-[360px] overflow-hidden border-b-frame border-ink md:min-h-[540px] md:border-b-0 md:border-r-frame"
        href={feature.href}
      >
        <div className="absolute inset-0 transition duration-card ease-out group-hover:scale-[1.04]">
          {feature.previewUrl ? (
            <Image
              fill
              alt={feature.title}
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 58vw"
              src={feature.previewUrl}
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: GRADIENTS[feature.gradient] }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,8,4,0.22)] to-[rgba(10,8,4,0.12)]" />
        </div>
        {feature.videoUrl ? (
          <MotionPreviewLayer
            className="transition duration-card ease-out group-hover:scale-[1.04]"
            videoUrl={feature.videoUrl}
          />
        ) : null}
        {/* 右上角箭头 */}
        <div className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-paper/25 text-paper/50 opacity-0 backdrop-blur-sm transition duration-hover group-hover:opacity-100 group-hover:border-paper/60 group-hover:text-paper">
          ↗
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent px-6 pb-8 pt-16 text-paper md:px-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-[9px] uppercase tracking-[0.35em] text-gold">
              ✦ {feature.eyebrow}
            </p>
            {feature.videoUrl ? (
              <span className="border border-paper/20 bg-paper/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.24em] text-paper/70 backdrop-blur-sm">
                Motion
              </span>
            ) : null}
          </div>
          <h2 className="max-w-[12ch] font-display text-[clamp(2rem,4vw,2.5rem)] leading-[1.06] transition-[letter-spacing] duration-300 group-hover:tracking-[0.005em]">
            {feature.title}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-paper/65">
            {feature.description}
          </p>
        </div>
      </Link>

      <div className="flex flex-col">
        {items.map((item) => {
          return (
            <Link
              key={item.number}
              className="group grid flex-1 grid-cols-[88px_1fr] border-b-frame border-ink transition last:border-b-0 hover:bg-paper2 md:grid-cols-[100px_1fr]"
              href={item.href}
            >
              <div className="relative overflow-hidden border-r-frame border-ink">
                <div className="absolute inset-0 transition duration-card ease-out group-hover:scale-[1.08]">
                  {item.previewUrl ? (
                    <Image
                      fill
                      alt={item.title}
                      className="object-cover object-center"
                      sizes="100px"
                      src={item.previewUrl}
                    />
                  ) : (
                    <div className="absolute inset-0" style={{ backgroundImage: GRADIENTS[item.gradient] }} />
                  )}
                  {item.videoUrl ? (
                    <MotionPreviewLayer
                      className="transition duration-card ease-out group-hover:scale-[1.08]"
                      videoUrl={item.videoUrl}
                    />
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col justify-between px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[11px] tracking-[0.2em] text-muted">
                    {item.number}
                  </p>
                  {item.videoUrl ? (
                    <span className="border border-ink/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
                      Motion
                    </span>
                  ) : null}
                </div>
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
          );
        })}
      </div>
      </Reveal>
    </section>
  );
}
