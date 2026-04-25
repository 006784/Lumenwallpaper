"use client";

import { useMemo, useState } from "react";

import type {
  WallpaperDownloadRequestConfig,
  WallpaperDownloadResult,
  WallpaperDownloadProgressSnapshot,
  WallpaperDownloadStatus,
} from "@/types/wallpaper";

type UseWallpaperDownloadOptions = {
  identifier: string;
};

function parseFilenameFromDisposition(value: string | null) {
  if (!value) {
    return null;
  }

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const filenameMatch = value.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] ?? null;
}

function triggerBrowserDownload(blob: Blob, filename: string | null) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename ?? "lumen-wallpaper";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

function buildDownloadSearchParams(config?: WallpaperDownloadRequestConfig) {
  const params = new URLSearchParams();

  if (!config) {
    return params;
  }

  if (config.variant) {
    params.set("variant", config.variant);
  }

  if (config.format) {
    params.set("format", config.format);
  }

  if (config.ratio) {
    params.set("ratio", config.ratio);
  }

  if (config.resolution) {
    params.set("resolution", config.resolution);
  }

  return params;
}

export function useWallpaperDownload(options: UseWallpaperDownloadOptions) {
  const [downloadsCount, setDownloadsCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [status, setStatus] = useState<WallpaperDownloadStatus>("idle");
  const [bytesReceived, setBytesReceived] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);

  const progress = useMemo<WallpaperDownloadProgressSnapshot>(() => {
    return {
      bytesReceived,
      percent:
        totalBytes && totalBytes > 0
          ? Math.min(100, Math.round((bytesReceived / totalBytes) * 100))
          : null,
      status,
      totalBytes,
    };
  }, [bytesReceived, status, totalBytes]);

  async function download(
    config?: WallpaperDownloadRequestConfig,
  ): Promise<WallpaperDownloadResult> {
    setError(null);
    setStatus("preparing");
    setBytesReceived(0);
    setTotalBytes(null);

    const searchParams = buildDownloadSearchParams(config);
    const downloadPath = `/api/wallpapers/${encodeURIComponent(options.identifier)}/download`;
    const queryString = searchParams.toString();
    const requestPath =
      queryString.length > 0 ? `${downloadPath}?${queryString}` : downloadPath;

    const response = await fetch(requestPath);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      const nextError = payload?.error ?? "下载失败，请稍后重试。";
      setError(nextError);
      setStatus("error");
      throw new Error(nextError);
    }

    const nextFilename = parseFilenameFromDisposition(
      response.headers.get("content-disposition"),
    );
    const nextTotalBytes = Number.parseInt(
      response.headers.get("content-length") ?? "",
      10,
    );
    const nextDownloadsCount = Number.parseInt(
      response.headers.get("x-wallpaper-downloads-count") ?? "",
      10,
    );
    const nextFormat = response.headers.get("x-wallpaper-download-format") as
      | WallpaperDownloadResult["format"]
      | null;
    const transformed =
      response.headers.get("x-wallpaper-transformed") === "true";

    setFilename(nextFilename);
    setTotalBytes(Number.isFinite(nextTotalBytes) ? nextTotalBytes : null);
    setDownloadsCount(
      Number.isFinite(nextDownloadsCount) ? nextDownloadsCount : null,
    );

    if (!response.body) {
      const blob = await response.blob();
      triggerBrowserDownload(blob, nextFilename);
      setBytesReceived(blob.size);
      setStatus("success");

      return {
        downloadsCount: Number.isFinite(nextDownloadsCount)
          ? nextDownloadsCount
          : null,
        filename: nextFilename,
        format: nextFormat,
        transformed,
      } satisfies WallpaperDownloadResult;
    }

    const reader = response.body.getReader();
    const chunks: ArrayBuffer[] = [];
    let accumulatedBytes = 0;

    setStatus("downloading");

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      chunks.push(
        value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength,
        ) as ArrayBuffer,
      );
      accumulatedBytes += value.byteLength;
      setBytesReceived(accumulatedBytes);
    }

    const blob = new Blob(chunks, {
      type: response.headers.get("content-type") ?? "application/octet-stream",
    });
    triggerBrowserDownload(blob, nextFilename);
    setStatus("success");

    return {
      downloadsCount: Number.isFinite(nextDownloadsCount)
        ? nextDownloadsCount
        : null,
      filename: nextFilename,
      format: nextFormat,
      transformed,
    } satisfies WallpaperDownloadResult;
  }

  function reset() {
    setBytesReceived(0);
    setError(null);
    setFilename(null);
    setStatus("idle");
    setTotalBytes(null);
  }

  return {
    download,
    downloadsCount,
    error,
    filename,
    isDownloading: status === "preparing" || status === "downloading",
    progress,
    reset,
    status,
  };
}
