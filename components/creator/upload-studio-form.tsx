"use client";

import { useState } from "react";

import type { PresignedUploadPayload, Wallpaper } from "@/types/wallpaper";
import { cn } from "@/lib/utils";

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
      wallpaper: Wallpaper;
    }
  | {
      kind: "error";
      message: string;
    };

type UploadStudioFormProps = {
  creatorEmail: string;
  creatorUsername: string;
};

type PendingFileInfo = {
  extension: string;
  name: string;
  sizeLabel: string;
};

function parseCsv(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

async function readImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      URL.revokeObjectURL(objectUrl);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("无法读取图片尺寸，请更换文件后重试。"));
    };

    image.src = objectUrl;
  });
}

export function UploadStudioForm({
  creatorEmail,
  creatorUsername,
}: UploadStudioFormProps) {
  const fieldClassName =
    "w-full border-frame border-ink bg-paper/78 px-4 py-3 text-sm outline-none transition placeholder:text-muted/75 focus:border-red focus:bg-paper";
  const [state, setState] = useState<UploadState>({
    kind: "idle",
    message: `当前已登录为 @${creatorUsername}，上传后会直接归属到你的创作者档案。`,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFileInfo | null>(null);

  const statusLabel = {
    idle: "Ready",
    submitting: "Syncing",
    success: "Published",
    error: "Needs attention",
  }[state.kind];

  const statusClassName = {
    idle: "border-paper/15 bg-paper/5 text-paper/70",
    submitting: "border-gold/30 bg-gold/10 text-gold",
    success: "border-[#6be3a5]/30 bg-[#6be3a5]/10 text-[#6be3a5]",
    error: "border-red/30 bg-red/10 text-red",
  }[state.kind];

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      setPendingFile(null);
      return;
    }

    setPendingFile({
      extension: nextFile.name.split(".").pop()?.toUpperCase() ?? "FILE",
      name: nextFile.name,
      sizeLabel: formatFileSize(nextFile.size),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileValue = formData.get("file");
    const licenseAccepted = formData.get("licenseAccepted") === "on";

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      setState({
        kind: "error",
        message: "请选择一个 JPG、PNG 或 WEBP 文件。",
      });
      return;
    }

    if (!licenseAccepted) {
      setState({
        kind: "error",
        message: "上传前请先确认你拥有这张作品的发布与展示授权。",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setState({
        kind: "submitting",
        message: "正在上传原图、生成多尺寸预览，并写入作品元数据…",
      });

      const { width, height } = await readImageDimensions(fileValue);

      const presignResponse = await fetch("/api/upload/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: fileValue.name,
          contentType: fileValue.type,
          size: fileValue.size,
        }),
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

      const uploadResponse = await fetch(presignPayload.data.presignedUrl, {
        method: presignPayload.data.method,
        headers: presignPayload.data.headers,
        body: fileValue,
      });

      if (!uploadResponse.ok) {
        throw new Error(`上传到 R2 失败，状态码 ${uploadResponse.status}。`);
      }

      const createResponse = await fetch("/api/wallpapers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          tags: parseCsv(String(formData.get("tags") ?? "")),
          colors: parseCsv(String(formData.get("colors") ?? "")),
          licenseAccepted,
          licenseVersion: "2026-04",
          original: {
            storagePath: presignPayload.data.key,
            url: presignPayload.data.publicUrl,
            size: fileValue.size,
            format: fileValue.type.split("/")[1] ?? fileValue.type,
            width,
            height,
          },
          width,
          height,
          status: "published",
        }),
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

      form.reset();
      setPendingFile(null);
      setState({
        kind: "success",
        message:
          "上传成功，原图与多尺寸变体已写入 R2；如果已配置 AI provider，系统会自动补充标签。",
        wallpaper: createPayload.data,
      });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : "上传流程失败，请稍后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
      <form
        className="bg-paper/76 relative space-y-5 overflow-hidden border-frame border-ink px-5 py-5 shadow-[14px_14px_0_0_rgba(10,8,4,0.06)] backdrop-blur md:px-7 md:py-7"
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold via-red to-transparent" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-red">
              01 — Upload Brief
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              提交标题、标签与原图文件。系统会先申请 presign，再把作品直传到
              R2，并在服务端生成多尺寸预览图。AI
              标签分析是可选增强，不会阻塞发布。
            </p>
          </div>
          <p className="border border-ink/10 bg-paper/70 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted">
            Direct to R2
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="title"
          >
            标题
          </label>
          <input
            className={fieldClassName}
            id="title"
            maxLength={120}
            name="title"
            placeholder="例如：暮色将临，万物静默"
            required
            type="text"
          />
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="description"
          >
            描述
          </label>
          <textarea
            className={`${fieldClassName} min-h-[140px]`}
            id="description"
            maxLength={2000}
            name="description"
            placeholder="补充这张壁纸的拍摄/创作背景。"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
              htmlFor="tags"
            >
              标签
            </label>
            <input
              className={fieldClassName}
              id="tags"
              name="tags"
              placeholder="自然, 暗夜, 渐变"
              type="text"
            />
          </div>

          <div>
            <label
              className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
              htmlFor="colors"
            >
              颜色
            </label>
            <input
              className={fieldClassName}
              id="colors"
              name="colors"
              placeholder="#0a0804, #d42b2b"
              type="text"
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted">
              当前创作者
            </label>
            <div className="w-full border-frame border-ink bg-paper/65 px-4 py-3 text-sm shadow-[4px_4px_0_0_rgba(10,8,4,0.04)]">
              @{creatorUsername}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted">
              登录邮箱
            </label>
            <div className="w-full border-frame border-ink bg-paper/65 px-4 py-3 text-sm shadow-[4px_4px_0_0_rgba(10,8,4,0.04)]">
              {creatorEmail}
            </div>
          </div>
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="file"
          >
            图片文件
          </label>
          <label
            className="bg-paper-2/55 group block cursor-pointer border-frame border-dashed border-ink px-4 py-5 transition hover:border-red hover:bg-paper"
            htmlFor="file"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-[32px] leading-none tracking-[-0.04em]">
                  {pendingFile ? "文件已准备就绪" : "选择一张准备发布的作品"}
                </p>
                <p className="mt-3 text-sm leading-6 text-muted">
                  {pendingFile
                    ? pendingFile.name
                    : "支持 JPG / PNG / WEBP。点按选择，也可以直接拖入这里。"}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-paper text-[24px] text-ink/55 transition group-hover:rotate-45 group-hover:border-red group-hover:text-red">
                +
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em]">
              {(pendingFile
                ? [pendingFile.extension, pendingFile.sizeLabel, "原图直传"]
                : ["自动读取尺寸", "保留原始格式", "最大 50MB"]
              ).map((item) => (
                <span
                  key={item}
                  className="border border-ink/10 bg-paper/70 px-3 py-2 text-muted"
                >
                  {item}
                </span>
              ))}
            </div>

            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="file"
              name="file"
              onChange={handleFileChange}
              required
              type="file"
            />
          </label>
        </div>

        <label className="flex items-start gap-3 border-frame border-ink bg-paper/60 px-4 py-4 text-sm leading-6 text-muted">
          <input
            className="mt-1 h-4 w-4 shrink-0 accent-ink"
            id="licenseAccepted"
            name="licenseAccepted"
            required
            type="checkbox"
          />
          <span>
            我确认自己拥有这张作品的上传、展示与分发授权，并同意 Lumen
            记录本次授权确认时间用于内容合规审计。
          </span>
        </label>

        <button
          className="inline-flex min-h-[50px] w-full items-center justify-center border-frame border-ink bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.24em] text-paper shadow-[8px_8px_0_0_rgba(10,8,4,0.08)] transition hover:-translate-y-0.5 hover:bg-red hover:shadow-[10px_10px_0_0_rgba(212,43,43,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "上传中…" : "上传到 Lumen"}
        </button>
      </form>

      <aside className="relative overflow-hidden border-frame border-ink bg-ink px-5 py-5 text-paper shadow-[14px_14px_0_0_rgba(10,8,4,0.12)] md:px-7 md:py-7">
        <div className="pointer-events-none absolute right-[-52px] top-[-52px] h-40 w-40 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-74px] left-[-74px] h-44 w-44 rounded-full bg-red/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/10 pb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
              上传状态
            </p>
            <p
              className={cn(
                "border px-3 py-2 text-[10px] uppercase tracking-[0.24em]",
                statusClassName,
              )}
            >
              {statusLabel}
            </p>
          </div>
          <p className="mt-4 text-sm leading-7 text-paper/80">
            {state.message}
          </p>
        </div>

        <div className="relative mt-6 grid gap-3">
          {[
            ["01", "确认授权", "提交前先勾选上传授权声明。"],
            ["02", "直传原图", "浏览器把文件直接送到 R2。"],
            ["03", "写入元数据", "Supabase 记录尺寸、颜色、slug 与授权时间。"],
          ].map(([index, title, description]) => (
            <div
              key={index}
              className="border-paper/12 border bg-paper/5 px-4 py-4"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">
                {index}
              </p>
              <p className="mt-2 font-display text-[25px] italic leading-none text-paper">
                {title}
              </p>
              <p className="mt-3 text-sm leading-6 text-paper/65">
                {description}
              </p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 space-y-2 border-t border-paper/10 pt-5 text-[11px] uppercase tracking-[0.2em] text-paper/45">
          <p>允许格式：JPG / PNG / WEBP</p>
          <p>单文件上限：50MB</p>
          <p>流程：Presign → 直传 R2 → 写入 Supabase</p>
        </div>

        {state.kind === "success" ? (
          <div className="relative mt-6 space-y-3 border border-paper/15 bg-paper/5 px-4 py-4">
            <p className="font-display text-[28px] italic">
              {state.wallpaper.title}
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-paper/55">
              slug: {state.wallpaper.slug}
            </p>
            <a
              className="inline-flex border border-paper/30 px-4 py-2 text-[10px] uppercase tracking-[0.22em] transition hover:border-paper hover:text-gold"
              href={`/wallpaper/${state.wallpaper.slug}`}
            >
              查看详情页
            </a>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="relative mt-6 border border-[#ff6b6b]/40 bg-[#ff6b6b]/10 px-4 py-4 text-sm text-[#ffd4d4]">
            {state.message}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
