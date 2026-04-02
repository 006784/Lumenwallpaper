"use client";

import { useCallback, useRef, useState } from "react";

import { GRADIENTS } from "@/lib/gradients";
import { heroFilmRows } from "@/lib/data/home";
import type { FilmCellData } from "@/types/home";

// ─── 齿孔装饰 ────────────────────────────────────────────────────────────────

function SprocketColumn({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 ${side}-0 z-10 flex w-5 flex-col justify-around px-[6px] py-3`}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-3 w-2 rounded-[2px] border border-paper/20"
        />
      ))}
    </div>
  );
}

// ─── 单个动画格子 ─────────────────────────────────────────────────────────────

function AnimatedCell({
  cell,
  animIndex,
  paused,
  onPlay,
}: {
  cell: FilmCellData;
  animIndex: number;
  paused: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      aria-label={`播放动态壁纸：${cell.label}`}
      className="group relative min-w-0 flex-1 cursor-pointer overflow-hidden border-r border-white/10 last:border-r-0"
      type="button"
      onClick={onPlay}
    >
      {/* 渐变背景 + 呼吸动画 */}
      <div
        className={paused ? "cell-breathe-paused absolute inset-0" : "cell-breathe absolute inset-0"}
        style={{
          backgroundImage: GRADIENTS[cell.gradient],
          animationDelay: `${animIndex * 0.72}s`,
        }}
      />

      {/* hover 亮色遮罩 */}
      <div className="absolute inset-0 bg-paper/0 transition-colors duration-200 group-hover:bg-paper/8" />

      {/* hover 播放图标 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/40 bg-black/40 text-[10px] text-paper backdrop-blur-sm">
          ▶
        </div>
      </div>

      {/* 格子标签 */}
      <div className="absolute bottom-2 left-2 translate-y-1 text-[8px] uppercase tracking-[0.28em] text-paper/50 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {cell.label}
      </div>
    </button>
  );
}

// ─── 播放模式主视图 ────────────────────────────────────────────────────────────

function FeaturedView({
  cell,
  paused,
  onTogglePause,
  onBack,
}: {
  cell: FilmCellData;
  paused: boolean;
  onTogglePause: () => void;
  onBack: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  function handleTogglePause() {
    if (cell.videoUrl && videoRef.current) {
      if (paused) videoRef.current.play().catch(() => {});
      else videoRef.current.pause();
    }
    onTogglePause();
  }

  return (
    <div className="absolute inset-0">
      {cell.videoUrl ? (
        /* 视频壁纸 */
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          src={cell.videoUrl}
        />
      ) : (
        /* 动态渐变壁纸 */
        <div
          className={paused ? "featured-breathe-paused absolute inset-0" : "featured-breathe absolute inset-0"}
          style={{ backgroundImage: GRADIENTS[cell.gradient] }}
        />
      )}

      {/* 扫描线覆盖层 */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10 opacity-[0.035]" />

      {/* 色调蒙版 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/10 to-transparent" />

      {/* 底部控制栏 */}
      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-7 pb-7 pt-20">
        <p className="mb-1 text-[9px] uppercase tracking-[0.35em] text-paper/45">
          动态壁纸 · 实时预览
        </p>
        <p className="font-display text-[26px] italic text-paper">{cell.label}</p>

        <div className="mt-4 flex items-center gap-3">
          {/* 播放/暂停 */}
          <button
            aria-label={paused ? "继续播放" : "暂停"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-paper/30 text-[10px] text-paper/70 backdrop-blur-sm transition hover:border-paper/60 hover:text-paper"
            type="button"
            onClick={handleTogglePause}
          >
            {paused ? "▶" : "⏸"}
          </button>

          {/* 下载按钮 */}
          <button
            className="flex h-9 items-center gap-2 border border-paper/20 bg-paper/10 px-4 text-[9px] uppercase tracking-[0.22em] text-paper/70 backdrop-blur-sm transition hover:bg-paper/20 hover:text-paper"
            type="button"
          >
            ↓ 下载 4K
          </button>

          {/* 返回胶卷 */}
          <button
            aria-label="返回胶卷视图"
            className="ml-auto flex h-9 items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-paper/40 transition hover:text-paper/70"
            type="button"
            onClick={onBack}
          >
            ← 胶卷
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function HeroFilmPanel() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);

  // 把二维 rows 压平成一维，保留对 cell 数据的访问
  const allCells = heroFilmRows.flatMap((row) => row);
  const activeCell: FilmCellData | null =
    activeIndex !== null ? allCells[activeIndex] : null;

  const handlePlay = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(false);
  }, []);

  const handleBack = useCallback(() => {
    setActiveIndex(null);
    setPaused(false);
  }, []);

  const handleTogglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  return (
    <div className="relative min-h-[300px] overflow-hidden bg-ink md:min-h-full">
      {/* 胶卷齿孔 */}
      <SprocketColumn side="left" />
      <SprocketColumn side="right" />

      {/* 顶部元信息 */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-7 pt-5">
        <p className="text-[9px] uppercase tracking-[0.35em] text-paper/45">
          {activeCell ? "正在播放" : "Contact Sheet"}
        </p>
        <div className="flex items-center gap-2">
          {activeCell ? (
            /* 播放状态指示 */
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-paper/30">
              <span
                className={`h-[5px] w-[5px] rounded-full ${paused ? "bg-paper/30" : "live-dot bg-gold"}`}
              />
              {paused ? "已暂停" : "LIVE"}
            </span>
          ) : (
            <>
              {/* 格子模式的播放/暂停 */}
              <button
                aria-label={paused ? "恢复动画" : "暂停动画"}
                className="flex h-6 w-6 items-center justify-center text-[8px] text-paper/30 transition hover:text-paper/60"
                type="button"
                onClick={handleTogglePause}
              >
                {paused ? "▶" : "⏸"}
              </button>
              <p className="font-mono text-[11px] tracking-[0.24em] text-paper/30">
                09 Frames
              </p>
            </>
          )}
        </div>
      </div>

      {/* 内容区：格子 or 播放模式 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: activeCell ? 0 : 1, pointerEvents: activeCell ? "none" : "auto" }}
      >
        {/* 3×3 动画格子网格 */}
        <div className="absolute inset-0 flex flex-col">
          {heroFilmRows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="flex flex-1 overflow-hidden border-b border-paper/10 last:border-b-0"
            >
              {row.map((cell, cellIndex) => (
                <AnimatedCell
                  key={cell.label}
                  animIndex={rowIndex * 3 + cellIndex}
                  cell={cell}
                  paused={paused}
                  onPlay={() => handlePlay(rowIndex * 3 + cellIndex)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 播放模式 */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: activeCell ? 1 : 0, pointerEvents: activeCell ? "auto" : "none" }}
      >
        {activeCell && (
          <FeaturedView
            cell={activeCell}
            paused={paused}
            onBack={handleBack}
            onTogglePause={handleTogglePause}
          />
        )}
      </div>

      {/* 格子模式底部信息 */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-7 pb-7 pt-16 transition-opacity duration-500"
        style={{ opacity: activeCell ? 0 : 1 }}
      >
        <p className="font-display text-[28px] italic text-paper">本周最受欢迎</p>
        <p className="mt-2 text-[9px] uppercase tracking-[0.35em] text-gold">
          共 2,847 次下载
        </p>
      </div>
    </div>
  );
}
