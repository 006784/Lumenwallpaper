"use client";

import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { PresignedUploadPayload, Wallpaper } from "@/types/wallpaper";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type UploadState =
  | {
      kind: "idle";
      message: string;
    }
  | {
      kind: "submitting";
      message: string;
    }
  | {
      kind: "success";
      message: string;
      wallpapers: Wallpaper[];
    }
  | {
      kind: "error";
      message: string;
      wallpapers?: Wallpaper[];
    };

type UploadStudioFormProps = {
  creatorEmail: string;
  creatorUsername: string;
  insPickCollection?: {
    label: string;
    nativeName: string;
    requiredTags: string[];
    r2Prefix: string;
    slug: string;
  } | null;
};

type PendingFileInfo = {
  contentType: string;
  durationSeconds: number | null;
  extension: string;
  height: number | null;
  kind: "image" | "video";
  name: string;
  previewUrl: string;
  sizeBytes: number;
  sizeLabel: string;
  width: number | null;
};

type UploadProgressState = {
  bytesSent: number;
  percent: number;
  phase: "idle" | "presigning" | "uploading" | "publishing" | "success" | "error";
  totalBytes: number | null;
};

type UploadQueueItem = {
  id: string;
  file: File;
  info: PendingFileInfo;
  title: string;
  description: string;
  tagsValue: string;
  colorsValue: string;
  progress: UploadProgressState;
  status: "idle" | "submitting" | "success" | "error";
  message: string;
  wallpaper: Wallpaper | null;
};

const MAX_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;
const SUPPORTED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function parseCsv(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) {
    return "0 KB";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDuration(seconds: number | null) {
  if (!seconds || Number.isNaN(seconds)) {
    return "未知时长";
  }

  const totalSeconds = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

function toDisplayTitleFromFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^/.]+$/, "");
  const normalized = withoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "Lumen Wallpaper";
}

function isVideoFileType(contentType: string) {
  return contentType.startsWith("video/");
}

function getAllowedSizeBytes(contentType: string) {
  return isVideoFileType(contentType)
    ? MAX_VIDEO_UPLOAD_SIZE_BYTES
    : MAX_IMAGE_UPLOAD_SIZE_BYTES;
}

function getXhrResponseSnippet(xhr: XMLHttpRequest) {
  try {
    return xhr.responseText.trim().slice(0, 180);
  } catch {
    return "";
  }
}

function buildR2UploadErrorMessage(
  xhr: XMLHttpRequest,
  kind: "network" | "timeout" | "abort" | "status",
) {
  if (kind === "timeout") {
    return "上传到 R2 超时。文件可能较大，或 R2/CORS 预检响应过慢，请稍后重试。";
  }

  if (kind === "abort") {
    return "上传到 R2 已中断，请重新选择文件后再试。";
  }

  if (xhr.status === 0) {
    return "上传到 R2 被浏览器拦截或连接中断（status 0）。常见原因是 R2 CORS 未允许 PUT/Content-Type，或签名 URL 的请求头与浏览器实际上传不一致。";
  }

  const responseSnippet = getXhrResponseSnippet(xhr);
  const statusText = xhr.statusText ? ` ${xhr.statusText}` : "";
  const statusHint =
    xhr.status === 403
      ? " 请确认 R2 凭证、Bucket 权限和签名头配置。"
      : xhr.status === 404
        ? " 请确认 Bucket 名称和对象路径。"
        : "";

  return `上传到 R2 失败，状态码 ${xhr.status}${statusText}。${responseSnippet ? `返回：${responseSnippet}` : ""}${statusHint}`;
}

function shouldShowUploadDiagnostics(message: string) {
  return /R2|CORS|status 0|上传诊断/i.test(message);
}

function getFormStateTitle(state: UploadState) {
  return {
    error: "发布未完成",
    idle: "工作台就绪",
    submitting: "正在发布",
    success: "发布完成",
  }[state.kind];
}

function getFormStateClassName(state: UploadState) {
  return {
    error:
      "border-red/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.74),rgba(255,239,234,0.54))] text-red shadow-[inset_1px_1px_2px_rgba(255,255,255,0.88),0_16px_34px_rgba(255,91,44,0.11)]",
    idle:
      "border-ink/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.72),rgba(239,247,247,0.52))] text-muted shadow-[inset_1px_1px_2px_rgba(255,255,255,0.86)]",
    submitting:
      "border-gold/25 bg-[linear-gradient(145deg,rgba(255,255,255,0.74),rgba(255,247,220,0.58))] text-[#7a6114] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.88),0_16px_34px_rgba(195,151,41,0.1)]",
    success:
      "border-[#6be3a5]/30 bg-[linear-gradient(145deg,rgba(255,255,255,0.74),rgba(226,255,240,0.56))] text-[#2f7d54] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.88),0_16px_34px_rgba(47,125,84,0.1)]",
  }[state.kind];
}

function getFormStateDotClassName(state: UploadState) {
  return {
    error: "bg-red shadow-[0_0_0_5px_rgba(255,91,44,0.12)]",
    idle: "bg-muted/60 shadow-[0_0_0_5px_rgba(37,58,62,0.07)]",
    submitting: "bg-gold shadow-[0_0_0_5px_rgba(195,151,41,0.13)]",
    success: "bg-[#39b974] shadow-[0_0_0_5px_rgba(57,185,116,0.13)]",
  }[state.kind];
}

function uploadFileToPresignedUrl(
  upload: PresignedUploadPayload,
  file: File,
  onProgress: (snapshot: { loaded: number; total: number | null }) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(upload.method, upload.presignedUrl, true);
    xhr.timeout = 5 * 60 * 1000;

    Object.entries(upload.headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.upload.onprogress = (event) => {
      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : file.size,
      });
    };

    xhr.onerror = () => {
      reject(new Error(buildR2UploadErrorMessage(xhr, "network")));
    };

    xhr.ontimeout = () => {
      reject(new Error(buildR2UploadErrorMessage(xhr, "timeout")));
    };

    xhr.onabort = () => {
      reject(new Error(buildR2UploadErrorMessage(xhr, "abort")));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress({
          loaded: file.size,
          total: file.size,
        });
        resolve();
        return;
      }

      reject(new Error(buildR2UploadErrorMessage(xhr, "status")));
    };

    xhr.send(file);
  });
}

async function readImageDimensions(previewUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };

    image.onerror = () => {
      reject(new Error("无法读取图片尺寸，请更换文件后重试。"));
    };

    image.src = previewUrl;
  });
}

async function readVideoMetadata(previewUrl: string) {
  return new Promise<{ width: number; height: number; duration: number }>(
    (resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      };

      video.onerror = () => {
        reject(new Error("无法读取视频信息，请更换文件后重试。"));
      };

      video.src = previewUrl;
    },
  );
}

async function extractVideoPosterFile(file: File) {
  const previewUrl = URL.createObjectURL(file);

  try {
    return await new Promise<{
      file: File;
      height: number;
      width: number;
    }>((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      let captured = false;

      const cleanup = () => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      };

      const fail = (message: string) => {
        cleanup();
        reject(new Error(message));
      };

      const captureFrame = () => {
        if (captured) {
          return;
        }

        captured = true;
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          fail("无法读取视频封面尺寸。");
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          fail("无法生成视频封面。");
          return;
        }

        context.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              fail("视频封面导出失败。");
              return;
            }

            cleanup();
            const baseName = file.name.replace(/\.[^/.]+$/, "") || "video";
            resolve({
              file: new File([blob], `${baseName}-poster.webp`, {
                type: "image/webp",
              }),
              width,
              height,
            });
          },
          "image/webp",
          0.92,
        );
      };

      video.onerror = () => {
        fail("无法抽取视频封面帧，请更换视频后重试。");
      };

      video.onloadedmetadata = () => {
        const seekTarget =
          Number.isFinite(video.duration) && video.duration > 0.6
            ? Math.min(2, Math.max(0.8, video.duration * 0.35))
            : 0;

        if (seekTarget <= 0) {
          captureFrame();
          return;
        }

        video.currentTime = seekTarget;
      };

      video.onseeked = captureFrame;
      video.onloadeddata = () => {
        if (video.currentTime === 0) {
          captureFrame();
        }
      };

      video.src = previewUrl;
    });
  } finally {
    URL.revokeObjectURL(previewUrl);
  }
}

async function buildPendingFileInfo(file: File): Promise<PendingFileInfo> {
  const previewUrl = URL.createObjectURL(file);

  try {
    if (isVideoFileType(file.type)) {
      const metadata = await readVideoMetadata(previewUrl);

      return {
        contentType: file.type,
        durationSeconds: metadata.duration,
        extension: file.name.split(".").pop()?.toUpperCase() ?? "VIDEO",
        height: metadata.height,
        kind: "video",
        name: file.name,
        previewUrl,
        sizeBytes: file.size,
        sizeLabel: formatFileSize(file.size),
        width: metadata.width,
      };
    }

    const dimensions = await readImageDimensions(previewUrl);

    return {
      contentType: file.type,
      durationSeconds: null,
      extension: file.name.split(".").pop()?.toUpperCase() ?? "IMAGE",
      height: dimensions.height,
      kind: "image",
      name: file.name,
      previewUrl,
      sizeBytes: file.size,
      sizeLabel: formatFileSize(file.size),
      width: dimensions.width,
    };
  } catch (error) {
    URL.revokeObjectURL(previewUrl);
    throw error;
  }
}

function formatDimensions(width: number | null, height: number | null) {
  if (!width || !height) {
    return "自动读取尺寸";
  }

  return `${width} × ${height}`;
}

function getOrientationLabel(width: number | null, height: number | null) {
  if (!width || !height) {
    return "等待识别";
  }

  if (width === height) {
    return "方形";
  }

  return width > height ? "横版" : "竖版";
}

function getQueueItemStatusLabel(item: UploadQueueItem) {
  if (item.status === "success") {
    return "已发布";
  }

  if (item.status === "error") {
    return "失败";
  }

  if (item.status === "submitting") {
    return "发布中";
  }

  return item.info.kind === "video" ? "动态壁纸" : "静态壁纸";
}

function getQueueItemStatusClassName(item: UploadQueueItem) {
  if (item.status === "success") {
    return "border-[#6be3a5]/30 bg-[#6be3a5]/10 text-[#6be3a5]";
  }

  if (item.status === "error") {
    return "border-red/25 bg-red/10 text-red";
  }

  if (item.status === "submitting") {
    return "border-gold/25 bg-gold/10 text-gold";
  }

  return item.info.kind === "video"
    ? "glass-chip text-muted"
    : "glass-chip text-muted";
}

function getProgressLabel(progress: UploadProgressState, item: UploadQueueItem | null) {
  if (!item) {
    return "等待选择文件";
  }

  return {
    idle: item.status === "success" ? "发布完成" : "等待发布",
    presigning: "申请上传地址",
    uploading: item.info.kind === "video" ? "上传动态壁纸到 R2" : "上传原图到 R2",
    publishing: item.info.kind === "video" ? "写入视频作品数据" : "写入作品与多尺寸变体",
    success: "发布完成",
    error: "发布失败",
  }[progress.phase];
}

export function UploadStudioForm({
  creatorEmail,
  creatorUsername,
  insPickCollection = null,
}: UploadStudioFormProps) {
  const fieldClassName =
    "glass-field w-full px-4 py-3 text-sm outline-none transition placeholder:text-muted/75";
  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [uploadItems, setUploadItems] = useState<UploadQueueItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [batchLicenseAccepted, setBatchLicenseAccepted] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<UploadState>({
    kind: "idle",
    message: insPickCollection
      ? `当前已登录为 @${creatorUsername}，INS 专区会上传到 ${insPickCollection.r2Prefix} 并自动补齐 ${insPickCollection.label} 标签。`
      : `当前已登录为 @${creatorUsername}，支持一次加入多张图片，也支持 MP4 / WEBM / MOV 动态壁纸。`,
  });

  const activeItem =
    uploadItems.find((item) => item.id === activeItemId) ?? uploadItems[0] ?? null;

  const activeTags = activeItem ? parseCsv(activeItem.tagsValue).slice(0, 12) : [];
  const activeColors = activeItem
    ? parseCsv(activeItem.colorsValue).slice(0, 8)
    : [];

  const completedMetadataCount = uploadItems.filter(
    (item) => item.title.trim().length > 0,
  ).length;
  const confirmedLicenseCount = batchLicenseAccepted ? uploadItems.length : 0;
  const publishedCount = uploadItems.filter((item) => item.status === "success").length;
  const failedCount = uploadItems.filter((item) => item.status === "error").length;
  const canPublish =
    uploadItems.length > 0 &&
    uploadItems.every((item) => item.title.trim().length > 0) &&
    batchLicenseAccepted &&
    !isSubmitting;

  const statusLabel = {
    idle: "Ready",
    submitting: "Publishing",
    success: "Published",
    error: "Needs attention",
  }[state.kind];

  const statusClassName = {
    idle: "glass-chip text-muted",
    submitting: "glass-chip-active",
    success: "glass-chip text-[#238c58]",
    error: "glass-chip-active",
  }[state.kind];

  const workflowSteps = [
    {
      description:
        uploadItems.length > 0
          ? `已加入 ${uploadItems.length} 个文件，可继续补充或追加。`
          : "先选一张或多张图片 / 视频。",
      isActive: uploadItems.length > 0 || isSubmitting || state.kind === "success",
      label: "建立队列",
      number: "01",
    },
    {
      description:
        completedMetadataCount > 0
          ? `${completedMetadataCount} 个作品已补标题。`
          : "为每一项补充标题、标签和描述。",
      isActive: completedMetadataCount > 0,
      label: "补充信息",
      number: "02",
    },
    {
      description:
        batchLicenseAccepted
          ? `本批 ${uploadItems.length} 个作品已统一确认授权。`
          : "发布前一次确认整批授权声明。",
      isActive: confirmedLicenseCount > 0 || isSubmitting || state.kind === "success",
      label: "确认授权",
      number: "03",
    },
    {
      description:
        publishedCount > 0
          ? `当前已发布 ${publishedCount} 个作品。`
          : "系统会按队列顺序依次上传并写入数据。",
      isActive: isSubmitting || state.kind === "success" || publishedCount > 0,
      label: "顺序发布",
      number: "04",
    },
  ];

  useEffect(() => {
    return () => {
      uploadItems.forEach((item) => {
        URL.revokeObjectURL(item.info.previewUrl);
      });
    };
  }, [uploadItems]);

  useEffect(() => {
    if (!activeItem && uploadItems.length > 0) {
      setActiveItemId(uploadItems[0]?.id ?? null);
    }
  }, [activeItem, uploadItems]);

  function updateQueueItem(
    itemId: string,
    updater: (item: UploadQueueItem) => UploadQueueItem,
  ) {
    setUploadItems((current) =>
      current.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  }

  function updateActiveQueueItem(
    updater: (item: UploadQueueItem) => UploadQueueItem,
  ) {
    if (!activeItem) {
      return;
    }

    updateQueueItem(activeItem.id, updater);
  }

  async function appendSelectedFiles(nextFiles: File[]) {
    if (nextFiles.length === 0) {
      return;
    }

    const currentSignatures = new Set(
      uploadItems.map(
        (item) =>
          `${item.file.name}:${item.file.size}:${item.file.lastModified}:${item.file.type}`,
      ),
    );
    const nextItems: UploadQueueItem[] = [];
    const errors: string[] = [];

    const defaultTags = insPickCollection?.requiredTags.join(", ") ?? "";

    for (const file of nextFiles) {
      const signature = `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

      if (currentSignatures.has(signature)) {
        continue;
      }

      if (!SUPPORTED_FILE_TYPES.has(file.type)) {
        errors.push(`${file.name} 不是支持的格式。`);
        continue;
      }

      if (file.size > getAllowedSizeBytes(file.type)) {
        errors.push(
          isVideoFileType(file.type)
            ? `${file.name} 超过 200MB。`
            : `${file.name} 超过 50MB。`,
        );
        continue;
      }

      try {
        const info = await buildPendingFileInfo(file);

        nextItems.push({
          id: crypto.randomUUID(),
          file,
          info,
          title: toDisplayTitleFromFilename(file.name),
          description: "",
          tagsValue: defaultTags,
          colorsValue: "",
          progress: {
            bytesSent: 0,
            percent: 0,
            phase: "idle",
            totalBytes: file.size,
          },
          status: "idle",
          message:
            info.kind === "video"
              ? "动态壁纸已加入队列，准备上传。"
              : "图片已加入队列，准备上传。",
          wallpaper: null,
        });
        currentSignatures.add(signature);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${file.name}: ${error.message}`
            : `${file.name}: 无法读取文件信息。`,
        );
      }
    }

    if (nextItems.length > 0) {
      setUploadItems((current) => [...current, ...nextItems]);
      setActiveItemId((current) => current ?? nextItems[0]?.id ?? null);
      setState({
        kind: "idle",
        message:
          nextItems.length === 1
            ? `${nextItems[0]?.info.name} 已加入队列，现在可以继续补信息或追加更多文件。`
            : `已加入 ${nextItems.length} 个文件，现在可以在队列里逐个编辑并统一发布。`,
      });
    }

    if (errors.length > 0) {
      setState({
        kind: "error",
        message: errors.slice(0, 2).join(" "),
      });
    }

    if (nextItems.length > 0) {
      titleInputRef.current?.focus();
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? []);
    void appendSelectedFiles(nextFiles);
  }

  function openFilePicker() {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragActive(false);
    const nextFiles = Array.from(event.dataTransfer.files ?? []);
    void appendSelectedFiles(nextFiles);
  }

  function removeQueueItem(itemId: string) {
    setUploadItems((current) => {
      const nextItems = current.filter((item) => item.id !== itemId);
      const removedItem = current.find((item) => item.id === itemId);

      if (removedItem) {
        URL.revokeObjectURL(removedItem.info.previewUrl);
      }

      if (itemId === activeItemId) {
        setActiveItemId(nextItems[0]?.id ?? null);
      }

      if (nextItems.length === 0) {
        setBatchLicenseAccepted(false);
      }

      return nextItems;
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function publishQueueItem(
    item: UploadQueueItem,
    itemIndex: number,
    itemCount: number,
  ) {
    updateQueueItem(item.id, (current) => ({
      ...current,
      status: "submitting",
      message: "正在申请上传地址…",
      progress: {
        ...current.progress,
        bytesSent: 0,
        percent: 6,
        phase: "presigning",
        totalBytes: current.file.size,
      },
    }));
    setState({
      kind: "submitting",
      message: `正在发布 ${itemIndex + 1}/${itemCount}：${item.info.name}`,
    });

    const presignEndpoint = insPickCollection
      ? "/api/ins-picks/upload/presign"
      : "/api/upload/presign";
    const createEndpoint = insPickCollection
      ? "/api/ins-picks/upload"
      : "/api/wallpapers";
    const withInsCollection = <T extends Record<string, unknown>>(payload: T) =>
      insPickCollection
        ? {
            ...payload,
            collection: insPickCollection.slug,
          }
        : payload;

    const presignResponse = await fetch(presignEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withInsCollection({
        filename: item.file.name,
        contentType: item.file.type,
        size: item.file.size,
      })),
    });

    const presignPayload = (await presignResponse.json()) as
      | ApiSuccess<PresignedUploadPayload>
      | ApiFailure;

    if (!presignResponse.ok || !("data" in presignPayload)) {
      throw new Error(
        "error" in presignPayload
          ? presignPayload.error
          : "无法获取上传地址。",
      );
    }

    let posterUpload:
      | {
          file: File;
          payload: PresignedUploadPayload;
          width: number;
          height: number;
        }
      | null = null;

    if (item.info.kind === "video") {
      updateQueueItem(item.id, (current) => ({
        ...current,
        message: "正在抽取动态壁纸封面帧…",
        progress: {
          ...current.progress,
          bytesSent: 0,
          percent: 12,
          phase: "presigning",
          totalBytes: current.file.size,
        },
      }));

      try {
        const poster = await extractVideoPosterFile(item.file);
        const posterPresignResponse = await fetch(presignEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(withInsCollection({
            filename: poster.file.name,
            contentType: poster.file.type,
            size: poster.file.size,
          })),
        });

        const posterPresignPayload = (await posterPresignResponse.json()) as
          | ApiSuccess<PresignedUploadPayload>
          | ApiFailure;

        if (
          posterPresignResponse.ok &&
          "data" in posterPresignPayload
        ) {
          posterUpload = {
            file: poster.file,
            payload: posterPresignPayload.data,
            width: poster.width,
            height: poster.height,
          };
        }
      } catch {
        posterUpload = null;
      }
    }

    updateQueueItem(item.id, (current) => ({
      ...current,
      message:
        current.info.kind === "video"
          ? "上传地址已就绪，正在把视频直传到 R2…"
          : "上传地址已就绪，正在把原图直传到 R2…",
      progress: {
        ...current.progress,
        bytesSent: 0,
        percent: 18,
        phase: "uploading",
        totalBytes: current.file.size,
      },
    }));

    await uploadFileToPresignedUrl(
      presignPayload.data,
      item.file,
      ({ loaded, total }) => {
        const effectiveTotal = total ?? item.file.size;
        const ratio = effectiveTotal > 0 ? Math.min(1, loaded / effectiveTotal) : 0;

        updateQueueItem(item.id, (current) => ({
          ...current,
          progress: {
            ...current.progress,
            bytesSent: loaded,
            percent: Math.round(18 + ratio * 62),
            phase: "uploading",
            totalBytes: effectiveTotal,
          },
        }));
      },
    );

    if (posterUpload) {
      await uploadFileToPresignedUrl(
        posterUpload.payload,
        posterUpload.file,
        () => {},
      );
    }

    updateQueueItem(item.id, (current) => ({
      ...current,
      message:
        current.info.kind === "video"
          ? "视频已经上传，正在写入动态壁纸数据…"
          : "原图已经上传，正在写入作品、生成变体并同步元数据…",
      progress: {
        ...current.progress,
        bytesSent: current.file.size,
        percent: 88,
        phase: "publishing",
        totalBytes: current.file.size,
      },
    }));

    const createResponse = await fetch(createEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(withInsCollection({
        title: item.title.trim(),
        description: item.description.trim(),
        tags: parseCsv(item.tagsValue),
        colors: parseCsv(item.colorsValue),
        licenseAccepted: batchLicenseAccepted,
        licenseVersion: "2026-04",
        original: {
          storagePath: presignPayload.data.key,
          url: presignPayload.data.publicUrl,
          size: item.file.size,
          format: item.file.type,
          contentType: item.file.type,
          width: item.info.width ?? undefined,
          height: item.info.height ?? undefined,
        },
        width: item.info.width ?? undefined,
        height: item.info.height ?? undefined,
        status: "published",
        videoUrl: item.info.kind === "video" ? presignPayload.data.publicUrl : undefined,
        posterOriginal: posterUpload
          ? {
              storagePath: posterUpload.payload.key,
              url: posterUpload.payload.publicUrl,
              size: posterUpload.file.size,
              format: posterUpload.file.type,
              contentType: posterUpload.file.type,
              width: posterUpload.width,
              height: posterUpload.height,
          }
          : undefined,
      })),
    });

    const createPayload = (await createResponse.json()) as
      | ApiSuccess<Wallpaper>
      | ApiFailure;

    if (!createResponse.ok || !("data" in createPayload)) {
      throw new Error(
        "error" in createPayload
          ? createPayload.error
          : "壁纸写入数据库失败。",
      );
    }

    updateQueueItem(item.id, (current) => ({
      ...current,
      message: "发布成功，可以继续查看详情或管理台。",
      progress: {
        ...current.progress,
        bytesSent: current.file.size,
        percent: 100,
        phase: "success",
        totalBytes: current.file.size,
      },
      status: "success",
      wallpaper: createPayload.data,
    }));

    return createPayload.data;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (uploadItems.length === 0) {
      setState({
        kind: "error",
        message: "先加入至少一个图片或视频文件，再继续发布。",
      });
      return;
    }

    const firstIncomplete = uploadItems.find(
      (item) => item.title.trim().length === 0,
    );

    if (firstIncomplete) {
      setActiveItemId(firstIncomplete.id);
      setState({
        kind: "error",
        message: "队列里还有未补完标题的作品，先补完再发布。",
      });
      titleInputRef.current?.focus();
      return;
    }

    if (!batchLicenseAccepted) {
      setState({
        kind: "error",
        message: "请先点击一次整批授权确认，再发布到 Lumen。",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const createdWallpapers: Wallpaper[] = [];
      const failedItems: Array<{
        id: string;
        name: string;
        reason: string;
      }> = [];

      for (let index = 0; index < uploadItems.length; index += 1) {
        const item = uploadItems[index]!;
        setActiveItemId(item.id);

        try {
          const wallpaper = await publishQueueItem(item, index, uploadItems.length);
          createdWallpapers.push(wallpaper);
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : "上传流程失败，请稍后重试。";
          failedItems.push({
            id: item.id,
            name: item.info.name,
            reason,
          });
          updateQueueItem(item.id, (current) => ({
            ...current,
            message: reason,
            progress: {
              ...current.progress,
              phase: "error",
            },
            status: "error",
          }));
        }
      }

      if (failedItems.length === 0) {
        setState({
          kind: "success",
          message:
            createdWallpapers.length === 1
              ? "作品已经发布完成。"
              : `已顺序发布 ${createdWallpapers.length} 个作品。`,
          wallpapers: createdWallpapers,
        });
      } else {
        setState({
          kind: "error",
          message:
            createdWallpapers.length > 0
              ? `已发布 ${createdWallpapers.length} 个作品，仍有 ${failedItems.length} 个失败：${failedItems[0]?.reason ?? "请检查失败项后重试。"}`
              : `这次发布没有成功：${failedItems[0]?.reason ?? "请检查失败项后重试。"}`,
          wallpapers: createdWallpapers,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="glass-surface relative space-y-7 overflow-hidden px-4 py-4 sm:px-5 sm:py-5 md:space-y-8 md:px-7 md:py-7 xl:px-8 xl:py-8"
      onSubmit={handleSubmit}
    >
      <div className="absolute inset-x-10 top-0 h-[3px] rounded-full bg-red/75" />

      <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red">
            Creator Studio
          </p>
          <h2 className="mt-3 font-body text-[clamp(2.2rem,4.6vw,4rem)] font-semibold leading-[1.02] text-ink">
            一次加入多张作品，也把动态壁纸一起收进来。
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-[15px]">
            现在上传支持批量队列。图片会继续生成多尺寸变体，视频会作为动态壁纸直传
            R2 并写入数据库；你只需要在队列里切换当前项逐个补信息。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
          <span className="glass-chip px-3 py-2">
            Multi Upload
          </span>
          <span className="glass-chip px-3 py-2">
            Image + Video
          </span>
          <span className="glass-chip-active px-3 py-2">
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {workflowSteps.map((step) => (
          <div
            key={step.number}
            className={cn(
              "glass-surface-soft px-4 py-4 transition",
              step.isActive
                ? "ring-1 ring-red/20"
                : "",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className={cn(
                  "text-[10px] uppercase tracking-[0.28em]",
                  step.isActive ? "text-red" : "text-muted/70",
                )}
              >
                {step.number}
              </p>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  step.isActive ? "bg-red" : "bg-ink/12",
                )}
              />
            </div>
            <p className="mt-3 font-body text-[1.55rem] font-semibold leading-none text-ink">
              {step.label}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="glass-surface-soft space-y-5 px-4 py-4 md:px-5 md:py-5">
          <div
            className={cn(
              "glass-surface-soft relative overflow-hidden transition",
              isDragActive
                ? "ring-2 ring-red/25"
                : "",
            )}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {activeItem ? (
              <div className="grid gap-6 p-4 xl:grid-cols-[minmax(250px,320px)_1fr] xl:p-6">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-white/45 shadow-[inset_5px_5px_12px_rgba(40,62,66,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.88)]">
                  {activeItem.info.kind === "video" ? (
                    <video
                      autoPlay
                      className="h-full w-full object-cover"
                      controls
                      loop
                      muted
                      playsInline
                      src={activeItem.info.previewUrl}
                    />
                  ) : (
                    <NextImage
                      alt={activeItem.info.name}
                      className="object-cover"
                      fill
                      sizes="(min-width: 1280px) 320px, 100vw"
                      src={activeItem.info.previewUrl}
                      unoptimized
                    />
                  )}
                </div>

                <div className="flex flex-col justify-between gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted">
                      <span className="glass-chip px-3 py-2">
                        当前编辑
                      </span>
                      <span className="glass-chip px-3 py-2">
                        {activeItem.info.kind === "video" ? "动态壁纸" : "静态壁纸"}
                      </span>
                      <span
                        className={cn(
                          "border px-3 py-2",
                          getQueueItemStatusClassName(activeItem),
                        )}
                      >
                        {getQueueItemStatusLabel(activeItem)}
                      </span>
                    </div>
                    <p className="mt-4 font-body text-[clamp(1.9rem,3vw,2.8rem)] font-semibold leading-[1.02] text-ink">
                      {activeItem.info.name}
                    </p>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                      当前选中的是队列里的第{" "}
                      {uploadItems.findIndex((item) => item.id === activeItem.id) + 1}{" "}
                      项。你可以继续编辑这一项，也可以切换到别的作品逐个补信息。
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                    <span className="glass-chip px-3 py-2 text-muted">
                      {activeItem.info.extension}
                    </span>
                    <span className="glass-chip px-3 py-2 text-muted">
                      {activeItem.info.sizeLabel}
                    </span>
                    <span className="glass-chip px-3 py-2 text-muted">
                      {formatDimensions(activeItem.info.width, activeItem.info.height)}
                    </span>
                    <span className="glass-chip px-3 py-2 text-muted">
                      {getOrientationLabel(activeItem.info.width, activeItem.info.height)}
                    </span>
                    {activeItem.info.kind === "video" ? (
                      <span className="glass-chip px-3 py-2 text-muted">
                        {formatDuration(activeItem.info.durationSeconds)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      className="glass-primary inline-flex min-h-[42px] items-center justify-center px-4 py-2 text-[10px] uppercase tracking-[0.22em]"
                      onClick={openFilePicker}
                      type="button"
                    >
                      追加更多文件
                    </button>
                    <button
                      className="glass-control inline-flex min-h-[42px] items-center justify-center px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-ink transition"
                      onClick={() => removeQueueItem(activeItem.id)}
                      type="button"
                    >
                      移除当前项
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden px-5 py-7 md:px-6 md:py-8">
                <div className="pointer-events-none absolute right-[-20px] top-[-30px] text-[120px] leading-none text-ink/4">
                  MIX
                </div>
                <div className="relative max-w-xl">
                  <div className="glass-control flex h-14 w-14 items-center justify-center text-[28px] text-ink/70">
                    +
                  </div>
                  <p className="mt-5 font-body text-[clamp(2.1rem,4vw,3rem)] font-semibold leading-[1.02]">
                    一次选择多张图片，也支持视频。
                  </p>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                    点击主按钮把多张作品加入队列，或者直接把文件拖到这个区域。图片支持
                    JPG / PNG / WEBP，动态壁纸支持 MP4 / WEBM / MOV。
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                    {[
                      "图片 50MB 内",
                      "视频 200MB 内",
                      "支持多选",
                      "视频可上传",
                    ].map((item) => (
                      <span key={item} className="glass-chip px-3 py-2 text-muted">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              className="glass-primary inline-flex min-h-[48px] w-full items-center justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] sm:w-auto"
              onClick={openFilePicker}
              type="button"
            >
              {uploadItems.length > 0 ? "继续添加图片或视频" : "选择图片或视频"}
            </button>
            <p className="text-sm text-muted">
              主入口已经切成批量选择，拖拽只是辅助方式。
            </p>
          </div>

          <input
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            className="sr-only"
            id="file"
            multiple
            name="file"
            onChange={handleFileChange}
            ref={inputRef}
            type="file"
          />

          <div className="space-y-3 border-t border-ink/10 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-red">
                当前队列
              </p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                {uploadItems.length} items
              </p>
            </div>

            {uploadItems.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {uploadItems.map((item, index) => (
                  <button
                    key={item.id}
                    className={cn(
                      "relative overflow-hidden p-3 text-left transition",
                      item.id === activeItem?.id
                        ? "glass-chip-active"
                        : "glass-surface-soft hover:-translate-y-0.5",
                    )}
                    onClick={() => setActiveItemId(item.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p
                          className={cn(
                            "text-[10px] uppercase tracking-[0.24em]",
                            item.id === activeItem?.id ? "text-gold" : "text-red",
                          )}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </p>
                        <p
                          className={cn(
                            "mt-2 line-clamp-2 font-body text-[1.25rem] font-semibold leading-none",
                            item.id === activeItem?.id ? "text-paper" : "text-ink",
                          )}
                        >
                          {item.title || item.info.name}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 border px-2 py-1 text-[10px] uppercase tracking-[0.2em]",
                          item.id === activeItem?.id
                            ? "border-paper/20 bg-paper/10 text-paper/80"
                            : getQueueItemStatusClassName(item),
                        )}
                      >
                        {getQueueItemStatusLabel(item)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-xs leading-5",
                        item.id === activeItem?.id ? "text-paper/70" : "text-muted",
                      )}
                    >
                      {item.info.name}
                    </p>
                    <p
                      className={cn(
                        "mt-2 line-clamp-2 text-[11px] leading-5",
                        item.status === "error"
                          ? item.id === activeItem?.id
                            ? "text-red-200"
                            : "text-red"
                          : item.id === activeItem?.id
                            ? "text-paper/45"
                            : "text-muted/70",
                      )}
                    >
                      {item.message}
                    </p>
                    <div
                      className={cn(
                        "mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em]",
                        item.id === activeItem?.id ? "text-paper/60" : "text-muted/80",
                      )}
                    >
                      <span>{item.info.kind === "video" ? "Motion" : "Still"}</span>
                      <span>{item.info.sizeLabel}</span>
                      {item.status === "submitting" ? (
                        <span>{item.progress.percent}%</span>
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        "mt-4 h-1.5 overflow-hidden rounded-full",
                        item.id === activeItem?.id
                          ? "bg-paper/14"
                          : "bg-white/60 shadow-[inset_2px_2px_5px_rgba(40,62,66,0.08),inset_-2px_-2px_5px_rgba(255,255,255,0.88)]",
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-300",
                          item.status === "error"
                            ? "bg-red"
                            : item.status === "success"
                              ? "bg-[#39b974]"
                              : item.id === activeItem?.id
                                ? "bg-paper/78"
                                : "bg-red",
                        )}
                        style={{
                          width: `${Math.max(
                            item.status === "success" ? 100 : item.progress.percent,
                            item.status === "idle" ? 2 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <button
                      className={cn(
                        "mt-4 inline-flex border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] transition",
                        item.id === activeItem?.id
                          ? "border-paper/20 text-paper/70 hover:border-paper hover:text-paper"
                          : "border-ink/15 text-muted hover:border-ink hover:text-ink",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        removeQueueItem(item.id);
                      }}
                      type="button"
                    >
                      移除
                    </button>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-muted">
                队列还是空的。先加入至少一个图片或视频，工作台才会切到逐项编辑模式。
              </p>
            )}
          </div>
        </section>

        <aside className="glass-surface-soft self-start space-y-4 px-4 py-4 text-ink md:px-5 md:py-5 2xl:sticky 2xl:top-24">
          <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-red">
                发布摘要
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                右侧只保留进度、账号和队列完成度。
              </p>
            </div>
            <p
              className={cn(
                "border px-3 py-2 text-[10px] uppercase tracking-[0.24em]",
                statusClassName,
              )}
            >
              {statusLabel}
            </p>
          </div>

          <div className="space-y-3 rounded-[22px] bg-white/45 px-4 py-4 shadow-[inset_5px_5px_12px_rgba(40,62,66,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.88)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
                当前进度
              </p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-red">
                {activeItem ? activeItem.progress.percent : 0}%
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/60 shadow-[inset_3px_3px_8px_rgba(40,62,66,0.1),inset_-3px_-3px_8px_rgba(255,255,255,0.9)]">
              <div
                className="h-full bg-red transition-[width] duration-300"
                style={{ width: `${activeItem ? activeItem.progress.percent : 0}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
              <span>{getProgressLabel(activeItem?.progress ?? {
                bytesSent: 0,
                percent: 0,
                phase: "idle",
                totalBytes: null,
              }, activeItem)}</span>
              {activeItem?.progress.totalBytes ? (
                <span>
                  {formatFileSize(activeItem.progress.bytesSent)} /{" "}
                  {formatFileSize(activeItem.progress.totalBytes)}
                </span>
              ) : (
                <span>等待选择文件</span>
              )}
            </div>
            {activeItem?.message ? (
              <p
                className={cn(
                  "text-xs leading-6",
                  activeItem.status === "error" ? "text-red" : "text-muted",
                )}
              >
                {activeItem.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 border-t border-ink/10 pt-5">
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted">
                当前创作者
              </label>
              <div className="glass-field w-full px-4 py-3 text-sm">
                @{creatorUsername}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted">
                登录邮箱
              </label>
              <div className="glass-field w-full px-4 py-3 text-sm">
                {creatorEmail}
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-t border-ink/10 pt-5 sm:grid-cols-2 2xl:grid-cols-1">
            {[
              ["队列", `${uploadItems.length} 项`],
              ["标题完成", `${completedMetadataCount}/${uploadItems.length || 0}`],
              ["授权完成", `${confirmedLicenseCount}/${uploadItems.length || 0}`],
              ["已发布", `${publishedCount}`],
              ["失败", `${failedCount}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="glass-surface-soft px-4 py-4"
              >
                <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
                  {label}
                </p>
                <p className="mt-3 font-body text-[22px] font-semibold text-ink">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-ink/10 pt-5 text-[11px] uppercase tracking-[0.2em] text-muted">
            <p>图片：JPG / PNG / WEBP</p>
            <p>视频：MP4 / WEBM / MOV</p>
            <p>流程：Presign → 直传 R2 → 写入 Supabase</p>
          </div>

          {activeItem?.wallpaper ? (
            <div className="glass-surface-soft space-y-3 px-4 py-4">
              <p className="font-body text-[24px] font-semibold">
                {activeItem.wallpaper.title}
              </p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted">
                slug: {activeItem.wallpaper.slug}
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  className="glass-control inline-flex px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition"
                  href={`/wallpaper/${activeItem.wallpaper.slug}`}
                >
                  查看详情页
                </a>
                <a
                  className="glass-control inline-flex px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition"
                  href="/creator/studio/manage"
                >
                  前往管理台
                </a>
              </div>
            </div>
          ) : null}
        </aside>
      </div>

      {activeItem ? (
        <div className="space-y-6 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-red">
                编辑当前项
              </p>
              <p className="mt-2 font-body text-[clamp(1.9rem,4vw,3rem)] font-semibold leading-[1.02] text-ink">
                {activeItem.info.kind === "video" ? "当前正在编辑动态壁纸" : "当前正在编辑静态壁纸"}
              </p>
            </div>
            <p className="glass-chip px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted">
              {activeItem.info.name}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  className="block text-[10px] uppercase tracking-[0.25em] text-muted"
                  htmlFor="title"
                >
                  标题
                </label>
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted/65">
                  {activeItem.title.length}/120
                </span>
              </div>
              <input
                className={fieldClassName}
                id="title"
                maxLength={120}
                name="title"
                onChange={(event) =>
                  updateActiveQueueItem((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="例如：暮色将临，万物静默"
                ref={titleInputRef}
                required
                type="text"
                value={activeItem.title}
              />
              <p className="mt-2 text-xs leading-5 text-muted/80">
                默认会根据文件名生成标题，你可以逐项改成更完整的作品名。
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  className="block text-[10px] uppercase tracking-[0.25em] text-muted"
                  htmlFor="tags"
                >
                  标签
                </label>
                <span className="text-[10px] uppercase tracking-[0.22em] text-muted/65">
                  {activeTags.length}/12
                </span>
              </div>
              <input
                className={fieldClassName}
                id="tags"
                name="tags"
                onChange={(event) =>
                  updateActiveQueueItem((current) => ({
                    ...current,
                    tagsValue: event.target.value,
                  }))
                }
                placeholder="自然, 暗夜, 渐变"
                type="text"
                value={activeItem.tagsValue}
              />
              <div className="mt-3 flex min-h-[40px] flex-wrap gap-2">
                {activeTags.length > 0 ? (
                  activeTags.map((tag) => (
                    <span
                      key={tag}
                      className="glass-chip px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-xs leading-5 text-muted/70">
                    用逗号分隔多个标签，发布前会同步写入搜索和筛选。
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                className="block text-[10px] uppercase tracking-[0.25em] text-muted"
                htmlFor="description"
              >
                描述
              </label>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted/65">
                {activeItem.description.length}/2000
              </span>
            </div>
            <textarea
              className={`${fieldClassName} min-h-[140px]`}
              id="description"
              maxLength={2000}
              name="description"
              onChange={(event) =>
                updateActiveQueueItem((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder={
                activeItem.info.kind === "video"
                  ? "补充这条动态壁纸的来源、场景或循环效果。"
                  : "补充这张壁纸的拍摄 / 创作背景。"
              }
              value={activeItem.description}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                className="block text-[10px] uppercase tracking-[0.25em] text-muted"
                htmlFor="colors"
              >
                颜色
              </label>
              <span className="text-[10px] uppercase tracking-[0.22em] text-muted/65">
                {activeColors.length}/8
              </span>
            </div>
            <input
              className={fieldClassName}
              id="colors"
              name="colors"
              onChange={(event) =>
                updateActiveQueueItem((current) => ({
                  ...current,
                  colorsValue: event.target.value,
                }))
              }
              placeholder="#0a0804, #d42b2b"
              type="text"
              value={activeItem.colorsValue}
            />
            <div className="mt-3 flex min-h-[40px] flex-wrap gap-2">
              {activeColors.length > 0 ? (
                activeColors.map((color) => {
                  const normalizedColor = color.startsWith("#")
                    ? color
                    : `#${color}`;

                  return (
                    <span
                      key={color}
                      className="glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted"
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-ink/15"
                        style={{ backgroundColor: normalizedColor }}
                      />
                      {normalizedColor}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs leading-5 text-muted/70">
                  可以手动填主色，也可以留空交给后端自动提取。
                </span>
              )}
            </div>
          </div>

          <label className="glass-surface-soft flex items-start gap-3 px-4 py-4 text-sm leading-6 text-muted">
            <input
              checked={batchLicenseAccepted}
              className="mt-1 h-4 w-4 shrink-0 accent-ink"
              id="batchLicenseAccepted"
              name="batchLicenseAccepted"
              onChange={(event) => setBatchLicenseAccepted(event.target.checked)}
              required
              type="checkbox"
            />
            <span>
              我确认自己拥有本批 {uploadItems.length} 个作品的上传、展示与分发授权，并同意
              Lumen 记录本次授权确认时间用于内容合规审计。
            </span>
          </label>
        </div>
      ) : null}

      <div className="space-y-3 border-t border-ink/10 pt-8">
        <button
          className="glass-primary group relative inline-flex min-h-[56px] w-full items-center justify-center overflow-hidden px-5 py-3 font-mono text-[12px] uppercase tracking-[0.24em] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canPublish}
          type="submit"
        >
          <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/80 opacity-80" />
          <span className="relative flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-white/80 shadow-[0_0_16px_rgba(255,255,255,0.9)]" />
            <span>
              {isSubmitting
                ? "正在顺序发布作品…"
                : uploadItems.length > 1
                  ? `发布 ${uploadItems.length} 个作品到 Lumen`
                  : "发布到 Lumen"}
            </span>
          </span>
        </button>

        {!canPublish ? (
          <p className="text-sm leading-6 text-muted">
            {uploadItems.length === 0
              ? "先选择至少一个图片或视频文件。"
              : batchLicenseAccepted
                ? `当前还差 ${uploadItems.filter((item) => !item.title.trim()).length} 项未补完标题。`
                : "补完标题后，只需要点击一次整批授权确认即可发布。"}
          </p>
        ) : null}

        <div
          className={cn(
            "relative overflow-hidden rounded-[28px] border px-4 py-4 text-sm leading-7 sm:px-5",
            getFormStateClassName(state),
          )}
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/75" />
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-2 h-2.5 w-2.5 shrink-0 rounded-full",
                getFormStateDotClassName(state),
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-[1.05rem] font-semibold leading-tight text-ink">
                  {getFormStateTitle(state)}
                </p>
                <span className="glass-chip px-3 py-1 text-[10px] uppercase tracking-[0.22em]">
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 max-w-[82rem] text-sm leading-7">{state.message}</p>
            </div>
          </div>
          {state.kind === "error" && shouldShowUploadDiagnostics(state.message) ? (
            <a
              className="ml-5 mt-4 inline-flex min-h-[36px] items-center justify-center rounded-full border border-red/35 bg-white/55 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-red shadow-[inset_1px_1px_1px_rgba(255,255,255,0.9),0_10px_22px_rgba(255,91,44,0.12)] transition hover:bg-red hover:text-paper sm:ml-[22px]"
              href="/api/upload/diagnostics"
              rel="noreferrer"
              target="_blank"
            >
              运行上传诊断
            </a>
          ) : null}
        </div>

        {"wallpapers" in state && state.wallpapers && state.wallpapers.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {state.wallpapers.map((wallpaper) => (
              <a
                key={wallpaper.id}
                className="inline-flex border border-ink/15 bg-paper/70 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:border-ink hover:text-ink"
                href={`/wallpaper/${wallpaper.slug}`}
              >
                查看 {wallpaper.title}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </form>
  );
}
