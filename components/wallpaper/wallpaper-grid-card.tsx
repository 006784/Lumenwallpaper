import Link from "next/link";

import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperGradientKey,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { Wallpaper } from "@/types/wallpaper";

type WallpaperGridCardProps = {
  wallpaper: Wallpaper;
};

export function WallpaperGridCard({ wallpaper }: WallpaperGridCardProps) {
  const previewUrl = getWallpaperPreviewUrl(wallpaper);
  const gradient = GRADIENTS[getWallpaperGradientKey(wallpaper)];
  const visibleTags = (
    wallpaper.tags.length > 0 ? wallpaper.tags : wallpaper.aiTags
  ).slice(0, 3);
  const artworkStyle = previewUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(10,8,4,0.15), rgba(10,8,4,0.15)), url("${previewUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: gradient,
      };

  return (
    <Link
      className="group overflow-hidden border-frame border-ink bg-paper transition duration-card hover:-translate-y-1 hover:shadow-paper"
      href={`/wallpaper/${wallpaper.slug}`}
    >
      <div
        className="aspect-[4/5] border-b-frame border-ink"
        style={artworkStyle}
      />

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-[24px] italic leading-tight">
              {wallpaper.title}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-muted">
              {getWallpaperMeta(wallpaper)}
            </p>
          </div>
          <span className="font-mono text-xs tracking-[0.2em] text-muted">
            {wallpaper.downloadsCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="border border-ink/15 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-muted"
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
