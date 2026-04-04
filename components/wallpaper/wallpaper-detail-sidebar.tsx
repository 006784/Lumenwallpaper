"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";

import { cn } from "@/lib/utils";
import type {
  WallpaperDownloadOption,
  WallpaperFavoriteSnapshot,
} from "@/types/wallpaper";
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

type DownloadGroupKey = "mobile" | "desktop" | "original" | "video";

const DOWNLOAD_GROUP_ORDER: DownloadGroupKey[] = [
  "mobile",
  "desktop",
  "original",
  "video",
];

const DOWNLOAD_GROUP_LABELS: Record<DownloadGroupKey, string> = {
  mobile: "手机壁纸",
  desktop: "桌面壁纸",
  original: "原图",
  video: "原视频",
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
  initialIsFavorited: boolean;
  initialLikesCount: number;
  isSignedIn: boolean;
  loginHref: string;
  slug: string;
  tags: string[];
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
  /** 0–100 while downloading, null when idle */
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloadPanelOpen, setIsDownloadPanelOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(
    () =>
      downloadOptions.find((option) => option.isDefault)?.variant ??
      downloadOptions[0]?.variant ??
      "original",
  );

  const favoritePath = `/api/wallpapers/${encodeURIComponent(identifier)}/favorite`;
  const selectedDownloadOption = useMemo(
    () =>
      downloadOptions.find((option) => option.variant === selectedVariant) ??
      downloadOptions[0] ??
      null,
    [downloadOptions, selectedVariant],
  );
  const downloadPath = useMemo(() => {
    const params = new URLSearchParams();

    if (selectedDownloadOption?.variant) {
      params.set("variant", selectedDownloadOption.variant);
    }

    const query = params.toString();

    return `/api/wallpapers/${encodeURIComponent(identifier)}/download${
      query ? `?${query}` : ""
    }`;
  }, [identifier, selectedDownloadOption]);

  const isDownloading =
    downloadProgress !== null && downloadProgress < 100;

  function formatResolution(option: WallpaperDownloadOption | null) {
    if (!option?.width || !option?.height) {
      return "尺寸未记录";
    }

    return `${option.width} × ${option.height}`;
  }

  function formatCompactResolution(option: WallpaperDownloadOption | null) {
    if (!option?.width || !option?.height) {
      return "尺寸未记录";
    }

    return `${option.width}x${option.height}`;
  }

  function getDownloadGroup(option: WallpaperDownloadOption): DownloadGroupKey {
    if (option.format?.startsWith("video/")) {
      return "video";
    }

    if (option.variant === "original") {
      return "original";
    }

    return (option.height ?? 0) > (option.width ?? 0) ? "mobile" : "desktop";
  }

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

  const groupedDownloadOptions = useMemo(() => {
    const groups = new Map<DownloadGroupKey, WallpaperDownloadOption[]>();

    for (const key of DOWNLOAD_GROUP_ORDER) {
      groups.set(key, []);
    }

    for (const option of downloadOptions) {
      groups.get(getDownloadGroup(option))?.push(option);
    }

    return DOWNLOAD_GROUP_ORDER.flatMap((key) => {
      const options = groups.get(key) ?? [];

      if (options.length === 0) {
        return [];
      }

      return [
        {
          key,
          label: DOWNLOAD_GROUP_LABELS[key],
          options,
        },
      ];
    });
  }, [downloadOptions]);

  useEffect(() => {
    if (!isDownloadPanelOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDownloadPanelOpen]);

  async function handleDownload() {
    setFeedback(null);
    setDownloadProgress(0);

    try {
      const response = await fetch(downloadPath);

      if (!response.ok || !response.body) {
        throw new Error("下载失败，请稍后重试。");
      }

      // Update download count from response header
      const countHeader = response.headers.get("X-Wallpaper-Downloads-Count");
      if (countHeader) {
        setDownloadsCount(parseInt(countHeader, 10));
      } else {
        setDownloadsCount((c) => c + 1);
      }

      // Extract filename from Content-Disposition
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch =
        disposition.match(/filename\*=UTF-8''(.+)$/i) ??
        disposition.match(/filename="?([^"]+)"?/i);
      const filename = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : "Lumen Wallpaper";

      const contentType =
        response.headers.get("Content-Type") ?? "application/octet-stream";
      const contentLengthHeader = response.headers.get("Content-Length");
      const total = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : 0;

      const reader = response.body.getReader();
      const chunks: Uint8Array<ArrayBuffer>[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100));
        }
      }

      // Trigger browser save-file dialog via Blob URL
      const blob = new Blob(chunks, { type: contentType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setTimeout(() => setDownloadProgress(null), 2000);
    } catch (error) {
      setDownloadProgress(null);
      setFeedback(
        error instanceof Error ? error.message : "下载失败，请稍后重试。",
      );
    }
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

      {(tags.length > 0 || aiTags.length > 0) ? (
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
            {downloadOptions.length > 1 ? (
              <div className="space-y-2">
                <button
                  aria-expanded={isDownloadPanelOpen}
                  className="flex w-full items-center justify-between gap-4 border border-ink bg-paper px-4 py-4 text-left transition hover:border-ink/70"
                  type="button"
                  onClick={() => setIsDownloadPanelOpen((open) => !open)}
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
                      选择大小
                    </p>
                    <p className="mt-2 text-sm text-ink">
                      {selectedDownloadOption
                        ? `${selectedDownloadOption.label} · ${formatCompactResolution(selectedDownloadOption)}`
                        : "选择一个下载尺寸"}
                    </p>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
                    {isDownloadPanelOpen ? "收起" : "展开"}
                  </span>
                </button>
                <div className="rounded-none border border-ink/10 bg-paper/70 px-4 py-3">
                  <p className="text-xs leading-6 text-muted">
                    {selectedDownloadOption
                      ? `${selectedDownloadOption.label} · ${formatResolution(selectedDownloadOption)} · ${formatFileSize(selectedDownloadOption.sizeBytes)}`
                      : "选择一个下载尺寸。"}
                  </p>
                </div>
              </div>
            ) : null}

            {!(downloadOptions.length > 1 && isDownloadPanelOpen) ? (
              <div className="relative inline-flex w-full sm:w-auto">
                <button
                  aria-label={
                    isDownloading
                      ? "正在下载"
                      : downloadProgress === 100
                        ? "下载完成"
                        : selectedDownloadOption
                          ? `下载${selectedDownloadOption.label}`
                          : "下载壁纸"
                  }
                  className={cn(
                    "relative inline-flex min-h-[48px] w-full justify-center overflow-hidden border-frame border-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition sm:min-w-[12rem] sm:w-auto",
                    isDownloading || downloadProgress === 100
                      ? "cursor-wait bg-ink"
                      : "bg-ink hover:bg-red",
                  )}
                  disabled={isDownloading}
                  type="button"
                  onClick={handleDownload}
                >
                  {isDownloading ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-0 left-0 bg-red/60 transition-[width] duration-100"
                      style={{ width: `${downloadProgress ?? 0}%` }}
                    />
                  ) : null}

                  <span className="relative z-10">
                    {isDownloading
                      ? downloadProgress === 0
                        ? "连接中…"
                        : `${downloadProgress}%`
                      : downloadProgress === 100
                        ? "↓ 完成"
                        : downloadOptions.length > 1
                          ? "下载选定大小"
                          : selectedDownloadOption
                            ? `下载${selectedDownloadOption.label}`
                            : "下载壁纸"}
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            aria-label={
              isPending
                ? "处理中"
                : !isSignedIn
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
              : !isSignedIn
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
          {isSignedIn ? (
            <Link
              className="inline-flex min-h-[48px] w-full justify-center border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper sm:w-auto"
              href="/library"
            >
              查看个人库
            </Link>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p className="mt-4 text-sm text-red">{feedback}</p>
      ) : null}

      {canDownload && downloadOptions.length > 1 && isDownloadPanelOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setIsDownloadPanelOpen(false)}
        >
          <div className="flex min-h-full items-end justify-center p-0 md:items-center md:p-6">
            <div
              className="w-full max-w-[30rem] overflow-hidden rounded-t-[2rem] border border-ink bg-paper shadow-[0_-24px_60px_rgba(10,8,4,0.18)] md:rounded-[2rem]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.26em] text-muted">
                    选择大小
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    不同尺寸对应不同画质与适用设备
                  </p>
                </div>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-sm text-muted transition hover:border-ink/30 hover:text-ink"
                  type="button"
                  onClick={() => setIsDownloadPanelOpen(false)}
                >
                  ×
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto">
                {groupedDownloadOptions.map((group) => (
                  <div key={group.key} className="border-b border-ink/10 last:border-b-0">
                    <div className="border-b border-ink/10 bg-ink/[0.03] px-5 py-3">
                      <p className="text-[10px] uppercase tracking-[0.26em] text-muted">
                        {group.label}
                      </p>
                    </div>
                    <div>
                      {group.options.map((option, index) => {
                        const isSelected = option.variant === selectedVariant;

                        return (
                          <button
                            key={`${group.key}-${option.variant}`}
                            className={cn(
                              "flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition",
                              index > 0 && "border-t border-ink/10",
                              isSelected
                                ? "bg-ink text-paper shadow-[inset_4px_0_0_0_#d8a533]"
                                : "bg-paper text-ink hover:bg-ink/5",
                            )}
                            type="button"
                            onClick={() => setSelectedVariant(option.variant)}
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-[clamp(1.2rem,2vw,1.6rem)] font-semibold tracking-[-0.03em]">
                                  {option.label}
                                </p>
                                {option.isDefault ? (
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.24em] shadow-[0_8px_20px_rgba(216,165,51,0.18)]",
                                      isSelected
                                        ? "border-[#f4d272] bg-[linear-gradient(135deg,rgba(244,210,114,0.24),rgba(216,165,51,0.12))] text-[#f4d272]"
                                        : "border-[#d8a533]/50 bg-[linear-gradient(135deg,rgba(248,231,177,0.92),rgba(228,190,92,0.9))] text-ink",
                                    )}
                                  >
                                    Recommended
                                  </span>
                                ) : null}
                              </div>
                              <p
                                className={cn(
                                  "text-sm",
                                  isSelected ? "text-paper/70" : "text-muted",
                                )}
                              >
                                {formatCompactResolution(option)}
                              </p>
                            </div>
                            <div className="flex items-start gap-3 pt-1">
                              <div
                                className={cn(
                                  "text-[10px] uppercase tracking-[0.24em]",
                                  isSelected ? "text-gold" : "text-muted",
                                )}
                              >
                                {formatFileSize(option.sizeBytes)}
                              </div>
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] transition",
                                  isSelected
                                    ? "border-gold bg-gold/10 text-gold"
                                    : "border-ink/20 text-transparent",
                                )}
                              >
                                ✓
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="safe-bottom-padding sticky bottom-0 border-t border-ink/10 bg-paper/95 px-5 pt-4 backdrop-blur">
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
                      已选尺寸
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {selectedDownloadOption
                        ? `${selectedDownloadOption.label} · ${formatCompactResolution(selectedDownloadOption)}`
                        : "选择一个下载尺寸"}
                    </p>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
                    {selectedDownloadOption
                      ? formatFileSize(selectedDownloadOption.sizeBytes)
                      : ""}
                  </p>
                </div>
                <div className="relative">
                  <button
                    aria-label={
                      isDownloading
                        ? "正在下载"
                        : downloadProgress === 100
                          ? "下载完成"
                          : selectedDownloadOption
                            ? `下载${selectedDownloadOption.label}`
                            : "下载壁纸"
                    }
                    className={cn(
                      "relative inline-flex w-full justify-center overflow-hidden rounded-[1.75rem] border border-[#52c67b] bg-[#59ca80] px-5 py-4 font-mono text-[12px] uppercase tracking-[0.2em] text-white transition",
                      isDownloading || downloadProgress === 100
                        ? "cursor-wait"
                        : "hover:brightness-95",
                    )}
                    disabled={isDownloading}
                    type="button"
                    onClick={handleDownload}
                  >
                    {isDownloading ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 bg-black/15 transition-[width] duration-100"
                        style={{ width: `${downloadProgress ?? 0}%` }}
                      />
                    ) : null}
                    <span className="relative z-10">
                      {isDownloading
                        ? downloadProgress === 0
                          ? "连接中…"
                          : `${downloadProgress}%`
                        : downloadProgress === 100
                          ? "下载完成"
                          : "下载选定大小"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <WallpaperReportPanel
        identifier={identifier}
        isSignedIn={isSignedIn}
      />
    </>
  );
}
