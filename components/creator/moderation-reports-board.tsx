"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperGradientKey,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { WallpaperReport, WallpaperStatus } from "@/types/wallpaper";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type ModeratedReportItem = {
  feedback: string | null;
  report: WallpaperReport;
  reviewNote: string;
};

type ModerationReportsBoardProps = {
  initialReports: WallpaperReport[];
};

const REPORT_REASON_LABELS: Record<WallpaperReport["reason"], string> = {
  copyright: "版权或未授权",
  sensitive: "敏感内容",
  spam: "垃圾或重复",
  misleading: "信息不符",
  other: "其他问题",
};

function createModeratedItem(report: WallpaperReport): ModeratedReportItem {
  return {
    report,
    reviewNote: report.reviewNote ?? "",
    feedback: null,
  };
}

export function ModerationReportsBoard({
  initialReports,
}: ModerationReportsBoardProps) {
  const [items, setItems] = useState(
    initialReports.map((report) => createModeratedItem(report)),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const summary = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        accumulator.total += 1;
        accumulator[item.report.status] += 1;
        return accumulator;
      },
      {
        total: 0,
        pending: 0,
        reviewing: 0,
        resolved: 0,
        dismissed: 0,
      },
    );
  }, [items]);
  const selectedCount = selectedIds.length;

  useEffect(() => {
    const availableIds = new Set(items.map((item) => item.report.id));
    setSelectedIds((current) =>
      current.filter((reportId) => availableIds.has(reportId)),
    );
  }, [items]);

  function updateItem(
    reportId: string,
    patch: Partial<Omit<ModeratedReportItem, "report">>,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.report.id === reportId ? { ...item, ...patch } : item,
      ),
    );
  }

  async function handleAction(
    item: ModeratedReportItem,
    payload: {
      status: WallpaperReport["status"];
      wallpaperStatus?: WallpaperStatus;
    },
    pendingLabel: string,
    successLabel: string,
  ) {
    setBusyId(item.report.id);
    updateItem(item.report.id, {
      feedback: pendingLabel,
    });

    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(item.report.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: payload.status,
          wallpaperStatus: payload.wallpaperStatus,
          reviewNote: item.reviewNote.trim() || null,
        }),
      });
      const data = (await response.json()) as
        | ApiSuccess<WallpaperReport>
        | ApiFailure;

      if (!response.ok || !("data" in data)) {
        throw new Error("error" in data ? data.error : "审核操作失败，请稍后再试。");
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.report.id === item.report.id
            ? {
                ...createModeratedItem(data.data),
                feedback: successLabel,
              }
            : currentItem,
        ),
      );
    } catch (error) {
      updateItem(item.report.id, {
        feedback:
          error instanceof Error ? error.message : "审核操作失败，请稍后再试。",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleBatchAction(
    payload: {
      status: WallpaperReport["status"];
      wallpaperStatus?: WallpaperStatus;
    },
    pendingLabel: string,
    successLabel: string,
  ) {
    if (selectedIds.length === 0) {
      return;
    }

    setBusyId("batch");
    setItems((current) =>
      current.map((item) =>
        selectedIds.includes(item.report.id)
          ? {
              ...item,
              feedback: pendingLabel,
            }
          : item,
      ),
    );

    try {
      const response = await fetch("/api/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportIds: selectedIds,
          status: payload.status,
          wallpaperStatus: payload.wallpaperStatus,
        }),
      });
      const data = (await response.json()) as
        | ApiSuccess<WallpaperReport[]>
        | ApiFailure;

      if (!response.ok || !("data" in data)) {
        throw new Error("error" in data ? data.error : "批量审核失败，请稍后再试。");
      }

      const updatedMap = new Map(
        data.data.map((report) => [report.id, createModeratedItem(report)]),
      );

      setItems((current) =>
        current.map((item) =>
          updatedMap.has(item.report.id)
            ? {
                ...updatedMap.get(item.report.id)!,
                feedback: successLabel,
              }
            : item,
        ),
      );
      setSelectedIds([]);
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          selectedIds.includes(item.report.id)
            ? {
                ...item,
                feedback:
                  error instanceof Error
                    ? error.message
                    : "批量审核失败，请稍后再试。",
              }
            : item,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  function toggleSelection(reportId: string) {
    setSelectedIds((current) =>
      current.includes(reportId)
        ? current.filter((id) => id !== reportId)
        : [...current, reportId],
    );
  }

  function toggleSelectAll() {
    setSelectedIds((current) =>
      current.length === items.length ? [] : items.map((item) => item.report.id),
    );
  }

  if (items.length === 0) {
    return (
      <div className="border-frame border-ink bg-paper/70 px-6 py-12 text-sm leading-7 text-muted">
        当前没有待处理的举报。内容安全面板已经就绪，新的举报会自动出现在这里。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-5">
        {[
          ["总数", String(summary.total), "text-ink"],
          ["待处理", String(summary.pending), "text-red"],
          ["审查中", String(summary.reviewing), "text-gold"],
          ["已解决", String(summary.resolved), "text-[#2f7d57]"],
          ["已忽略", String(summary.dismissed), "text-muted"],
        ].map(([label, value, tone]) => (
          <div
            key={label}
            className="border-frame border-ink bg-paper/72 px-4 py-4"
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
              {label}
            </p>
            <p className={`mt-3 font-display text-[34px] italic ${tone}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="border-frame border-ink bg-paper/72 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
            <button
              className="border border-ink/15 bg-paper px-3 py-2 transition hover:bg-ink hover:text-paper"
              onClick={toggleSelectAll}
              type="button"
            >
              {selectedCount === items.length ? "取消全选" : "全选当前列表"}
            </button>
            <span>已选 {selectedCount}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="inline-flex border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedCount === 0 || busyId === "batch"}
              onClick={() =>
                void handleBatchAction(
                  { status: "reviewing" },
                  "正在批量标记为审查中…",
                  "已批量标记为审查中。",
                )
              }
              type="button"
            >
              批量审查中
            </button>
            <button
              className="inline-flex border border-red/20 bg-red/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-red transition hover:bg-red hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedCount === 0 || busyId === "batch"}
              onClick={() =>
                void handleBatchAction(
                  { status: "resolved", wallpaperStatus: "rejected" },
                  "正在批量下架作品…",
                  "已批量下架作品。",
                )
              }
              type="button"
            >
              批量下架
            </button>
            <button
              className="inline-flex border border-gold/20 bg-gold/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedCount === 0 || busyId === "batch"}
              onClick={() =>
                void handleBatchAction(
                  { status: "resolved", wallpaperStatus: "published" },
                  "正在批量保留公开状态…",
                  "已批量保留公开状态。",
                )
              }
              type="button"
            >
              批量保持公开
            </button>
            <button
              className="inline-flex border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedCount === 0 || busyId === "batch"}
              onClick={() =>
                void handleBatchAction(
                  { status: "dismissed" },
                  "正在批量忽略举报…",
                  "已批量忽略举报。",
                )
              }
              type="button"
            >
              批量忽略
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {items.map((item) => {
          const wallpaper = item.report.wallpaper;
          const previewUrl = wallpaper ? getWallpaperPreviewUrl(wallpaper) : null;
          const artworkStyle = wallpaper
            ? previewUrl
              ? {
                  backgroundImage: `linear-gradient(to top, rgba(10,8,4,0.14), rgba(10,8,4,0.14)), url("${previewUrl}")`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                }
              : {
                  backgroundImage: GRADIENTS[getWallpaperGradientKey(wallpaper)],
                }
            : {
                background:
                  "linear-gradient(135deg, rgba(10,8,4,0.08), rgba(212,43,43,0.08))",
              };
          const isBusy = busyId === item.report.id || busyId === "batch";
          const isSelected = selectedIds.includes(item.report.id);

          return (
            <article
              key={item.report.id}
              className="grid gap-5 border-frame border-ink bg-paper/75 p-5 shadow-[14px_14px_0_0_rgba(10,8,4,0.06)] lg:grid-cols-[220px_1fr]"
            >
              <div className="space-y-4">
                <label className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                  <input
                    checked={isSelected}
                    disabled={busyId === "batch"}
                    onChange={() => toggleSelection(item.report.id)}
                    type="checkbox"
                  />
                  选中这条举报
                </label>
                <div
                  className="aspect-[4/5] border-frame border-ink"
                  style={artworkStyle}
                />
                <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                  <span className="border border-ink/10 bg-paper px-3 py-2 text-muted">
                    {item.report.status}
                  </span>
                  <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
                    {REPORT_REASON_LABELS[item.report.reason]}
                  </span>
                  {wallpaper ? (
                    <span className="border border-ink/10 bg-paper px-3 py-2 text-muted">
                      {wallpaper.status}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <p className="font-display text-[30px] italic leading-none">
                      {wallpaper?.title ?? "关联作品已删除"}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted">
                      举报于{" "}
                      {new Date(item.report.createdAt).toLocaleDateString("zh-CN")}
                      {wallpaper?.creator?.username
                        ? ` · by @${wallpaper.creator.username}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wallpaper ? (
                      <Link
                        className="inline-flex border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:bg-ink hover:text-paper"
                        href={`/wallpaper/${wallpaper.slug}`}
                        target="_blank"
                      >
                        查看详情页
                      </Link>
                    ) : null}
                    {wallpaper?.creator?.username ? (
                      <Link
                        className="inline-flex border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:bg-ink hover:text-paper"
                        href={`/creator/${wallpaper.creator.username}`}
                        target="_blank"
                      >
                        查看创作者
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[22px] border border-ink/10 bg-paper/65 px-4 py-4 text-sm leading-6 text-muted">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      举报内容
                    </p>
                    <p className="mt-2">
                      类型：{REPORT_REASON_LABELS[item.report.reason]}
                    </p>
                    {item.report.details ? (
                      <p className="mt-2">说明：{item.report.details}</p>
                    ) : null}
                    <p className="mt-2">
                      举报者：
                      {item.report.reporter?.username
                        ? ` @${item.report.reporter.username}`
                        : item.report.reporterEmail ?? "匿名访客"}
                    </p>
                    {item.report.reporterIp ? (
                      <p className="mt-2">来源：{item.report.reporterIp}</p>
                    ) : null}
                  </div>

                  <div className="rounded-[22px] border border-ink/10 bg-paper/65 px-4 py-4 text-sm leading-6 text-muted">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                      当前作品信息
                    </p>
                    <p className="mt-2">
                      状态：{wallpaper?.status ?? "missing"}
                    </p>
                    {wallpaper ? (
                      <>
                        <p className="mt-2">举报累计：{wallpaper.reportsCount}</p>
                        <p className="mt-2">
                          授权：
                          {wallpaper.licenseConfirmedAt
                            ? ` 已确认 ${new Date(
                                wallpaper.licenseConfirmedAt,
                              ).toLocaleDateString("zh-CN")}`
                            : " 未记录"}
                        </p>
                      </>
                    ) : null}
                    {item.report.reviewedAt ? (
                      <p className="mt-2">
                        最近审核：
                        {new Date(item.report.reviewedAt).toLocaleDateString(
                          "zh-CN",
                        )}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:col-span-2">
                    <label
                      className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                      htmlFor={`review-note-${item.report.id}`}
                    >
                      审核备注
                    </label>
                    <textarea
                      className="min-h-[120px] w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                      id={`review-note-${item.report.id}`}
                      onChange={(event) =>
                        updateItem(item.report.id, {
                          reviewNote: event.target.value,
                        })
                      }
                      value={item.reviewNote}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-4">
                  <button
                    className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() =>
                      void handleAction(
                        item,
                        { status: "reviewing" },
                        "正在标记为审查中…",
                        "已标记为审查中。",
                      )
                    }
                    type="button"
                  >
                    审查中
                  </button>
                  <button
                    className="inline-flex min-h-[44px] items-center justify-center border-frame border-red bg-red px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy || !wallpaper}
                    onClick={() =>
                      void handleAction(
                        item,
                        {
                          status: "resolved",
                          wallpaperStatus: "rejected",
                        },
                        "正在下架作品…",
                        "作品已下架，举报状态已更新为已解决。",
                      )
                    }
                    type="button"
                  >
                    下架作品
                  </button>
                  <button
                    className="inline-flex min-h-[44px] items-center justify-center border-frame border-gold bg-gold px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy || !wallpaper}
                    onClick={() =>
                      void handleAction(
                        item,
                        {
                          status: "resolved",
                          wallpaperStatus: "published",
                        },
                        "正在保留公开状态…",
                        "已保留作品公开状态，并标记为已解决。",
                      )
                    }
                    type="button"
                  >
                    保持公开
                  </button>
                  <button
                    className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink bg-transparent px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() =>
                      void handleAction(
                        item,
                        { status: "dismissed" },
                        "正在忽略举报…",
                        "已忽略这条举报。",
                      )
                    }
                    type="button"
                  >
                    忽略举报
                  </button>
                </div>

                {item.feedback ? (
                  <p className="text-sm text-red">{item.feedback}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
