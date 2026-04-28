"use client";

import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";
import type { MoodCardData, MoodShape } from "@/types/home";
import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";
import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";

const SHAPE_CLASSES: Record<MoodShape, string> = {
  portrait: "h-[220px] w-[148px] md:h-[300px] md:w-[194px]",
  landscape: "h-[164px] w-[250px] md:h-[212px] md:w-[330px]",
  square: "h-[184px] w-[184px] md:h-[246px] md:w-[246px]",
  tall: "h-[252px] w-[128px] md:h-[334px] md:w-[158px]",
};

const TILT_STRENGTH = 7;

type MoodCardProps = {
  card: MoodCardData;
};

export function MoodCard({ card }: MoodCardProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  function handleMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 2;
    const y = ((e.clientY - top) / height - 0.5) * 2;
    el.style.transform = `perspective(600px) rotateY(${x * TILT_STRENGTH}deg) rotateX(${-y * TILT_STRENGTH}deg) translateY(-4px)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
  }

  return (
    <Link
      ref={ref}
      className={cn(
        "glass-surface-soft group relative block shrink-0 overflow-hidden p-3 transition-shadow duration-card will-change-transform",
        SHAPE_CLASSES[card.shape],
      )}
      href={card.href}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.08s linear, box-shadow 700ms" }}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-3 overflow-hidden rounded-[22px] transition-transform duration-card ease-out group-hover:scale-[1.04]">
        <WallpaperCoverImage
          alt={card.name}
          sources={card.coverSources}
          gradient={card.gradient}
          sizes="(max-width: 640px) 50vw, 25vw"
          src={card.previewUrl}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(23,79,80,0.16))]" />
      </div>

      {card.videoUrl ? (
        <MotionPreviewLayer
          className="transition-transform duration-card ease-out group-hover:scale-[1.06]"
          videoUrl={card.videoUrl}
        />
      ) : null}

      <div className="glass-chip absolute left-5 top-5 px-2 py-1 font-mono text-xs tracking-[0.2em] text-ink/70">
        {card.number}
      </div>

      {card.videoUrl ? (
        <div className="glass-chip absolute left-5 top-14 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.22em] text-ink backdrop-blur-sm">
          Motion
        </div>
      ) : null}

      <div className="glass-control absolute right-5 top-5 flex h-9 w-9 items-center justify-center text-sm opacity-100 transition-[background-color,opacity] duration-hover md:opacity-0 md:group-hover:opacity-100">
        ↓
      </div>

      <div className="absolute inset-x-3 bottom-3 rounded-[20px] bg-white/72 px-4 pb-4 pt-5 shadow-[0_12px_24px_rgba(37,58,62,0.12)] backdrop-blur md:translate-y-[112%] md:transition-transform md:duration-info md:ease-[var(--ease-film)] md:group-hover:translate-y-0">
        <p className="font-body text-[18px] font-semibold text-ink">{card.name}</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-muted">
          {card.meta}
        </p>
        {card.aiTags && card.aiTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.aiTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="glass-chip px-1.5 py-0.5 text-[7px] uppercase tracking-[0.22em] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
