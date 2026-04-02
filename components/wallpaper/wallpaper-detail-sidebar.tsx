"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import type { WallpaperFavoriteSnapshot } from "@/types/wallpaper";
import { WallpaperReportPanel } from "@/components/wallpaper/wallpaper-report-panel";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type WallpaperDetailSidebarProps = {
  canDownload: boolean;
  creatorUsername: string | null;
  height: number | null;
  identifier: string;
  initialDownloadsCount: number;
  initialIsFavorited: boolean;
  initialLikesCount: number;
  isSignedIn: boolean;
  loginHref: string;
  slug: string;
  tags: string[];
  width: number | null;
};

export function WallpaperDetailSidebar({
  canDownload,
  creatorUsername,
  height,
  identifier,
  initialDownloadsCount,
  initialIsFavorited,
  initialLikesCount,
  isSignedIn,
  loginHref,
  slug,
  tags,
  width,
}: WallpaperDetailSidebarProps) {
  const [downloadsCount, setDownloadsCount] = useState(initialDownloadsCount);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const favoritePath = `/api/wallpapers/${encodeURIComponent(identifier)}/favorite`;
  const downloadPath = `/api/wallpapers/${encodeURIComponent(identifier)}/download`;

  function handleDownloadClick() {
    setFeedback(null);
    setDownloadsCount((current) => current + 1);
  }

  async function toggleFavorite() {
    const response = await fetch(favoritePath, {
      method: "POST",
    });
    const payload = (await response.json()) as
      | ApiSuccess<WallpaperFavoriteSnapshot>
      | ApiFailure;

    if (!response.ok || !("data" in payload)) {
      throw new Error(
        "error" in payload ? payload.error : "收藏状态更新失败。",
      );
    }

    setLikesCount(payload.data.likesCount);
    setIsFavorited(payload.data.isFavorited);
  }

  function handleFavoriteClick() {
    setFeedback(null);

    if (!isSignedIn) {
      window.location.href = loginHref;
      return;
    }

    startTransition(() => {
      void toggleFavorite().catch((error: unknown) => {
        setFeedback(
          error instanceof Error ? error.message : "收藏操作失败，请稍后重试。",
        );
      });
    });
  }

  return (
    <>
      <div className="mt-8 grid gap-4 border-t border-ink/10 pt-8 text-sm text-muted">
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">slug</span>
          {slug}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">尺寸</span>
          {width && height ? `${width} × ${height}` : "未记录"}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">下载</span>
          {downloadsCount}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">收藏</span>
          {likesCount}
        </p>
        {creatorUsername ? (
          <p>
            <span className="mr-2 uppercase tracking-[0.18em] text-ink">
              创作者
            </span>
            <Link
              className="underline decoration-ink/20 underline-offset-4 transition hover:text-ink"
              href={`/creator/${creatorUsername}`}
            >
              @{creatorUsername}
            </Link>
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="border-frame border-ink/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        {canDownload ? (
          <a
            className="inline-flex border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-red"
            href={downloadPath}
            onClick={handleDownloadClick}
            rel="noreferrer"
            target="_blank"
          >
            下载原图
          </a>
        ) : null}
        <button
          className="inline-flex border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPending}
          onClick={handleFavoriteClick}
          type="button"
        >
          {isPending
            ? "处理中"
            : !isSignedIn
              ? "登录后收藏"
              : isFavorited
                ? "取消收藏"
                : "加入收藏"}
        </button>
        <Link
          className="inline-flex border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
          href="/explore"
        >
          返回探索
        </Link>
        {isSignedIn ? (
          <Link
            className="inline-flex border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
            href="/library"
          >
            查看个人库
          </Link>
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-4 text-sm text-red">{feedback}</p>
      ) : null}

      <WallpaperReportPanel
        identifier={identifier}
        isSignedIn={isSignedIn}
      />
    </>
  );
}
