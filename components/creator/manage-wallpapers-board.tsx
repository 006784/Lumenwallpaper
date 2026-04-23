"use client";

import Link from "next/link";
import { useState } from "react";

import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperGradientKey,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { Wallpaper, WallpaperStatus } from "@/types/wallpaper";

type ApiSuccess<T> = {
  data: T;
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type ManagedWallpaperItem = {
  colorsText: string;
  description: string;
  featured: boolean;
  feedback: string | null;
  status: WallpaperStatus;
  tagsText: string;
  title: string;
  wallpaper: Wallpaper;
};

type ManageWallpapersBoardProps = {
  canModerate: boolean;
  initialWallpapers: Wallpaper[];
};

function createManagedItem(wallpaper: Wallpaper): ManagedWallpaperItem {
  return {
    wallpaper,
    title: wallpaper.title,
    description: wallpaper.description ?? "",
    tagsText: wallpaper.tags.join(", "),
    colorsText: wallpaper.colors.join(", "),
    featured: wallpaper.featured,
    status: wallpaper.status,
    feedback: null,
  };
}

function parseCsv(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ManageWallpapersBoard({
  canModerate,
  initialWallpapers,
}: ManageWallpapersBoardProps) {
  const [items, setItems] = useState(
    initialWallpapers.map((wallpaper) => createManagedItem(wallpaper)),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<
    "save" | "delete" | "analyze" | null
  >(null);

  function updateItem(
    wallpaperId: string,
    patch: Partial<Omit<ManagedWallpaperItem, "wallpaper">>,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.wallpaper.id === wallpaperId ? { ...item, ...patch } : item,
      ),
    );
  }

  async function handleSave(item: ManagedWallpaperItem) {
    setBusyId(item.wallpaper.id);
    setBusyAction("save");
    updateItem(item.wallpaper.id, {
      feedback: null,
    });

    try {
      const response = await fetch(
        `/api/wallpapers/${encodeURIComponent(item.wallpaper.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: item.title,
            description: item.description.trim() || null,
            tags: parseCsv(item.tagsText),
            colors: parseCsv(item.colorsText),
            ...(canModerate
              ? {
                  featured: item.featured,
                  status: item.status,
                }
              : {}),
          }),
        },
      );

      const payload = (await response.json()) as
        | ApiSuccess<Wallpaper>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "作品更新失败，请稍后再试。",
        );
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.wallpaper.id === item.wallpaper.id
            ? {
                ...createManagedItem(payload.data),
                feedback: "已保存最新元数据。",
              }
            : currentItem,
        ),
      );
    } catch (error) {
      updateItem(item.wallpaper.id, {
        feedback:
          error instanceof Error ? error.message : "作品更新失败，请稍后再试。",
      });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleDelete(item: ManagedWallpaperItem) {
    if (
      !window.confirm(`确认删除《${item.wallpaper.title}》吗？此操作无法撤销。`)
    ) {
      return;
    }

    setBusyId(item.wallpaper.id);
    setBusyAction("delete");

    try {
      const response = await fetch(
        `/api/wallpapers/${encodeURIComponent(item.wallpaper.id)}`,
        {
          method: "DELETE",
        },
      );
      const payload = (await response.json()) as
        | ApiSuccess<{ id: string }>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "作品删除失败，请稍后再试。",
        );
      }

      setItems((current) =>
        current.filter(
          (currentItem) => currentItem.wallpaper.id !== item.wallpaper.id,
        ),
      );
    } catch (error) {
      updateItem(item.wallpaper.id, {
        feedback:
          error instanceof Error ? error.message : "作品删除失败，请稍后再试。",
      });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  async function handleAnalyze(item: ManagedWallpaperItem) {
    setBusyId(item.wallpaper.id);
    setBusyAction("analyze");
    updateItem(item.wallpaper.id, {
      feedback: "正在调用 AI 识图兜底链路…",
    });

    try {
      const response = await fetch(
        `/api/wallpapers/${encodeURIComponent(item.wallpaper.id)}/analyze`,
        {
          method: "POST",
        },
      );
      const payload = (await response.json()) as
        | ApiSuccess<Wallpaper>
        | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "AI 分析失败，请稍后再试。",
        );
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.wallpaper.id === item.wallpaper.id
            ? {
                ...createManagedItem(payload.data),
                feedback:
                  payload.data.aiAnalysisStatus === "completed"
                    ? "AI 标签已刷新。"
                    : "AI 分析已完成，但当前没有可用标签。",
              }
            : currentItem,
        ),
      );
    } catch (error) {
      updateItem(item.wallpaper.id, {
        feedback:
          error instanceof Error ? error.message : "AI 分析失败，请稍后再试。",
      });
    } finally {
      setBusyId(null);
      setBusyAction(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="border-frame border-ink bg-paper/70 px-6 py-12 text-sm leading-7 text-muted">
        {canModerate
          ? "当前还没有任何作品进入管理台。等上传或导入完成后，这里会显示全站作品。"
          : "你还没有发布任何作品。先去上传一张，管理台就会自动开始显示。"}
        <div className="mt-4">
          <Link
            className="inline-flex border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-red"
            href="/creator/studio"
          >
            去上传作品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {items.map((item) => {
        const previewUrl = getWallpaperPreviewUrl(item.wallpaper);
        const artworkStyle = previewUrl
          ? {
              backgroundImage: `linear-gradient(to top, rgba(10,8,4,0.12), rgba(10,8,4,0.12)), url("${previewUrl}")`,
              backgroundPosition: "center",
              backgroundSize: "cover",
            }
          : {
              backgroundImage:
                GRADIENTS[getWallpaperGradientKey(item.wallpaper)],
            };
        const isBusy = busyId === item.wallpaper.id;

        return (
          <article
            key={item.wallpaper.id}
            className="grid gap-5 border-frame border-ink bg-paper/75 p-5 shadow-[14px_14px_0_0_rgba(10,8,4,0.06)] md:grid-cols-[220px_1fr]"
          >
            <div className="space-y-4">
              <div
                className="aspect-[4/5] border-frame border-ink"
                style={artworkStyle}
              />
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
                <span className="border border-ink/10 bg-paper px-3 py-2 text-muted">
                  {item.status}
                </span>
                {item.featured ? (
                  <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
                    featured
                  </span>
                ) : null}
                {item.wallpaper.reportsCount > 0 ? (
                  <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
                    举报 {item.wallpaper.reportsCount}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-4">
                <div>
                  <p className="font-display text-[30px] italic leading-none">
                    {item.wallpaper.title}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-muted">
                    {getWallpaperMeta(item.wallpaper)} · slug{" "}
                    {item.wallpaper.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:bg-ink hover:text-paper"
                    href={`/wallpaper/${item.wallpaper.slug}`}
                    target="_blank"
                  >
                    查看详情
                  </Link>
                  <button
                    className="inline-flex border border-gold/25 bg-gold/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-gold transition hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void handleAnalyze(item)}
                    type="button"
                  >
                    {isBusy && busyAction === "analyze"
                      ? "分析中…"
                      : "重跑 AI 标签"}
                  </button>
                  <button
                    className="inline-flex border border-red/25 bg-red/5 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-red transition hover:bg-red hover:text-paper disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void handleDelete(item)}
                    type="button"
                  >
                    {isBusy && busyAction === "delete" ? "删除中…" : "删除作品"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-ink/10 bg-paper/65 px-4 py-4 text-sm leading-6 text-muted md:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                    AI Metadata
                  </p>
                  <p className="mt-2">
                    状态：{item.wallpaper.aiAnalysisStatus}
                    {item.wallpaper.aiProvider
                      ? ` · ${item.wallpaper.aiProvider}`
                      : ""}
                    {item.wallpaper.aiModel
                      ? ` · ${item.wallpaper.aiModel}`
                      : ""}
                  </p>
                  {item.wallpaper.aiCaption ? (
                    <p className="mt-2">描述：{item.wallpaper.aiCaption}</p>
                  ) : null}
                  {item.wallpaper.aiTags.length > 0 ? (
                    <p className="mt-2">
                      标签：{item.wallpaper.aiTags.join("，")}
                    </p>
                  ) : null}
                  {item.wallpaper.aiAnalysisError ? (
                    <p className="mt-2 text-red">
                      失败信息：{item.wallpaper.aiAnalysisError}
                    </p>
                  ) : null}
                </div>
                <div className="rounded-[22px] border border-ink/10 bg-paper/65 px-4 py-4 text-sm leading-6 text-muted md:col-span-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted">
                    Content Safety
                  </p>
                  <p className="mt-2">
                    上传授权：
                    {item.wallpaper.licenseConfirmedAt
                      ? ` 已确认 ${new Date(
                          item.wallpaper.licenseConfirmedAt,
                        ).toLocaleDateString("zh-CN")}`
                      : " 未记录"}
                  </p>
                  <p className="mt-2">举报累计：{item.wallpaper.reportsCount}</p>
                  {item.wallpaper.lastReportedAt ? (
                    <p className="mt-2">
                      最近举报：
                      {new Date(item.wallpaper.lastReportedAt).toLocaleDateString(
                        "zh-CN",
                      )}
                    </p>
                  ) : null}
                  {item.wallpaper.reportsCount > 0 ? (
                    <p className="mt-2 text-red">
                      这张作品已经进入内容安全视野，必要时请联系编辑处理。
                    </p>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <label
                    className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                    htmlFor={`title-${item.wallpaper.id}`}
                  >
                    标题
                  </label>
                  <input
                    className="w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                    id={`title-${item.wallpaper.id}`}
                    maxLength={120}
                    onChange={(event) =>
                      updateItem(item.wallpaper.id, {
                        title: event.target.value,
                      })
                    }
                    type="text"
                    value={item.title}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                    htmlFor={`description-${item.wallpaper.id}`}
                  >
                    描述
                  </label>
                  <textarea
                    className="min-h-[120px] w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                    id={`description-${item.wallpaper.id}`}
                    onChange={(event) =>
                      updateItem(item.wallpaper.id, {
                        description: event.target.value,
                      })
                    }
                    value={item.description}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                    htmlFor={`tags-${item.wallpaper.id}`}
                  >
                    标签
                  </label>
                  <input
                    className="w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                    id={`tags-${item.wallpaper.id}`}
                    onChange={(event) =>
                      updateItem(item.wallpaper.id, {
                        tagsText: event.target.value,
                      })
                    }
                    type="text"
                    value={item.tagsText}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                    htmlFor={`colors-${item.wallpaper.id}`}
                  >
                    颜色
                  </label>
                  <input
                    className="w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                    id={`colors-${item.wallpaper.id}`}
                    onChange={(event) =>
                      updateItem(item.wallpaper.id, {
                        colorsText: event.target.value,
                      })
                    }
                    type="text"
                    value={item.colorsText}
                  />
                </div>

                {canModerate ? (
                  <>
                    <div>
                      <label
                        className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-muted"
                        htmlFor={`status-${item.wallpaper.id}`}
                      >
                        状态
                      </label>
                      <select
                        className="w-full border-frame border-ink bg-paper px-4 py-3 outline-none transition focus:border-red"
                        id={`status-${item.wallpaper.id}`}
                        onChange={(event) =>
                          updateItem(item.wallpaper.id, {
                            status: event.target.value as WallpaperStatus,
                          })
                        }
                        value={item.status}
                      >
                        <option value="published">published</option>
                        <option value="processing">processing</option>
                        <option value="rejected">rejected</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-3 border-frame border-ink bg-paper px-4 py-3">
                      <input
                        checked={item.featured}
                        id={`featured-${item.wallpaper.id}`}
                        onChange={(event) =>
                          updateItem(item.wallpaper.id, {
                            featured: event.target.checked,
                          })
                        }
                        type="checkbox"
                      />
                      <label
                        className="text-[11px] uppercase tracking-[0.22em] text-muted"
                        htmlFor={`featured-${item.wallpaper.id}`}
                      >
                        加入编辑精选
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="border border-ink/10 bg-paper/60 px-4 py-4 text-sm leading-6 text-muted md:col-span-2">
                    状态和精选位属于审核字段，只能由编辑账号调整。当前状态：
                    <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
                      {item.status}
                    </span>
                    {item.featured ? (
                      <span className="ml-2 text-red">已进入编辑精选</span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 pt-4">
                <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
                  <span>下载 {item.wallpaper.downloadsCount}</span>
                  <span>收藏 {item.wallpaper.likesCount}</span>
                  <span>
                    创建于{" "}
                    {new Date(item.wallpaper.createdAt).toLocaleDateString(
                      "zh-CN",
                    )}
                  </span>
                </div>

                <button
                  className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:bg-red disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isBusy}
                  onClick={() => void handleSave(item)}
                  type="button"
                >
                  {isBusy && busyAction === "save" ? "保存中…" : "保存修改"}
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
  );
}
