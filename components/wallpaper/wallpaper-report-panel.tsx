"use client";

import { useState } from "react";

import type {
  WallpaperReportReason,
  WallpaperReportReceipt,
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

type WallpaperReportPanelProps = {
  identifier: string;
  isSignedIn: boolean;
};

const REPORT_REASON_OPTIONS: Array<{
  description: string;
  label: string;
  value: WallpaperReportReason;
}> = [
  {
    value: "copyright",
    label: "版权或未授权",
    description: "疑似侵权、盗用或未经允许转载。",
  },
  {
    value: "sensitive",
    label: "敏感内容",
    description: "包含不适宜公开展示的内容。",
  },
  {
    value: "misleading",
    label: "信息不符",
    description: "标题、标签或描述与图片明显不一致。",
  },
  {
    value: "spam",
    label: "垃圾或重复",
    description: "重复上传、低质灌水或明显广告。",
  },
  {
    value: "other",
    label: "其他问题",
    description: "其他需要编辑团队人工判断的问题。",
  },
];

export function WallpaperReportPanel({
  identifier,
  isSignedIn,
}: WallpaperReportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState<WallpaperReportReason>("copyright");
  const [feedback, setFeedback] = useState<{
    kind: "error" | "success";
    message: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const response = await fetch(
        `/api/wallpapers/${encodeURIComponent(identifier)}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: formData.get("reason"),
            details: formData.get("details"),
            reporterEmail: formData.get("reporterEmail"),
          }),
        },
      );
      const payload = (await response.json()) as
        | ApiSuccess<WallpaperReportReceipt>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "举报提交失败，请稍后重试。",
        );
      }

      form.reset();
      setReason("copyright");
      setFeedback({
        kind: "success",
        message:
          "举报已提交，编辑团队会在审核后台处理中。感谢你帮助维护 Lumen 的内容质量。",
      });
      setIsOpen(false);
    } catch (error) {
      setFeedback({
        kind: "error",
        message:
          error instanceof Error ? error.message : "举报提交失败，请稍后重试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 border-t border-ink/10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-red">
            Content Safety
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            如果你发现侵权、敏感或误导性内容，可以直接提交举报，编辑团队会在后台审核。
          </p>
        </div>
        <button
          className="inline-flex border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
          onClick={() => {
            setFeedback(null);
            setIsOpen((current) => !current);
          }}
          type="button"
        >
          {isOpen ? "收起举报" : "举报作品"}
        </button>
      </div>

      {isOpen ? (
        <form
          className="mt-5 space-y-4 border-frame border-ink bg-paper/70 px-4 py-4"
          onSubmit={handleSubmit}
        >
          <div>
            <label
              className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
              htmlFor="report-reason"
            >
              问题类型
            </label>
            <select
              className="w-full border-frame border-ink bg-paper px-4 py-3 text-sm outline-none transition focus:border-red"
              defaultValue="copyright"
              id="report-reason"
              name="reason"
              onChange={(event) =>
                setReason(event.target.value as WallpaperReportReason)
              }
              required
            >
              {REPORT_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-muted">
              {
                REPORT_REASON_OPTIONS.find((option) => option.value === reason)
                  ?.description
              }
            </p>
          </div>

          <div>
            <label
              className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
              htmlFor="report-details"
            >
              补充说明
            </label>
            <textarea
              className="min-h-[120px] w-full border-frame border-ink bg-paper px-4 py-3 text-sm outline-none transition placeholder:text-muted/75 focus:border-red"
              id="report-details"
              maxLength={1000}
              name="details"
              placeholder="例如：这张图与某位摄影师原作高度相似，或存在不适宜公开展示的内容。"
            />
          </div>

          {!isSignedIn ? (
            <div>
              <label
                className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
                htmlFor="report-email"
              >
                联系邮箱（选填）
              </label>
              <input
                className="w-full border-frame border-ink bg-paper px-4 py-3 text-sm outline-none transition placeholder:text-muted/75 focus:border-red"
                id="report-email"
                name="reporterEmail"
                placeholder="如果需要补充信息，编辑团队可以联系你"
                type="email"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-red disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "提交中" : "提交举报"}
            </button>
            <button
              className="inline-flex border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              取消
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? (
        <p
          className={`mt-4 text-sm ${
            feedback.kind === "success" ? "text-[#2f7d57]" : "text-red"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
