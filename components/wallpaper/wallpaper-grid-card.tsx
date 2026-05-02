"use client";

import { useState } from "react";

import Link from "next/link";

import {
  getWallpaperCoverSources,
  getWallpaperGradientKey,
  getWallpaperDisplayTitle,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types/wallpaper";
import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";
import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";

type WallpaperGridCardProps = {
  wallpaper: Wallpaper;
  imageQuality?: "default" | "medium" | "large";
  /** Tailwind aspect-ratio class, e.g. "aspect-[9/18]". Defaults to "aspect-[4/5]". */
  aspectRatio?: string;
  className?: string;
};

export function WallpaperGridCard({
  wallpaper,
  imageQuality = "default",
  aspectRatio = "aspect-[4/5]",
  className,
}: WallpaperGridCardProps) {
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const previewUrl = getWallpaperPreviewUrl(wallpaper, imageQuality);
  const coverSources = getWallpaperCoverSources(wallpaper);
  const gradientKey = getWallpaperGradientKey(wallpaper);
  const displayTitle = getWallpaperDisplayTitle(wallpaper);
  const visibleTags = (
    wallpaper.tags.length > 0 ? wallpaper.tags : wallpaper.aiTags
  ).slice(0, 3);

  return (
    <Link
      className={cn(
        "glass-surface-soft group relative h-fit self-start overflow-hidden text-ink transition duration-card hover:-translate-y-1 focus-visible:-translate-y-1",
        wallpaper.videoUrl &&
          "bg-white/58 text-ink shadow-[0_22px_54px_rgba(37,58,62,0.14)]",
        className,
      )}
      href={`/wallpaper/${wallpaper.slug}`}
      onBlur={() => setIsPreviewActive(false)}
      onFocus={() => setIsPreviewActive(true)}
      onMouseEnter={() => setIsPreviewActive(true)}
      onMouseLeave={() => setIsPreviewActive(false)}
    >
      {wallpaper.videoUrl ? (
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-black/18 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/74 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-red/80" />
          Motion
        </div>
      ) : null}

      <div
        className={cn(
          aspectRatio,
          "relative m-2.5 overflow-hidden rounded-[18px] sm:m-3",
          wallpaper.videoUrl && "rounded-[20px] bg-ink",
        )}
      >
        <WallpaperCoverImage
          alt={displayTitle}
          sources={coverSources}
          gradient={gradientKey}
          imageClassName={wallpaper.videoUrl ? "brightness-[.96] saturate-[1.04]" : undefined}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          src={previewUrl}
        />
        <div
          className={
            wallpaper.videoUrl
              ? "absolute inset-0 bg-[radial-gradient(circle_at_22%_14%,rgba(255,111,77,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(8,10,10,0.02)_48%,rgba(0,0,0,0.34))]"
              : "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(23,79,80,0.12))]"
          }
        />
        {wallpaper.videoUrl ? (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[8px] uppercase tracking-[0.28em] text-paper/18 [writing-mode:vertical-rl]">
            motion
          </div>
        ) : null}
        {wallpaper.videoUrl ? (
          <MotionPreviewLayer
            className="transition-transform duration-card group-hover:scale-[1.025] group-focus-visible:scale-[1.025]"
            isActive={isPreviewActive}
            videoUrl={wallpaper.videoUrl}
          />
        ) : null}
        {wallpaper.videoUrl ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-3 opacity-75 transition group-hover:opacity-100">
            <div className="h-px flex-1 bg-paper/16" />
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-paper/62">
              loop
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 px-3 pb-3 pt-0.5 sm:px-4 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="line-clamp-2 font-body text-[15px] font-semibold leading-tight sm:text-[16px]">
              {displayTitle}
            </p>
            <p
              className={cn(
                "mt-1 text-[9px] uppercase tracking-[0.2em] text-muted",
                wallpaper.videoUrl && "text-muted/80",
              )}
            >
              {getWallpaperMeta(wallpaper)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] tracking-[0.16em] text-muted",
              wallpaper.videoUrl && "text-muted/70",
            )}
          >
            {wallpaper.downloadsCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "glass-chip px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-muted sm:text-[9px]",
                wallpaper.videoUrl && "bg-white/55 text-muted",
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {wallpaper.creator ? (
          <p
            className={cn(
              "text-[11px] text-muted",
              wallpaper.videoUrl && "text-muted/80",
            )}
          >
            by @{wallpaper.creator.username}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
