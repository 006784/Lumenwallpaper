"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";

type DownloadFormat = "ORIGINAL" | "PNG" | "WEBP";
type DownloadState = "idle" | "loading" | "done" | "error";
type CacheState = "idle" | "done";
export type FormatKey = "original" | "4k" | "webp";
export type CropFrame = {
  heightPercent: number;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
};
export type DownloadProgressSnapshot = {
  loaded: number;
  total: number | null;
  percent: number | null;
};
export type DownloadProgressCallback = (
  snapshot: DownloadProgressSnapshot,
) => void;
export type DownloadPanelConfig = {
  crop: CropFrame;
  fmt: string;
  formatKey: FormatKey;
  outputHeight: number;
  outputWidth: number;
  ratio: string;
  res: string;
};

export interface DownloadPanelProps {
  wallpaper: {
    id: string;
    title: string;
    width: number;
    height: number;
    previewUrl: string;
  };
  onDownload: (
    config: DownloadPanelConfig,
    onProgress: DownloadProgressCallback,
  ) => Promise<void> | void;
  onSaveConfig: (config: {
    fmt: string;
    ratio: string;
    lockOn: boolean;
  }) => void;
  onClose: () => void;
}

type FormatPreset = {
  fmt: DownloadFormat;
  key: FormatKey;
  label: string;
  res: string;
  size: string;
  width: number;
  height: number;
};

type RatioOption = {
  label: string;
  w: number;
  h: number;
};

type BoxSize = {
  width: number;
  height: number;
};

type CachedDownloadPanelConfig = {
  fmt?: DownloadFormat;
  formatKey?: FormatKey;
  lockOn?: boolean;
  ratio?: string;
  res?: string;
  updatedAt?: string;
};

const OVERLAY_BG = "rgba(0,0,0,0.5)";
const INK = "#0a0804";
const PAPER = "#f2ede4";
const PAPER_2 = "#e8e0d2";
const RED = "#d42b2b";
const MUTED = "#8a8070";
const HINT = "#b0a898";
const BORDER = "#d0c8b8";
const BORDER_DK = "rgba(10,8,4,0.12)";
const FILM_BG = "#0a0804";
const FILM_HOLE = "#2a2820";

const FONT_BODY = "'Instrument Sans', system-ui, sans-serif";
const FONT_MONO = "monospace";

const FREE_RATIO: RatioOption = {
  label: "FREE",
  w: 0,
  h: 0,
};

const DESKTOP_RATIOS: RatioOption[] = [
  FREE_RATIO,
  { label: "16:9", w: 16, h: 9 },
  { label: "21:9", w: 21, h: 9 },
  { label: "4:3", w: 4, h: 3 },
  { label: "5:4", w: 5, h: 4 },
];

const MOBILE_RATIOS: RatioOption[] = [
  { label: "9:16", w: 9, h: 16 },
  { label: "9:19.5", w: 9, h: 19.5 },
  { label: "1:1", w: 1, h: 1 },
  { label: "3:4", w: 3, h: 4 },
];

const ALL_RATIOS = [...DESKTOP_RATIOS, ...MOBILE_RATIOS];

const FORMAT_TABS: Array<{ label: string; key: FormatKey }> = [
  { label: "原图", key: "original" },
  { label: "4K", key: "4k" },
  { label: "WebP", key: "webp" },
];

function formatResolution(width: number, height: number) {
  return `${Math.round(width)} × ${Math.round(height)}`;
}

function estimateSizeLabel(
  width: number,
  height: number,
  megapixelFactor: number,
) {
  const megapixels = Math.max((width * height) / 1_000_000, 0.4);
  const estimated = megapixels * megapixelFactor;

  return `~${estimated.toFixed(1)} MB`;
}

function computeBoxSize(width: number, height: number): BoxSize {
  const safeWidth = width > 0 ? width : 16;
  const safeHeight = height > 0 ? height : 9;
  const ratio = safeWidth / safeHeight;
  const maxWidth = ratio >= 1 ? 900 : 560;
  const maxHeight = ratio >= 1 ? 560 : 720;
  let nextWidth = maxWidth;
  let nextHeight = nextWidth / ratio;

  if (nextHeight > maxHeight) {
    nextHeight = maxHeight;
    nextWidth = nextHeight * ratio;
  }

  return {
    width: Math.max(180, Math.round(nextWidth)),
    height: Math.max(140, Math.round(nextHeight)),
  };
}

function fitWithinMaxDimension(
  width: number,
  height: number,
  maxDimension: number,
) {
  const safeWidth = width > 0 ? width : 16;
  const safeHeight = height > 0 ? height : 9;
  const dominant = Math.max(safeWidth, safeHeight);

  if (dominant <= maxDimension) {
    return {
      width: safeWidth,
      height: safeHeight,
    };
  }

  const scale = maxDimension / dominant;

  return {
    width: Math.max(1, Math.round(safeWidth * scale)),
    height: Math.max(1, Math.round(safeHeight * scale)),
  };
}

function computeCroppedResolution(
  preset: Pick<FormatPreset, "width" | "height">,
  ratioOption: RatioOption,
) {
  if (ratioOption.w === 0 || ratioOption.h === 0) {
    return {
      width: preset.width,
      height: preset.height,
    };
  }

  const targetRatio = ratioOption.w / ratioOption.h;
  const sourceRatio = preset.width / preset.height;

  if (sourceRatio >= targetRatio) {
    return {
      width: Math.round(preset.height * targetRatio),
      height: preset.height,
    };
  }

  return {
    width: preset.width,
    height: Math.round(preset.width / targetRatio),
  };
}

function computeCropFrame(
  boxSize: BoxSize,
  ratioOption: RatioOption,
): CropFrame {
  if (ratioOption.w === 0 || ratioOption.h === 0) {
    return {
      heightPercent: 100,
      leftPercent: 0,
      topPercent: 0,
      widthPercent: 100,
    };
  }

  const sourceRatio = boxSize.width / boxSize.height;
  const targetRatio = ratioOption.w / ratioOption.h;

  if (sourceRatio >= targetRatio) {
    const widthPercent = Math.min(100, (targetRatio / sourceRatio) * 100);

    return {
      heightPercent: 100,
      leftPercent: (100 - widthPercent) / 2,
      topPercent: 0,
      widthPercent,
    };
  }

  const heightPercent = Math.min(100, (sourceRatio / targetRatio) * 100);

  return {
    heightPercent,
    leftPercent: 0,
    topPercent: (100 - heightPercent) / 2,
    widthPercent: 100,
  };
}

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) {
    return "0 KB";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function getFormatDisplayName(fmt: DownloadFormat) {
  return fmt === "ORIGINAL" ? "原格式" : fmt;
}

function buildFilmHint(label: string, fmt: DownloadFormat, size: string) {
  return `${label} · ${getFormatDisplayName(fmt)} · ${size}`;
}

function FilmHoles({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-[6px]">
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="block h-2 w-[11px] rounded-[2px]"
          style={{
            background: FILM_BG,
            border: `1px solid ${FILM_HOLE}`,
          }}
        />
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={checked}
      className="relative block h-[18px] w-[34px]"
      style={{
        borderRadius: "9px",
        background: checked ? RED : BORDER,
      }}
      type="button"
      onClick={onClick}
    >
      <span
        className="absolute top-[2px] block h-[14px] w-[14px] rounded-full transition-all duration-200"
        style={{
          left: checked ? "18px" : "2px",
          background: PAPER,
        }}
      />
    </button>
  );
}

export function DownloadPanel({
  wallpaper,
  onDownload,
  onSaveConfig,
  onClose,
}: DownloadPanelProps) {
  const timeoutsRef = useRef<number[]>([]);
  const storageKey = `lumen:download-config:${wallpaper.id}`;
  const [viewportWidth, setViewportWidth] = useState(1024);
  const initialWidth = wallpaper.width > 0 ? wallpaper.width : 2358;
  const initialHeight = wallpaper.height > 0 ? wallpaper.height : 1538;

  const presets = useMemo<Record<FormatKey, FormatPreset>>(() => {
    const fourKSize = fitWithinMaxDimension(initialWidth, initialHeight, 3840);

    return {
      original: {
        key: "original",
        fmt: "ORIGINAL",
        label: "源文件",
        res: formatResolution(initialWidth, initialHeight),
        size: "原始大小",
        width: initialWidth,
        height: initialHeight,
      },
      "4k": {
        key: "4k",
        fmt: "PNG",
        label: "4K 超清",
        res: formatResolution(fourKSize.width, fourKSize.height),
        size: estimateSizeLabel(fourKSize.width, fourKSize.height, 1.45),
        width: fourKSize.width,
        height: fourKSize.height,
      },
      webp: {
        key: "webp",
        fmt: "WEBP",
        label: "WebP 压缩",
        res: formatResolution(initialWidth, initialHeight),
        size: estimateSizeLabel(initialWidth, initialHeight, 0.58),
        width: initialWidth,
        height: initialHeight,
      },
    };
  }, [initialHeight, initialWidth]);

  const [fmt, setFmt] = useState<DownloadFormat>(presets.original.fmt);
  const [fmtLabel, setFmtLabel] = useState(presets.original.label);
  const [res, setRes] = useState(presets.original.res);
  const [size, setSize] = useState(presets.original.size);
  const [ratio, setRatio] = useState(FREE_RATIO.label);
  const [thirdsOn, setThirdsOn] = useState(false);
  const [lockOn, setLockOn] = useState(true);
  const [dlState, setDlState] = useState<DownloadState>("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgressSnapshot | null>(null);
  const [cacheState, setCacheState] = useState<CacheState>("idle");
  const [formatKey, setFormatKey] = useState<FormatKey>("original");
  const [selectedRatio, setSelectedRatio] = useState<RatioOption>(FREE_RATIO);
  const [lastCropRatio, setLastCropRatio] = useState<RatioOption>(FREE_RATIO);
  const [boxSize, setBoxSize] = useState<BoxSize>(() =>
    computeBoxSize(presets.original.width, presets.original.height),
  );
  const [dimPill, setDimPill] = useState(
    `${initialWidth} × ${initialHeight} px`,
  );
  const [detectLabel, setDetectLabel] = useState("检测");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const timeouts = timeoutsRef.current;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);

    return () => {
      window.removeEventListener("resize", updateViewportWidth);
    };
  }, []);

  const filmHint = buildFilmHint(fmtLabel, fmt, size);
  const isCompact = viewportWidth < 900;
  const isPhone = viewportWidth < 640;
  const previewScale = isCompact
    ? Math.min(1, Math.max(0.42, (viewportWidth - 92) / boxSize.width))
    : 1;
  const displayBoxWidth = Math.round(boxSize.width * previewScale);
  const displayBoxHeight = Math.round(boxSize.height * previewScale);
  const progressPercent =
    downloadProgress?.percent ??
    (downloadProgress?.total && downloadProgress.total > 0
      ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
      : dlState === "loading"
        ? 8
        : 0);
  const canCrop = formatKey !== "original";
  const isCropActive = canCrop && selectedRatio.w > 0 && selectedRatio.h > 0;
  const cropFrame = computeCropFrame(boxSize, selectedRatio);
  const outputResolution = computeCroppedResolution(
    presets[formatKey],
    selectedRatio,
  );
  const cropWarning =
    isCropActive &&
    selectedRatio.w > selectedRatio.h &&
    presets[formatKey].height > presets[formatKey].width
      ? "当前是竖图，横向比例会裁掉大量画面，建议选择原图或手机比例。"
      : null;

  function rememberTimeout(timeout: number) {
    timeoutsRef.current.push(timeout);
  }

  function syncRatioState(nextRatio: RatioOption, nextPreset: FormatPreset) {
    const nextBoxSize = computeBoxSize(nextPreset.width, nextPreset.height);

    if (nextRatio.w === 0 || nextRatio.h === 0) {
      setBoxSize(nextBoxSize);
      setRatio(nextRatio.label);
      setRes(nextPreset.res);
      setDimPill(`${nextPreset.width} × ${nextPreset.height} px`);
      return;
    }

    const croppedResolution = computeCroppedResolution(nextPreset, nextRatio);

    setBoxSize(nextBoxSize);
    setRatio(nextRatio.label);
    setRes(formatResolution(croppedResolution.width, croppedResolution.height));
    setDimPill(`${croppedResolution.width} × ${croppedResolution.height} px`);
  }

  function applyPanelState(
    nextFormatKey: FormatKey,
    nextRatio: RatioOption,
    nextLockOn?: boolean,
  ) {
    const nextPreset = presets[nextFormatKey];

    setFormatKey(nextFormatKey);
    setFmt(nextPreset.fmt);
    setFmtLabel(nextPreset.label);
    setSize(nextPreset.size);
    setSelectedRatio(nextRatio);
    if (typeof nextLockOn === "boolean") {
      setLockOn(nextLockOn);
    }
    syncRatioState(nextRatio, nextPreset);
  }

  function applyFormat(nextFormatKey: FormatKey) {
    if (nextFormatKey === "original") {
      applyPanelState(nextFormatKey, FREE_RATIO);
      return;
    }

    applyPanelState(nextFormatKey, lastCropRatio);
  }

  function applyRatio(nextRatio: RatioOption) {
    if (formatKey === "original") {
      return;
    }

    setLastCropRatio(nextRatio);
    applyPanelState(formatKey, nextRatio);
  }

  function toggleThirds() {
    setThirdsOn((value) => !value);
  }

  function doDetect() {
    if (!canCrop) {
      return;
    }

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    setDetectLabel(`${screenWidth}×${screenHeight}`);

    const timeout = window.setTimeout(() => {
      setDetectLabel("检测");
    }, 2200);

    rememberTimeout(timeout);
  }

  async function doDl() {
    if (dlState !== "idle") {
      return;
    }

    setDlState("loading");
    setDownloadError(null);
    setDownloadProgress({
      loaded: 0,
      percent: 0,
      total: null,
    });

    try {
      await Promise.resolve(
        onDownload(
          {
            crop: cropFrame,
            fmt,
            formatKey,
            outputHeight: outputResolution.height,
            outputWidth: outputResolution.width,
            ratio,
            res,
          },
          (snapshot) => {
            setDownloadProgress({
              loaded: snapshot.loaded,
              percent:
                typeof snapshot.percent === "number"
                  ? Math.min(100, Math.max(0, snapshot.percent))
                  : null,
              total: snapshot.total,
            });
          },
        ),
      );
      setDownloadProgress((current) => ({
        loaded: current?.total ?? current?.loaded ?? 0,
        percent: 100,
        total: current?.total ?? null,
      }));
      setDlState("done");

      const resetTimeout = window.setTimeout(() => {
        setDlState("idle");
        setDownloadProgress(null);
      }, 1800);

      rememberTimeout(resetTimeout);
    } catch (error) {
      setDlState("error");
      setDownloadError(
        error instanceof Error ? error.message : "下载失败，请稍后重试。",
      );

      const resetTimeout = window.setTimeout(() => {
        setDlState("idle");
        setDownloadProgress(null);
      }, 4200);

      rememberTimeout(resetTimeout);
    }
  }

  function doCache() {
    if (cacheState !== "idle") {
      return;
    }

    try {
      const payload: CachedDownloadPanelConfig = {
        fmt,
        formatKey,
        lockOn,
        ratio,
        res,
        updatedAt: new Date().toISOString(),
      };

      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and still allow normal UI flow.
    }

    setCacheState("done");
    onSaveConfig({ fmt, ratio, lockOn });

    const timeout = window.setTimeout(() => {
      setCacheState("idle");
    }, 1800);

    rememberTimeout(timeout);
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as CachedDownloadPanelConfig;
      const nextFormatKey =
        parsed.formatKey === "original" ||
        parsed.formatKey === "4k" ||
        parsed.formatKey === "webp"
          ? parsed.formatKey
          : parsed.fmt === "WEBP"
            ? "webp"
            : parsed.res === presets["4k"].res
              ? "4k"
              : "original";
      const nextRatio =
        nextFormatKey === "original"
          ? FREE_RATIO
          : (ALL_RATIOS.find((option) => option.label === parsed.ratio) ??
            FREE_RATIO);
      const nextPreset = presets[nextFormatKey];

      setFormatKey(nextFormatKey);
      setFmt(nextPreset.fmt);
      setFmtLabel(nextPreset.label);
      setSize(nextPreset.size);
      setSelectedRatio(nextRatio);
      if (nextFormatKey !== "original") {
        setLastCropRatio(nextRatio);
      }
      setLockOn(parsed.lockOn ?? true);
      syncRatioState(nextRatio, nextPreset);
    } catch {
      // Ignore malformed local cache and keep defaults.
    }
  }, [presets, storageKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center px-3 py-3 sm:px-4 sm:py-6 md:items-center"
      style={{
        background: OVERLAY_BG,
        fontFamily: FONT_BODY,
      }}
      onClick={onClose}
    >
      <div
        className="grid w-full overflow-hidden"
        style={{
          background: PAPER,
          border: `1.5px solid ${INK}`,
          borderRadius: 0,
          gridTemplateColumns: isCompact
            ? "1fr"
            : "minmax(0, 1fr) minmax(400px, 440px)",
          maxWidth: "min(96vw, 1680px)",
          maxHeight: isCompact ? "calc(100dvh - 24px)" : "calc(100dvh - 48px)",
          overflowY: isCompact ? "auto" : "hidden",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex flex-col"
          style={{
            borderRight: isCompact ? "none" : `1.5px solid ${INK}`,
            borderBottom: isCompact ? `1.5px solid ${INK}` : "none",
            minHeight: isCompact ? "auto" : "min(760px, calc(100dvh - 48px))",
          }}
        >
          <div
            className="flex h-[26px] items-center justify-between px-3"
            style={{
              background: FILM_BG,
              borderBottom: `1.5px solid ${INK}`,
            }}
          >
            <FilmHoles count={5} />
            <p
              className="text-center"
              style={{
                color: "#3a3830",
                fontFamily: FONT_MONO,
                fontSize: "9px",
                letterSpacing: "2.5px",
              }}
            >
              FRAME™ · 2026 · ISO 400 · f/1.8 · 1/250s
            </p>
            <FilmHoles count={5} />
          </div>

          <div
            className="flex flex-1 items-center justify-center"
            style={{
              background: PAPER_2,
              padding: isPhone
                ? "36px 18px"
                : isCompact
                  ? "40px 24px"
                  : "48px 36px",
            }}
          >
            <div className="relative">
              <div
                className="absolute left-0 top-[-24px]"
                style={{
                  background: INK,
                  color: PAPER,
                  fontFamily: FONT_MONO,
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  padding: "3px 9px",
                }}
              >
                {dimPill}
              </div>

              <div
                className="relative overflow-hidden"
                style={{
                  width: `${displayBoxWidth}px`,
                  height: `${displayBoxHeight}px`,
                  background:
                    "linear-gradient(135deg, #17120d, #2a241b, #17120d)",
                  border: `1.5px solid ${INK}`,
                  transition:
                    "width 0.42s cubic-bezier(0.4,0,0.2,1), height 0.42s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {wallpaper.previewUrl ? (
                  <img
                    alt={wallpaper.title}
                    className="absolute inset-0 h-full w-full object-contain"
                    src={wallpaper.previewUrl}
                  />
                ) : null}
                <span
                  className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
                <span
                  className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                />
                <div
                  className="absolute"
                  style={{
                    border: `2px solid ${isCropActive ? RED : "rgba(242,237,228,0.72)"}`,
                    boxShadow: isCropActive
                      ? "0 0 0 999px rgba(10,8,4,0.38)"
                      : "none",
                    height: `${cropFrame.heightPercent}%`,
                    left: `${cropFrame.leftPercent}%`,
                    top: `${cropFrame.topPercent}%`,
                    transition:
                      "left 0.32s ease, top 0.32s ease, width 0.32s ease, height 0.32s ease, box-shadow 0.2s ease",
                    width: `${cropFrame.widthPercent}%`,
                  }}
                >
                  {thirdsOn ? (
                    <>
                      <span
                        className="absolute left-0 h-px w-full"
                        style={{
                          top: "33.3%",
                          background: "rgba(245,200,66,0.52)",
                        }}
                      />
                      <span
                        className="absolute left-0 h-px w-full"
                        style={{
                          top: "66.6%",
                          background: "rgba(245,200,66,0.52)",
                        }}
                      />
                      <span
                        className="absolute top-0 h-full w-px"
                        style={{
                          left: "33.3%",
                          background: "rgba(245,200,66,0.52)",
                        }}
                      />
                      <span
                        className="absolute top-0 h-full w-px"
                        style={{
                          left: "66.6%",
                          background: "rgba(245,200,66,0.52)",
                        }}
                      />
                    </>
                  ) : null}
                  <span
                    className="absolute left-[-2px] top-[-2px] h-[12px] w-[12px]"
                    style={{
                      borderLeft: `3px solid ${RED}`,
                      borderTop: `3px solid ${RED}`,
                    }}
                  />
                  <span
                    className="absolute right-[-2px] top-[-2px] h-[12px] w-[12px]"
                    style={{
                      borderRight: `3px solid ${RED}`,
                      borderTop: `3px solid ${RED}`,
                    }}
                  />
                  <span
                    className="absolute bottom-[-2px] left-[-2px] h-[12px] w-[12px]"
                    style={{
                      borderBottom: `3px solid ${RED}`,
                      borderLeft: `3px solid ${RED}`,
                    }}
                  />
                  <span
                    className="absolute bottom-[-2px] right-[-2px] h-[12px] w-[12px]"
                    style={{
                      borderBottom: `3px solid ${RED}`,
                      borderRight: `3px solid ${RED}`,
                    }}
                  />
                </div>
              </div>

              <div
                className="absolute bottom-[-24px] right-0"
                style={{
                  background: isCropActive ? RED : INK,
                  color: PAPER,
                  fontFamily: FONT_MONO,
                  fontSize: "9px",
                  letterSpacing: "2px",
                  padding: "3px 9px",
                }}
              >
                {ratio}
              </div>
            </div>
          </div>

          <div
            className="flex h-[26px] items-center justify-between px-3"
            style={{
              background: FILM_BG,
              borderTop: `1.5px solid ${INK}`,
            }}
          >
            <FilmHoles count={3} />
            <p
              className="text-center"
              style={{
                color: "#6a6050",
                fontFamily: FONT_MONO,
                fontSize: "9px",
                letterSpacing: "2px",
              }}
            >
              {filmHint}
            </p>
            <FilmHoles count={3} />
          </div>
        </div>

        <div
          className="flex flex-col"
          style={{
            background: PAPER,
            minHeight: isCompact ? "auto" : "min(760px, calc(100dvh - 48px))",
          }}
        >
          <div
            className="px-[22px] pb-4 pt-5"
            style={{ borderBottom: `1.5px solid ${INK}` }}
          >
            <div className="flex items-start justify-between">
              <p
                style={{
                  color: MUTED,
                  fontFamily: FONT_MONO,
                  fontSize: "9px",
                  letterSpacing: "4px",
                }}
              >
                DARKROOM EXPORT
              </p>
              <button
                aria-label="关闭下载配置"
                className="flex h-[22px] w-[22px] items-center justify-center transition-colors"
                style={{
                  background: PAPER,
                  border: `1.5px solid ${INK}`,
                  color: INK,
                  fontSize: "11px",
                }}
                type="button"
                onClick={onClose}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = INK;
                  event.currentTarget.style.color = PAPER;
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = PAPER;
                  event.currentTarget.style.color = INK;
                }}
              >
                ✕
              </button>
            </div>
            <h2
              className="mt-5"
              style={{
                color: INK,
                fontSize: "22px",
                fontWeight: 500,
                letterSpacing: 0,
                lineHeight: 1,
              }}
            >
              下载配置
            </h2>
            <p
              className="mt-1"
              style={{
                color: MUTED,
                fontSize: "11px",
                letterSpacing: "0.5px",
              }}
            >
              选择格式与裁切比例后下载
            </p>
          </div>

          <div
            className="flex flex-1 flex-col gap-5 overflow-y-auto"
            style={{
              padding: isPhone ? "16px 18px" : "18px 22px",
            }}
          >
            <section>
              <div className="mb-[10px] flex items-center gap-[10px]">
                <span
                  style={{
                    color: MUTED,
                    fontSize: "9px",
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  格式
                </span>
                <span
                  className="block h-px flex-1"
                  style={{ background: BORDER_DK }}
                />
              </div>
              <div className="grid grid-cols-3 gap-[5px]">
                {FORMAT_TABS.map(({ label, key }) => {
                  const active = formatKey === key;

                  return (
                    <button
                      key={key}
                      className="text-center"
                      style={{
                        background: active ? INK : PAPER,
                        border: active
                          ? `1.5px solid ${INK}`
                          : `1px solid ${BORDER}`,
                        borderRadius: 0,
                        color: active ? PAPER : MUTED,
                        cursor: "pointer",
                        fontFamily: FONT_MONO,
                        fontSize: "10px",
                        letterSpacing: "2px",
                        padding: "10px 0",
                      }}
                      type="button"
                      onClick={() => applyFormat(key)}
                      onMouseEnter={(event) => {
                        if (active) {
                          return;
                        }

                        event.currentTarget.style.borderColor = MUTED;
                        event.currentTarget.style.color = INK;
                      }}
                      onMouseLeave={(event) => {
                        if (active) {
                          return;
                        }

                        event.currentTarget.style.borderColor = BORDER;
                        event.currentTarget.style.color = MUTED;
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-[10px] flex items-center gap-[10px]">
                <span
                  style={{
                    color: MUTED,
                    fontSize: "9px",
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  裁切比例
                </span>
                <span
                  className="block h-px flex-1"
                  style={{ background: BORDER_DK }}
                />
              </div>

              <p
                style={{
                  color: HINT,
                  fontFamily: FONT_MONO,
                  fontSize: "9px",
                  letterSpacing: "2px",
                }}
              >
                桌面 / 平板
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {DESKTOP_RATIOS.map((option) => {
                  const active = ratio === option.label;
                  const disabled = !canCrop;

                  return (
                    <button
                      key={option.label}
                      disabled={disabled}
                      style={{
                        background: disabled ? PAPER : active ? RED : PAPER,
                        border: `1px solid ${disabled ? BORDER : active ? RED : BORDER}`,
                        borderRadius: 0,
                        color: disabled
                          ? "rgba(138,128,112,0.42)"
                          : active
                            ? PAPER
                            : MUTED,
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontFamily: FONT_MONO,
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        opacity: disabled ? 0.55 : 1,
                        padding: "5px 10px",
                      }}
                      type="button"
                      onClick={() => applyRatio(option)}
                      onMouseEnter={(event) => {
                        if (active || disabled) {
                          return;
                        }

                        event.currentTarget.style.borderColor = MUTED;
                        event.currentTarget.style.color = INK;
                      }}
                      onMouseLeave={(event) => {
                        if (active || disabled) {
                          return;
                        }

                        event.currentTarget.style.borderColor = BORDER;
                        event.currentTarget.style.color = MUTED;
                      }}
                    >
                      {option.label === "FREE" ? "自由" : option.label}
                    </button>
                  );
                })}
              </div>

              <p
                className="mt-[10px]"
                style={{
                  color: HINT,
                  fontFamily: FONT_MONO,
                  fontSize: "9px",
                  letterSpacing: "2px",
                }}
              >
                手机
              </p>
              <div className="mt-[6px] flex flex-wrap gap-1">
                {MOBILE_RATIOS.map((option) => {
                  const active = ratio === option.label;
                  const disabled = !canCrop;

                  return (
                    <button
                      key={option.label}
                      disabled={disabled}
                      style={{
                        background: disabled ? PAPER : active ? RED : PAPER,
                        border: `1px solid ${disabled ? BORDER : active ? RED : BORDER}`,
                        borderRadius: 0,
                        color: disabled
                          ? "rgba(138,128,112,0.42)"
                          : active
                            ? PAPER
                            : MUTED,
                        cursor: disabled ? "not-allowed" : "pointer",
                        fontFamily: FONT_MONO,
                        fontSize: "9px",
                        letterSpacing: "1.5px",
                        opacity: disabled ? 0.55 : 1,
                        padding: "5px 10px",
                      }}
                      type="button"
                      onClick={() => applyRatio(option)}
                      onMouseEnter={(event) => {
                        if (active || disabled) {
                          return;
                        }

                        event.currentTarget.style.borderColor = MUTED;
                        event.currentTarget.style.color = INK;
                      }}
                      onMouseLeave={(event) => {
                        if (active || disabled) {
                          return;
                        }

                        event.currentTarget.style.borderColor = BORDER;
                        event.currentTarget.style.color = MUTED;
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p
                className="mt-3"
                style={{
                  color: cropWarning ? RED : MUTED,
                  fontSize: "11px",
                  lineHeight: 1.7,
                }}
              >
                {formatKey === "original"
                  ? "原图会保留源文件尺寸与格式，不做裁切转换。选择 4K 或 WebP 后可裁切导出。"
                  : (cropWarning ??
                    "红框表示最终导出区域，框外内容不会进入裁切文件。")}
              </p>
            </section>

            <section>
              <div className="mb-[10px] flex items-center gap-[10px]">
                <span
                  style={{
                    color: MUTED,
                    fontSize: "9px",
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                  }}
                >
                  辅助选项
                </span>
                <span
                  className="block h-px flex-1"
                  style={{ background: BORDER_DK }}
                />
              </div>

              <div
                className="flex items-center justify-between py-[9px]"
                style={{ borderBottom: "1px solid rgba(10,8,4,0.08)" }}
              >
                <span style={{ color: "#5a5060", fontSize: "12px" }}>
                  三分构图参考线
                </span>
                <Toggle checked={thirdsOn} onClick={toggleThirds} />
              </div>
              <div
                className="flex items-center justify-between py-[9px]"
                style={{ borderBottom: "1px solid rgba(10,8,4,0.08)" }}
              >
                <span style={{ color: "#5a5060", fontSize: "12px" }}>
                  等比缩放锁定，默认开启
                </span>
                <Toggle checked={lockOn} onClick={() => {}} />
              </div>
              <div className="flex items-center justify-between py-[9px]">
                <span style={{ color: "#5a5060", fontSize: "12px" }}>
                  检测屏幕分辨率
                </span>
                <button
                  disabled={!canCrop}
                  style={{
                    background: PAPER,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 0,
                    color: canCrop ? MUTED : "rgba(138,128,112,0.42)",
                    cursor: canCrop ? "pointer" : "not-allowed",
                    fontFamily: FONT_MONO,
                    fontSize: "9px",
                    letterSpacing: "2px",
                    opacity: canCrop ? 1 : 0.55,
                    padding: "4px 10px",
                  }}
                  type="button"
                  onClick={doDetect}
                  onMouseEnter={(event) => {
                    if (!canCrop) {
                      return;
                    }

                    event.currentTarget.style.borderColor = MUTED;
                    event.currentTarget.style.color = INK;
                  }}
                  onMouseLeave={(event) => {
                    if (!canCrop) {
                      return;
                    }

                    event.currentTarget.style.borderColor = BORDER;
                    event.currentTarget.style.color = MUTED;
                  }}
                >
                  {detectLabel}
                </button>
              </div>
            </section>

            <section
              style={{
                background: INK,
                padding: "14px 16px",
              }}
            >
              {[
                ["分辨率", res, PAPER],
                ["格式", getFormatDisplayName(fmt), MUTED],
                ["大小", size, MUTED],
                ["比例", ratio, RED],
              ].map(([key, value, color]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between py-[3px]"
                >
                  <span
                    style={{
                      color: "#4a4440",
                      fontFamily: FONT_MONO,
                      fontSize: "9px",
                      letterSpacing: "2px",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      color,
                      fontFamily: FONT_MONO,
                      fontSize: "11px",
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </section>
          </div>

          <div
            className="flex flex-col gap-[7px]"
            style={{
              borderTop: `1.5px solid ${INK}`,
              padding: isPhone ? "14px 18px" : "16px 22px",
            }}
          >
            <button
              className="w-full"
              style={{
                background:
                  dlState === "done"
                    ? "#1a3a1a"
                    : dlState === "error"
                      ? "#3a1717"
                      : dlState === "loading"
                        ? "#1a1810"
                        : INK,
                border: "none",
                borderRadius: 0,
                color:
                  dlState === "done"
                    ? "#6ade80"
                    : dlState === "error"
                      ? "#ff8a8a"
                      : dlState === "loading"
                        ? RED
                        : PAPER,
                cursor: dlState === "idle" ? "pointer" : "default",
                fontFamily: FONT_MONO,
                fontSize: "10px",
                letterSpacing: "5px",
                padding: "14px 0",
                pointerEvents: dlState === "idle" ? "auto" : "none",
                transition: "background 0.22s ease, color 0.22s ease",
              }}
              type="button"
              onClick={doDl}
              onMouseEnter={(event) => {
                if (dlState !== "idle") {
                  return;
                }

                event.currentTarget.style.background = RED;
              }}
              onMouseLeave={(event) => {
                if (dlState !== "idle") {
                  return;
                }

                event.currentTarget.style.background = INK;
              }}
            >
              {dlState === "loading"
                ? `${Math.max(1, Math.min(100, progressPercent))}%`
                : dlState === "done"
                  ? "完成 ✓"
                  : dlState === "error"
                    ? "下载失败"
                    : "下载壁纸"}
            </button>

            {downloadProgress && dlState !== "idle" ? (
              <div className="space-y-2" aria-live="polite">
                <div
                  className="h-[5px] overflow-hidden"
                  style={{ background: "rgba(10,8,4,0.1)" }}
                >
                  <div
                    className="h-full"
                    style={{
                      background: dlState === "error" ? "#3a1717" : RED,
                      transform: `scaleX(${Math.max(0.04, Math.min(1, progressPercent / 100))})`,
                      transformOrigin: "left",
                      transition: "transform 0.22s ease-out",
                    }}
                  />
                </div>
                <div
                  className="flex items-center justify-between gap-3"
                  style={{
                    color: MUTED,
                    fontFamily: FONT_MONO,
                    fontSize: "9px",
                    letterSpacing: "1.5px",
                  }}
                >
                  <span>
                    {dlState === "done" ? "写入本地下载" : "正在接收文件"}
                  </span>
                  <span>
                    {downloadProgress.total
                      ? `${formatBytes(downloadProgress.loaded)} / ${formatBytes(downloadProgress.total)}`
                      : `${formatBytes(downloadProgress.loaded)} 已接收`}
                  </span>
                </div>
              </div>
            ) : null}

            {downloadError ? (
              <p className="text-xs leading-5" style={{ color: RED }}>
                {downloadError}
              </p>
            ) : null}

            <button
              className="w-full"
              style={{
                background: "transparent",
                border: `1px solid ${cacheState === "done" ? "#1a6b3a" : BORDER}`,
                borderRadius: 0,
                color: cacheState === "done" ? "#1a6b3a" : MUTED,
                cursor: cacheState === "idle" ? "pointer" : "default",
                fontFamily: FONT_MONO,
                fontSize: "9px",
                letterSpacing: "3px",
                padding: "8px 0",
                transition: "border-color 0.18s ease, color 0.18s ease",
              }}
              type="button"
              onClick={doCache}
              onMouseEnter={(event) => {
                if (cacheState !== "idle") {
                  return;
                }

                event.currentTarget.style.borderColor = MUTED;
                event.currentTarget.style.color = INK;
              }}
              onMouseLeave={(event) => {
                if (cacheState !== "idle") {
                  return;
                }

                event.currentTarget.style.borderColor = BORDER;
                event.currentTarget.style.color = MUTED;
              }}
            >
              {cacheState === "done" ? "已缓存 ✓" : "缓存配置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tailwind extend snippet:
 *
 * theme: {
 *   extend: {
 *     colors: {
 *       ink: '#0a0804',
 *       paper: '#f2ede4',
 *       'paper-2': '#e8e0d2',
 *       'brand-red': '#d42b2b',
 *       muted: '#8a8070',
 *       hint: '#b0a898',
 *       border: '#d0c8b8',
 *     },
 *     fontFamily: {
 *       display: ['"DM Serif Display"', 'serif'],
 *       bebas: ['"Bebas Neue"', 'sans-serif'],
 *       body: ['"Instrument Sans"', 'sans-serif'],
 *     },
 *     borderWidth: { '1.5': '1.5px' },
 *   }
 * }
 */
