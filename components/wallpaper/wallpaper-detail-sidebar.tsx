"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  DownloadPanel,
  type DownloadPanelConfig,
  type DownloadProgressCallback,
} from "@/components/wallpaper/DownloadPanel";
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

  function resolveDownloadVariant(
    config: DownloadPanelConfig,
  ): WallpaperVariant {
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

    if (config.formatKey === "webp" || config.fmt === "WEBP") {
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

    if (config.formatKey === "4k") {
      return (
        downloadOptions.find((option) => option.variant === "4k")?.variant ??
        downloadOptions.find((option) => option.variant === "original")
          ?.variant ??
        downloadOptions[0]?.variant ??
        "original"
      );
    }

    if (config.formatKey === "original") {
      return (
        downloadOptions.find((option) => option.variant === "original")
          ?.variant ??
        downloadOptions.find((option) => option.variant === "4k")?.variant ??
        downloadOptions[0]?.variant ??
        "original"
      );
    }

    return (
      downloadOptions.find((option) => option.variant === "original")
        ?.variant ??
      downloadOptions.find((option) => option.variant === "4k")?.variant ??
      downloadOptions[0]?.variant ??
      "original"
    );
  }

  async function handleDownloadVariant(
    variant: WallpaperVariant,
    config: DownloadPanelConfig,
    onProgress: DownloadProgressCallback,
  ) {
    setFeedback(null);

    const outputResolution =
      config.outputWidth > 0 && config.outputHeight > 0
        ? `${Math.round(config.outputWidth)} × ${Math.round(config.outputHeight)}`
        : config.res;

    const params = new URLSearchParams();
    params.set("variant", variant);
    params.set("format", config.fmt.toLowerCase());
    params.set("ratio", config.ratio);
    params.set("resolution", outputResolution);

    const response = await fetch(
      `/api/wallpapers/${encodeURIComponent(identifier)}/download?${params.toString()}`,
    );

    if (!response.ok || !response.body) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

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
    const contentLength = Number.parseInt(
      response.headers.get("Content-Length") ?? "0",
      10,
    );
    const reader = response.body.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value) {
        chunks.push(value);
        receivedBytes += value.byteLength;
        onProgress({
          loaded: receivedBytes,
          percent:
            contentLength > 0
              ? Math.round((receivedBytes / contentLength) * 100)
              : null,
          total: contentLength > 0 ? contentLength : null,
        });
      }
    }

    onProgress({
      loaded: contentLength > 0 ? contentLength : receivedBytes,
      percent: 100,
      total: contentLength > 0 ? contentLength : null,
    });

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

  async function handleDownload(
    config: DownloadPanelConfig,
    onProgress: DownloadProgressCallback,
  ) {
    const variant = resolveDownloadVariant(config);

    await handleDownloadVariant(variant, config, onProgress);
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
      const message = "error" in payload ? payload.error : "收藏状态更新失败。";
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
        if (
          error instanceof Error &&
          error.message.startsWith("AUTH_REQUIRED:")
        ) {
          window.location.href = loginHref;
          return;
        }

        if (
          error instanceof Error &&
          error.message.startsWith("AUTH_NOT_CONFIGURED:")
        ) {
          setFeedback("本地认证尚未配置，收藏功能需要先接入登录环境。");
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
      <div className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">
            slug
          </span>
          {slug}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">
            尺寸
          </span>
          {width && height ? `${width} × ${height}` : "未记录"}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">
            下载
          </span>
          {downloadsCount}
        </p>
        <p>
          <span className="mr-2 uppercase tracking-[0.18em] text-ink">
            收藏
          </span>
          {likesCount}
        </p>
        {creatorUsername ? (
          <p>
            <span className="mr-2 uppercase tracking-[0.18em] text-ink">
              创作者
            </span>
            <Link
              className="underline decoration-ink/40 underline-offset-4 transition hover:text-ink hover:decoration-ink focus-visible:decoration-ink focus-visible:outline-none"
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
                  className="glass-chip px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:text-ink focus-visible:text-ink focus-visible:outline-none"
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
                    className="glass-chip px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted/70 transition hover:text-muted focus-visible:outline-none"
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
                  className="glass-chip flex items-center gap-2 px-2.5 py-1.5"
                  title={hex}
                >
                  <span
                    className="border-ink/12 h-3.5 w-3.5 shrink-0 rounded-full border"
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
        <div className="glass-surface-soft mt-6 px-4 py-4">
          <p className="mb-2 text-[9px] uppercase tracking-[0.3em] text-muted/50">
            AI 描述
          </p>
          <p className="text-sm leading-6 text-muted/80">{aiCaption}</p>
        </div>
      ) : null}

      <div className="mt-10 space-y-4">
        {canDownload ? (
          <div className="glass-surface-soft space-y-3 p-4 sm:p-5">
            <div className="rounded-[18px] bg-white/45 px-4 py-3 shadow-[inset_4px_4px_10px_rgba(37,58,62,0.08),inset_-4px_-4px_10px_rgba(255,255,255,0.86)]">
              <p className="text-xs leading-6 text-muted">
                进入暗房导出面板后，可切换原图、4K 与
                WebP，选择裁切比例并缓存常用下载配置。
              </p>
            </div>
            <button
              data-download-ready={isClientReady ? "true" : "false"}
              className="glass-primary inline-flex min-h-[48px] w-full justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em]"
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
                  : downloadOptions.some(
                        (option) => option.variant === "original",
                      )
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
              "inline-flex min-h-[48px] w-full justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
              isFavorited && !isPending
                ? "glass-chip-active"
                : "glass-control text-ink",
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
            className="glass-control inline-flex min-h-[48px] w-full justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition sm:w-auto"
            href="/explore"
          >
            返回探索
          </Link>
          {didHydrateAuthState && isSignedIn ? (
            <Link
              className="glass-control inline-flex min-h-[48px] w-full justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition sm:w-auto"
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
