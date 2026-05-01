"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type WallpaperVideoPlayerProps = {
  posterUrl?: string | null;
  videoUrl: string;
  title: string;
};

export function WallpaperVideoPlayer({
  posterUrl,
  videoUrl,
  title,
}: WallpaperVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  function togglePause() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  return (
    <div className="glass-surface group relative overflow-hidden p-3 lg:sticky lg:top-24">
      <div className="relative overflow-hidden rounded-[26px] bg-ink">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="aspect-[4/5] w-full object-cover"
          poster={posterUrl ?? undefined}
          src={videoUrl}
        />

        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.08)_44%,rgba(0,0,0,0.68))]" />

        <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-paper/20 bg-black/34 px-3 py-1.5 backdrop-blur-md">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              paused ? "bg-paper/35" : "live-dot bg-red",
            )}
          />
          <span className="font-mono text-[8px] uppercase tracking-[0.26em] text-paper/66">
            {paused ? "Paused" : "Live"}
          </span>
        </div>

        <div className="absolute right-4 top-4 z-20 rounded-full border border-paper/20 bg-black/28 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.24em] text-paper/52 backdrop-blur-md">
          Loop
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/88 via-black/48 to-transparent px-4 pb-4 pt-20 opacity-100 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100">
          <p className="mb-3 line-clamp-1 text-[9px] uppercase tracking-[0.28em] text-paper/48">
            {title} · Motion wallpaper
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              aria-label={paused ? "继续播放" : "暂停"}
              className="rounded-full border border-paper/22 bg-paper/8 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/72 backdrop-blur-md transition hover:border-paper/45 hover:text-paper"
              type="button"
              onClick={togglePause}
            >
              {paused ? "Play" : "Pause"}
            </button>
            <button
              aria-label={muted ? "取消静音" : "静音"}
              className="rounded-full border border-paper/22 bg-paper/8 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-paper/72 backdrop-blur-md transition hover:border-paper/45 hover:text-paper"
              type="button"
              onClick={toggleMute}
            >
              {muted ? "Muted" : "Sound"}
            </button>
            <span className="ml-auto hidden h-px min-w-[80px] flex-1 bg-paper/18 sm:block" />
          </div>
        </div>
      </div>
    </div>
  );
}
