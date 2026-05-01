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
        "glass-surface-soft group relative h-fit self-start overflow-hidden text-ink transition duration-card hover:-translate-y-1",
        wallpaper.videoUrl &&
          "bg-[linear-gradient(180deg,rgba(13,18,18,0.96),rgba(23,34,34,0.9))] text-paper shadow-[0_22px_54px_rgba(8,16,18,0.22)]",
        className,
      )}
      href={`/wallpaper/${wallpaper.slug}`}
    >
      {wallpaper.videoUrl ? (
        <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-black/36 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-paper/80 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-red shadow-[0_0_10px_rgba(190,74,54,0.85)]" />
          Live
        </div>
      ) : null}

      <div
        className={cn(
          aspectRatio,
          "relative m-2.5 overflow-hidden rounded-[18px] sm:m-3",
          wallpaper.videoUrl && "rounded-[22px]",
        )}
      >
        <WallpaperCoverImage
          alt={displayTitle}
          sources={coverSources}
          gradient={gradientKey}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          src={previewUrl}
        />
        <div
          className={
            wallpaper.videoUrl
              ? "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(8,10,10,0.08)_42%,rgba(0,0,0,0.48))]"
              : "absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(23,79,80,0.12))]"
          }
        />
        {wallpaper.videoUrl ? (
          <MotionPreviewLayer videoUrl={wallpaper.videoUrl} />
        ) : null}
        {wallpaper.videoUrl ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-3 pb-3">
            <div className="h-px flex-1 bg-paper/20" />
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-paper/70">
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
                wallpaper.videoUrl && "text-paper/42",
              )}
            >
              {getWallpaperMeta(wallpaper)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] tracking-[0.16em] text-muted",
              wallpaper.videoUrl && "text-paper/48",
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
                wallpaper.videoUrl &&
                  "border-paper/14 bg-paper/8 text-paper/56",
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
              wallpaper.videoUrl && "text-paper/42",
            )}
          >
            by @{wallpaper.creator.username}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
