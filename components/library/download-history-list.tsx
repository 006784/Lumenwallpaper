import Link from "next/link";

import {
  getWallpaperDisplayTitle,
  getWallpaperGradientKey,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import { GRADIENTS } from "@/lib/gradients";
import type { DownloadHistoryItem } from "@/types/library";

type DownloadHistoryListProps = {
  items: DownloadHistoryItem[];
};

function formatDownloadedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DownloadHistoryList({ items }: DownloadHistoryListProps) {
  return (
    <div className="grid gap-4">
      {items.map((item) => {
        const previewUrl = getWallpaperPreviewUrl(item.wallpaper);
        const displayTitle = getWallpaperDisplayTitle(item.wallpaper);
        const artworkStyle = previewUrl
          ? {
              backgroundImage: `linear-gradient(to top, rgba(10,8,4,0.08), rgba(10,8,4,0.08)), url("${previewUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : {
              backgroundImage: GRADIENTS[getWallpaperGradientKey(item.wallpaper)],
            };

        return (
          <Link
            key={item.id}
            className="glass-surface-soft group grid gap-4 p-4 transition duration-card hover:-translate-y-0.5 md:grid-cols-[120px_1fr]"
            href={`/wallpaper/${item.wallpaper.slug}`}
          >
            <div
              className="aspect-[3/4] rounded-[20px]"
              style={artworkStyle}
            />

            <div className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-body text-[24px] font-semibold leading-none text-ink">
                    {displayTitle}
                  </p>
                  <span className="glass-chip px-3 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                    {item.variant ?? "original"}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {item.wallpaper.description ?? "已记录下载时间，可随时返回详情页再次获取原图。"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                <span>{getWallpaperMeta(item.wallpaper)}</span>
                <span className="h-px w-8 bg-ink/10" />
                <span>{formatDownloadedAt(item.downloadedAt)}</span>
                {item.wallpaper.creator ? (
                  <>
                    <span className="h-px w-8 bg-ink/10" />
                    <span>@{item.wallpaper.creator.username}</span>
                  </>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
