import Image from "next/image";
import Link from "next/link";

import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperGradientKey,
  getWallpaperDisplayTitle,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import { cn } from "@/lib/utils";
import type { Wallpaper } from "@/types/wallpaper";
import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";

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
  const gradient = GRADIENTS[getWallpaperGradientKey(wallpaper)];
  const displayTitle = getWallpaperDisplayTitle(wallpaper);
  const visibleTags = (
    wallpaper.tags.length > 0 ? wallpaper.tags : wallpaper.aiTags
  ).slice(0, 3);

  return (
    <Link
      className={cn(
        "group relative overflow-hidden border-frame border-ink bg-paper transition duration-card hover:-translate-y-1 hover:shadow-paper",
        className,
      )}
      href={`/wallpaper/${wallpaper.slug}`}
    >
      {wallpaper.videoUrl ? (
        <div className="absolute left-3 top-3 z-10 border border-paper/20 bg-black/45 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/70 backdrop-blur-sm">
          Motion
        </div>
      ) : null}

      <div className={cn(aspectRatio, "relative border-b-frame border-ink")}>
        {previewUrl ? (
          <>
            <Image
              fill
              alt={displayTitle}
              className="object-cover object-center"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              src={previewUrl}
            />
            <div className="absolute inset-0 bg-[rgba(10,8,4,0.15)]" />
          </>
        ) : (
          <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
        )}
        {wallpaper.videoUrl ? (
          <MotionPreviewLayer videoUrl={wallpaper.videoUrl} />
        ) : null}
      </div>

      <div className="space-y-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[20px] italic leading-tight sm:text-[24px]">
              {displayTitle}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted">
              {getWallpaperMeta(wallpaper)}
            </p>
          </div>
          <span className="shrink-0 font-mono text-[11px] tracking-[0.18em] text-muted sm:text-xs sm:tracking-[0.2em]">
            {wallpaper.downloadsCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="border border-ink/15 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-muted sm:text-[10px] sm:tracking-[0.18em]"
            >
              {tag}
            </span>
          ))}
        </div>

        {wallpaper.creator ? (
          <p className="text-xs text-muted">by @{wallpaper.creator.username}</p>
        ) : null}
      </div>
    </Link>
  );
}
