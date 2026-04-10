"use client";

import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";
import type { MoodCardData, MoodShape } from "@/types/home";
import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";
import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";

const SHAPE_CLASSES: Record<MoodShape, string> = {
  portrait: "h-[240px] w-[160px] md:h-[340px] md:w-[220px]",
  landscape: "h-[180px] w-[280px] md:h-[240px] md:w-[380px]",
  square: "h-[200px] w-[200px] md:h-[280px] md:w-[280px]",
  tall: "h-[280px] w-[140px] md:h-[380px] md:w-[180px]",
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
        "group relative block shrink-0 overflow-hidden border-frame border-ink bg-paper dark:bg-paper2 shadow-[0_4px_20px_rgba(10,8,4,0.08)] transition-shadow duration-card will-change-transform hover:shadow-paper",
        SHAPE_CLASSES[card.shape],
      )}
      href={card.href}
      style={{ transformStyle: "preserve-3d", transition: "transform 0.08s linear, box-shadow 700ms" }}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      <div className="absolute inset-0 transition-transform duration-card ease-out group-hover:scale-[1.06]">
        <WallpaperCoverImage
          alt={card.name}
          sources={card.coverSources}
          gradient={card.gradient}
          sizes="(max-width: 640px) 50vw, 25vw"
          src={card.previewUrl}
        />
        <div className="absolute inset-0 bg-[rgba(10,8,4,0.12)]" />
      </div>

      {card.videoUrl ? (
        <MotionPreviewLayer
          className="transition-transform duration-card ease-out group-hover:scale-[1.06]"
          videoUrl={card.videoUrl}
        />
      ) : null}

      <div className="absolute left-3 top-3 font-mono text-xs tracking-[0.2em] text-paper/55">
        {card.number}
      </div>

      {card.videoUrl ? (
        <div className="absolute left-3 top-10 border border-paper/20 bg-black/35 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.22em] text-paper/70 backdrop-blur-sm">
          Motion
        </div>
      ) : null}

      <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border-frame border-ink bg-paper text-sm opacity-100 transition-[background-color,opacity] duration-hover hover:bg-gold md:opacity-0 md:group-hover:opacity-100">
        ↓
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-8 md:translate-y-[110%] md:transition-transform md:duration-info md:ease-[var(--ease-film)] md:group-hover:translate-y-0">
        <p className="font-display text-[20px] italic text-paper">{card.name}</p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-paper/65">
          {card.meta}
        </p>
        {card.aiTags && card.aiTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.aiTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="border border-paper/20 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.22em] text-paper/45"
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
