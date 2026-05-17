"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  DownloadPanel,
  type DownloadPanelConfig,
  type DownloadProgressCallback,
} from "@/components/wallpaper/DownloadPanel";
import { WallpaperReportPanel } from "@/components/wallpaper/wallpaper-report-panel";
import { translateStaticTerm } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { SupportedLocale } from "@/types/i18n";
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
  locale: SupportedLocale;
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
  locale,
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
  const labels =
    locale === "zh-CN"
      ? {
          aiCaption: "AI 描述",
          aiDetected: "AI 识别",
          authMissing: "本地认证尚未配置，收藏功能需要先接入登录环境。",
          backExplore: "返回探索",
          colors: "主色调",
          creator: "创作者",
          dimensions: "尺寸",
          download: "下载",
          downloadConfig: "打开下载配置",
          downloadFailed: "下载失败，请稍后重试。",
          downloadHint:
            "进入暗房导出面板后，可切换原图、4K 与 WebP，选择裁切比例并缓存常用下载配置。",
          favorite: "加入收藏",
          favoriteFailed: "收藏操作失败，请稍后重试。",
          favorited: "♥ 已收藏",
          favorites: "收藏",
          fileSizeUnknown: "大小未知",
          library: "查看个人库",
          loginToFavorite: "登录后收藏",
          original: "原图",
          processing: "处理中",
          saveConfig: "下载配置已缓存。",
          tiers: (count: number, best: string) =>
            `当前可下载 ${count} 档 · 最高 ${best}`,
          unrecorded: "未记录",
          unfavorite: "取消收藏",
        }
      : locale === "ja"
        ? {
            aiCaption: "AI 説明",
            aiDetected: "AI 認識",
            authMissing:
              "ローカル認証が未設定です。お気に入り機能にはログイン環境が必要です。",
            backExplore: "探索に戻る",
            colors: "主な色",
            creator: "クリエイター",
            dimensions: "サイズ",
            download: "ダウンロード",
            downloadConfig: "ダウンロード設定を開く",
            downloadFailed:
              "ダウンロードに失敗しました。後でもう一度お試しください。",
            downloadHint:
              "暗室エクスポートパネルで原画、4K、WebP を切り替え、切り抜き比率とよく使う設定を保存できます。",
            favorite: "お気に入りに追加",
            favoriteFailed:
              "お気に入りの更新に失敗しました。後でもう一度お試しください。",
            favorited: "♥ お気に入り済み",
            favorites: "お気に入り",
            fileSizeUnknown: "サイズ不明",
            library: "ライブラリを見る",
            loginToFavorite: "ログインして保存",
            original: "原画",
            processing: "処理中",
            saveConfig: "ダウンロード設定を保存しました。",
            tiers: (count: number, best: string) =>
              `ダウンロード ${count} 種 · 最高 ${best}`,
            unrecorded: "未記録",
            unfavorite: "お気に入り解除",
          }
        : locale === "ko"
          ? {
              aiCaption: "AI 설명",
              aiDetected: "AI 인식",
              authMissing:
                "로컬 인증이 아직 설정되지 않았습니다. 즐겨찾기 기능에는 로그인 환경이 필요합니다.",
              backExplore: "탐색으로 돌아가기",
              colors: "주요 색상",
              creator: "크리에이터",
              dimensions: "크기",
              download: "다운로드",
              downloadConfig: "다운로드 설정 열기",
              downloadFailed:
                "다운로드에 실패했습니다. 잠시 후 다시 시도하세요.",
              downloadHint:
                "다크룸 내보내기 패널에서 원본, 4K, WebP를 전환하고 자르기 비율과 자주 쓰는 설정을 저장할 수 있습니다.",
              favorite: "즐겨찾기에 추가",
              favoriteFailed:
                "즐겨찾기 상태를 업데이트하지 못했습니다. 잠시 후 다시 시도하세요.",
              favorited: "♥ 즐겨찾기됨",
              favorites: "즐겨찾기",
              fileSizeUnknown: "크기 알 수 없음",
              library: "라이브러리 보기",
              loginToFavorite: "로그인 후 저장",
              original: "원본",
              processing: "처리 중",
              saveConfig: "다운로드 설정을 저장했습니다.",
              tiers: (count: number, best: string) =>
                `다운로드 ${count}개 · 최고 ${best}`,
              unrecorded: "기록 없음",
              unfavorite: "즐겨찾기 해제",
            }
          : {
              aiCaption: "AI description",
              aiDetected: "AI detected",
              authMissing:
                "Local auth is not configured yet. Favorites require a login environment.",
              backExplore: "Back to Explore",
              colors: "Primary colors",
              creator: "Creator",
              dimensions: "Size",
              download: "Downloads",
              downloadConfig: "Open download settings",
              downloadFailed: "Download failed. Please try again later.",
              downloadHint:
                "Use the darkroom export panel to switch between original, 4K, and WebP, choose crop ratios, and save common download settings.",
              favorite: "Add to favorites",
              favoriteFailed: "Favorite update failed. Please try again later.",
              favorited: "♥ Favorited",
              favorites: "Favorites",
              fileSizeUnknown: "Unknown size",
              library: "View library",
              loginToFavorite: "Log in to save",
              original: "Original",
              processing: "Processing",
              saveConfig: "Download settings saved.",
              tiers: (count: number, best: string) =>
                `${count} download tiers · best ${best}`,
              unrecorded: "Not recorded",
              unfavorite: "Remove favorite",
            };

  const favoritePath = `/api/wallpapers/${encodeURIComponent(identifier)}/favorite`;

  function formatFileSize(sizeBytes: number | null) {
    if (!sizeBytes || sizeBytes <= 0) {
      return labels.fileSizeUnknown;
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

      throw new Error(payload?.error ?? labels.downloadFailed);
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
    setFeedback(labels.saveConfig);
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
        "error" in payload ? payload.error : labels.favoriteFailed;
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
          setFeedback(labels.authMissing);
          return;
        }

        setFeedback(
          error instanceof Error
            ? error.message.replace(/^[A-Z_]+:/, "")
            : labels.favoriteFailed,
        );
      });
    });
  }

  return (
    <>
      {/* 元数据表格 */}
      <div className="mt-8 divide-y divide-ink/6 rounded-[16px] border border-ink/8 dark:divide-paper/8 dark:border-paper/10">
        {[
          ["slug", slug],
          [labels.dimensions, width && height ? `${width} × ${height}` : labels.unrecorded],
          [labels.download, String(downloadsCount)],
          [labels.favorites, String(likesCount)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-muted/60">
              {label}
            </span>
            <span className="truncate text-right text-[13px] font-medium text-ink">
              {value}
            </span>
          </div>
        ))}
        {creatorUsername ? (
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.22em] text-muted/60">
              {labels.creator}
            </span>
            <Link
              className="text-[13px] font-medium text-ink underline decoration-ink/30 underline-offset-4 transition hover:text-red hover:decoration-red/30 focus-visible:outline-none"
              href={`/creator/${creatorUsername}`}
            >
              @{creatorUsername}
            </Link>
          </div>
        ) : null}
      </div>

      {/* 标签 */}
      {tags.length > 0 || aiTags.length > 0 ? (
        <div className="mt-7 space-y-4">
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  className="rounded-full border border-ink/10 bg-white/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:border-red/20 hover:text-red dark:border-paper/10 dark:bg-paper/6 focus-visible:outline-none"
                  href={`/explore?tag=${encodeURIComponent(tag)}`}
                >
                  {translateStaticTerm(tag, locale)}
                </Link>
              ))}
            </div>
          ) : null}
          {aiTags.length > 0 ? (
            <div>
              <p className="mb-2 text-[9px] uppercase tracking-[0.32em] text-muted/40">
                {labels.aiDetected}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aiTags.slice(0, 8).map((tag) => (
                  <Link
                    key={tag}
                    className="rounded-full border border-ink/6 bg-white/35 px-3 py-1 text-[9px] uppercase tracking-[0.18em] text-muted/60 transition hover:border-red/15 hover:text-muted dark:border-paper/8 dark:bg-paper/4 focus-visible:outline-none"
                    href={`/explore?tag=${encodeURIComponent(tag)}`}
                  >
                    {translateStaticTerm(tag, locale)}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 色彩 */}
      {colors.length > 0 ? (
        <div className="mt-6">
          <p className="mb-3 text-[9px] uppercase tracking-[0.32em] text-muted/40">
            {labels.colors}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {colors.slice(0, 8).map((color) => {
              const hex = color.startsWith("#") ? color : `#${color}`;
              return (
                <div
                  key={color}
                  className="flex items-center gap-2 rounded-full border border-ink/8 bg-white/55 px-2.5 py-1.5 dark:border-paper/10 dark:bg-paper/5"
                  title={hex}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-ink/10 dark:border-paper/10"
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

      {/* AI 描述 */}
      {aiCaption ? (
        <div className="mt-6 rounded-[14px] border border-ink/6 bg-white/40 px-4 py-4 dark:border-paper/8 dark:bg-paper/4">
          <p className="mb-2 text-[9px] uppercase tracking-[0.32em] text-muted/40">
            {labels.aiCaption}
          </p>
          <p className="text-[13px] leading-7 text-muted/80">{aiCaption}</p>
        </div>
      ) : null}

      {/* 下载 + 操作 */}
      <div className="mt-10 space-y-3">
        {canDownload ? (
          <div className="space-y-2.5 rounded-[20px] border border-ink/8 bg-white/55 p-4 dark:border-paper/10 dark:bg-paper/6">
            <p className="text-[12px] leading-6 text-muted/75">
              {labels.downloadHint}
            </p>
            <button
              aria-label={labels.downloadConfig}
              data-download-ready={isClientReady ? "true" : "false"}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 dark:bg-paper dark:text-ink"
              type="button"
              onClick={() => {
                setFeedback(null);
                setIsDownloadPanelOpen(true);
              }}
            >
              {labels.downloadConfig}
            </button>
            {downloadOptions.length > 0 ? (
              <p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted/60">
                {labels.tiers(
                  downloadOptions.length,
                  downloadOptions.find((option) => option.variant === "4k")
                    ? "4K"
                    : downloadOptions.some(
                          (option) => option.variant === "original",
                        )
                      ? labels.original
                      : formatFileSize(downloadOptions[0]?.sizeBytes ?? null),
                )}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            aria-label={
              isPending
                ? labels.processing
                : didHydrateAuthState && !isSignedIn
                  ? labels.loginToFavorite
                  : isFavorited
                    ? labels.unfavorite
                    : labels.favorite
            }
            className={cn(
              "inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
              isFavorited && !isPending
                ? "bg-red/10 text-red ring-1 ring-red/20 hover:bg-red/15"
                : "border border-ink/10 bg-white/55 text-muted hover:border-red/15 hover:text-red dark:border-paper/10 dark:bg-paper/6",
            )}
            disabled={isPending}
            onClick={handleFavoriteClick}
            type="button"
          >
            {isPending
              ? labels.processing
              : didHydrateAuthState && !isSignedIn
                ? labels.loginToFavorite
                : isFavorited
                  ? labels.favorited
                  : labels.favorite}
          </button>
          <Link
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-ink/10 bg-white/55 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition hover:border-red/15 hover:text-red dark:border-paper/10 dark:bg-paper/6 sm:w-auto"
            href="/explore"
          >
            {labels.backExplore}
          </Link>
          {didHydrateAuthState && isSignedIn ? (
            <Link
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[12px] border border-ink/10 bg-white/55 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition hover:border-red/15 hover:text-red dark:border-paper/10 dark:bg-paper/6 sm:w-auto"
              href="/library"
            >
              {labels.library}
            </Link>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <p className="mt-3 rounded-[10px] border border-red/20 bg-red/8 px-4 py-2.5 text-[13px] text-red">
          {feedback}
        </p>
      ) : null}

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
