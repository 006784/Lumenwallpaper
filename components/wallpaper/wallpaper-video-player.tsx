"use client";

import { useRef, useState } from "react";

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
    <div className="group relative overflow-hidden border-frame border-ink bg-ink">
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

      {/* CRT 扫描线 */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-[0.04]" />

      {/* 悬停控制栏 */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 bg-gradient-to-t from-black/90 to-transparent px-5 pb-5 pt-14 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="mr-auto text-[9px] uppercase tracking-[0.3em] text-paper/50">
          {title} · 动态壁纸
        </p>

        {/* 静音切换 */}
        <button
          aria-label={muted ? "取消静音" : "静音"}
          className="flex h-8 w-8 items-center justify-center border border-paper/20 text-[11px] text-paper/60 backdrop-blur-sm transition hover:border-paper/50 hover:text-paper"
          type="button"
          onClick={toggleMute}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        {/* 播放/暂停 */}
        <button
          aria-label={paused ? "继续播放" : "暂停"}
          className="flex h-8 w-8 items-center justify-center border border-paper/20 text-[10px] text-paper/60 backdrop-blur-sm transition hover:border-paper/50 hover:text-paper"
          type="button"
          onClick={togglePause}
        >
          {paused ? "▶" : "⏸"}
        </button>
      </div>

      {/* 动态标识 */}
      <div className="absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 border border-paper/20 bg-black/50 px-2 py-1 backdrop-blur-sm">
        <span className="live-dot inline-block h-[5px] w-[5px] rounded-full bg-gold" />
        <span className="font-mono text-[8px] uppercase tracking-[0.28em] text-paper/60">
          Live
        </span>
      </div>
    </div>
  );
}
