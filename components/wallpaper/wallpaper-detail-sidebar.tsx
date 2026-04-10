"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import { DownloadPanel } from "@/components/wallpaper/DownloadPanel";
import { WallpaperReportPanel } from "@/components/wallpaper/wallpaper-report-panel";
import { cn } from "@/lib/utils";
import type {
  WallpaperDownloadOption,
  WallpaperFavoriteSnapshot,
  WallpaperVariant,
} from "@/types/wallpaper";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type FavoriteStatePayload = WallpaperFavoriteSnapshot & {
  isSignedIn: boolean;
};

type WallpaperDetailSidebarProps = {
  aiCaption?: string | null;
  aiTags?: string[];
  canDownload: boolean;
  colors?: string[];
  creatorUsername: string | null;
  downloadOptions: WallpaperDownloadOption[];
  height: number | null;
  identifier: string;
  initialDownloadsCount: number;
  initialLikesCount: number;
  loginHref: string;
  previewUrl: string | null;
  slug: string;
  tags: string[];
  title: string;
  width: number | null;
};

export function WallpaperDetailSidebar({
  aiCaption,
  aiTags = [],
  canDownload,
  colors = [],
  creatorUsername,
  downloadOptions,
  height,
  identifier,
  initialDownloadsCount,
  initialLikesCount,
  loginHref,
  previewUrl,
  slug,
  tags,
  title,
  width,
}: WallpaperDetailSidebarProps) {
  const [downloadsCount, setDownloadsCount] = useState(initialDownloadsCount);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [didHydrateAuthState, setDidHydrateAuthState] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDownloadPanelOpen, setIsDownloadPanelOpen] = useState(false);

  const favoritePath = `/api/wallpapers/${encodeURIComponent(identifier)}/favorite`;

  function formatFileSize(sizeBytes: number | null) {
    if (!sizeBytes || sizeBytes <= 0) {
      return "大小未知";
    }

    const units = ["B", "KB", "MB", "GB"];
    let value = sizeBytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
  }

  function resolveDownloadVariant(config: {
    fmt: string;
    res: string;
    ratio: string;
  }): WallpaperVariant {
    const hasVideo = downloadOptions.some((option) =>
      option.format?.startsWith("video/"),
    );

    if (hasVideo) {
      return (
        downloadOptions.find((option) => option.variant === "original")
          ?.variant ??
        downloadOptions[0]?.variant ??
        "original"
      );
    }

    if (config.fmt === "WEBP") {
      return (
        downloadOptions.find(
          (option) =>
            option.variant === "4k" &&
            option.format?.toLowerCase().includes("webp"),
        )?.variant ??
        downloadOptions.find(
          (option) =>
            option.variant === "thumb" &&
            option.format?.toLowerCase().includes("webp"),
        )?.variant ??
        downloadOptions.find(
          (option) =>
            option.variant === "preview" &&
            option.format?.toLowerCase().includes("webp"),
        )?.variant ??
        downloadOptions.find((option) => option.variant === "4k")?.variant ??
        downloadOptions.find((option) => option.variant === "original")
          ?.variant ??
        downloadOptions[0]?.variant ??
        "original"
      );
    }

    if (
      config.res === "3840 × 2160" &&
      downloadOptions.some((option) => option.variant === "4k")
    ) {
      return "4k";
    }

    return (
      downloadOptions.find((option) => option.variant === "original")
        ?.variant ??
      downloadOptions.find((option) => option.variant === "4k")?.variant ??
      downloadOptions[0]?.variant ??
      "original"
    );
  }

  async function handleDownloadVariant(variant: WallpaperVariant) {
    setFeedback(null);

    const params = new URLSearchParams();
    params.set("variant", variant);

    const response = await fetch(
      `/api/wallpapers/${encodeURIComponent(identifier)}/download?${params.toString()}`,
    );

    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      throw new Error(payload?.error ?? "下载失败，请稍后重试。");
    }

    const countHeader = response.headers.get("X-Wallpaper-Downloads-Count");
    if (countHeader) {
      setDownloadsCount(parseInt(countHeader, 10));
    } else {
      setDownloadsCount((current) => current + 1);
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const filenameMatch =
      disposition.match(/filename\*=UTF-8''(.+)$/i) ??
      disposition.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch
      ? decodeURIComponent(filenameMatch[1])
      : "Lumen Wallpaper";

    const contentType =
      response.headers.get("Content-Type") ?? "application/octet-stream";
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        chunks.push(value);
      }
    }

    const blob = new Blob(chunks, { type: contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleDownload(config: { fmt: string; res: string; ratio: string }) {
    const variant = resolveDownloadVariant(config);

    void handleDownloadVariant(variant).catch((error: unknown) => {
      setFeedback(
        error instanceof Error ? error.message : "下载失败，请稍后重试。",
      );
    });
  }

  function handleSaveDownloadConfig(_config: {
    fmt: string;
    ratio: string;
    lockOn: boolean;
  }) {
    setFeedback("下载配置已缓存。");
  }

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadFavoriteState() {
      try {
        const response = await fetch(favoritePath, {
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as
          | ApiSuccess<FavoriteStatePayload>
          | ApiFailure;

        if (isCancelled || !("data" in payload)) {
          return;
        }

        setLikesCount(payload.data.likesCount);
        setIsFavorited(payload.data.isFavorited);
        setIsSignedIn(payload.data.isSignedIn);
      } catch {
        // Keep public counts/favorite state as a safe fallback on transient failures.
      } finally {
        if (!isCancelled) {
          setDidHydrateAuthState(true);
        }
      }
    }

    void loadFavoriteState();

    return () => {
      isCancelled = true;
    };
  }, [favoritePath]);

  async function toggleFavorite() {
    const response = await fetch(favoritePath, {
      method: "POST",
    });
    const payload = (await response.json()) as
      | ApiSuccess<WallpaperFavoriteSnapshot>
      | ApiFailure;

    if (!response.ok || !("data" in payload)) {
      const message =
        "error" in payload ? payload.error : "收藏状态更新失败。";
      const code = "code" in payload ? payload.code : "UNKNOWN_ERROR";

      throw new Error(`${code}:${message}`);
    }

    setLikesCount(payload.data.likesCount);
    setIsFavorited(payload.data.isFavorited);
    setIsSignedIn(true);
  }

  function handleFavoriteClick() {
    setFeedback(null);

    startTransition(() => {
      void toggleFavorite().catch((error: unknown) => {
        if (error instanceof Error && error.message.startsWith("AUTH_REQUIRED:")) {
          window.location.href = loginHref;
          return;
        }

        setFeedback(
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:/, "")
            : "收藏操作失败，请稍后重试。",
        );
      });
    });
  }

  return (
    <>
      <div className="mt-8 grid gap-3 border-t border-ink/10 pt-8 text-sm text-muted sm:grid-cols-2">
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
              className="underline decoration-ink/40 underline-offset-4 transition hover:text-ink hover:decoration-ink focus-visible:outline-none focus-visible:decoration-ink"
              href={`/creator/${creatorUsername}`}
            >
              @{creatorUsername}
            </Link>
          </p>
        ) : null}
      </div>

      {tags.length > 0 || aiTags.length > 0 ? (
        <div className="mt-8 space-y-3">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  className="border-frame border-ink/20 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:border-ink focus-visible:text-ink"
                  href={`/explore?tag=${encodeURIComponent(tag)}`}
                >
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}
          {aiTags.length > 0 ? (
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-muted/50">
                AI 识别
              </p>
              <div className="flex flex-wrap gap-2">
                {aiTags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    className="border border-ink/10 bg-paper/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted/70 transition hover:border-ink/30 hover:text-muted focus-visible:outline-none focus-visible:border-ink/40"
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {colors.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-[9px] uppercase tracking-[0.3em] text-muted/50">
            主色调
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.slice(0, 8).map((color) => {
              const hex = color.startsWith("#") ? color : `#${color}`;
              return (
                <div
                  key={color}
                  className="flex items-center gap-2 border border-ink/10 bg-paper/60 px-2.5 py-1.5"
                  title={hex}
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink/12"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted/70">
                    {hex.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {aiCaption ? (
        <div className="mt-6 border border-ink/8 bg-paper/40 px-4 py-4">
          <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-muted/50">
            AI 描述
          </p>
          <p className="text-sm leading-6 text-muted/80">{aiCaption}</p>
        </div>
      ) : null}

      <div className="mt-10 space-y-4">
        {canDownload ? (
          <div className="space-y-3 border border-ink/10 bg-paper/55 p-4 sm:p-5">
            <div className="rounded-none border border-ink/10 bg-paper/70 px-4 py-3">
              <p className="text-xs leading-6 text-muted">
                进入暗房导出面板后，可切换原图、4K 与 WebP，选择裁切比例并缓存常用下载配置。
              </p>
            </div>
            <button
              data-download-ready={isClientReady ? "true" : "false"}
              className="inline-flex min-h-[48px] w-full justify-center border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-red"
              type="button"
              onClick={() => {
                setFeedback(null);
                setIsDownloadPanelOpen(true);
              }}
            >
              打开下载配置
            </button>
            {downloadOptions.length > 0 ? (
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                当前可下载 {downloadOptions.length} 档 · 最高{" "}
                {downloadOptions.find((option) => option.variant === "4k")
                  ? "4K"
                  : downloadOptions.some((option) => option.variant === "original")
                    ? "原图"
                    : formatFileSize(downloadOptions[0]?.sizeBytes ?? null)}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            aria-label={
              isPending
                ? "处理中"
                : didHydrateAuthState && !isSignedIn
                  ? "登录后收藏"
                  : isFavorited
                    ? "取消收藏"
                    : "加入收藏"
            }
            className={cn(
              "inline-flex min-h-[48px] w-full justify-center border-frame px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none sm:w-auto",
              isFavorited && !isPending
                ? "border-gold bg-gold/10 text-ink hover:bg-gold/20"
                : "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper",
            )}
            disabled={isPending}
            onClick={handleFavoriteClick}
            type="button"
          >
            {isPending
              ? "处理中"
              : didHydrateAuthState && !isSignedIn
                ? "登录后收藏"
                : isFavorited
                  ? "♥ 已收藏"
                  : "加入收藏"}
          </button>
          <Link
            className="inline-flex min-h-[48px] w-full justify-center border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper sm:w-auto"
            href="/explore"
          >
            返回探索
          </Link>
          {didHydrateAuthState && isSignedIn ? (
            <Link
              className="inline-flex min-h-[48px] w-full justify-center border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper sm:w-auto"
              href="/library"
            >
              查看个人库
            </Link>
          ) : null}
        </div>
      </div>

      {feedback ? <p className="mt-4 text-sm text-red">{feedback}</p> : null}

      {canDownload && isDownloadPanelOpen ? (
        <DownloadPanel
          wallpaper={{
            id: identifier,
            title,
            width: width ?? 2358,
            height: height ?? 1538,
            previewUrl: previewUrl ?? "",
          }}
          onClose={() => setIsDownloadPanelOpen(false)}
          onDownload={handleDownload}
          onSaveConfig={handleSaveDownloadConfig}
        />
      ) : null}

      <WallpaperReportPanel
        identifier={identifier}
        isSignedIn={didHydrateAuthState && isSignedIn}
      />
    </>
  );
}
