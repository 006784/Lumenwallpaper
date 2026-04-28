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
        "glass-surface-soft group relative overflow-hidden transition duration-card hover:-translate-y-1",
        className,
      )}
      href={`/wallpaper/${wallpaper.slug}`}
    >
      {wallpaper.videoUrl ? (
        <div className="glass-chip absolute left-2.5 top-2.5 z-10 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em] text-ink backdrop-blur-sm">
          Motion
        </div>
      ) : null}

      <div className={cn(aspectRatio, "relative m-2.5 overflow-hidden rounded-[18px] sm:m-3")}>
        <WallpaperCoverImage
          alt={displayTitle}
          sources={coverSources}
          gradient={gradientKey}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          src={previewUrl}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(23,79,80,0.12))]" />
        {wallpaper.videoUrl ? (
          <MotionPreviewLayer videoUrl={wallpaper.videoUrl} />
        ) : null}
      </div>

      <div className="space-y-2 px-3 pb-3 pt-0.5 sm:px-4 sm:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="line-clamp-2 font-body text-[15px] font-semibold leading-tight sm:text-[16px]">
              {displayTitle}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-muted">
              {getWallpaperMeta(wallpaper)}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[10px] tracking-[0.16em] text-muted">
            {wallpaper.downloadsCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="glass-chip px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-muted sm:text-[9px]"
            >
              {tag}
            </span>
          ))}
        </div>

        {wallpaper.creator ? (
          <p className="text-[11px] text-muted">by @{wallpaper.creator.username}</p>
        ) : null}
      </div>
    </Link>
  );
}
