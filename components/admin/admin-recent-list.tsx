"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import type { Wallpaper } from "@/types/wallpaper";

type AdminRecentListProps = {
  wallpapers: Wallpaper[];
};

type RowItem = {
  wallpaper: Wallpaper;
  deleted: boolean;
  deleting: boolean;
};

function StatusBadge({ status }: { status: Wallpaper["status"] }) {
  const map: Partial<Record<Wallpaper["status"], { label: string; cls: string }>> = {
    published: { label: "已发布", cls: "bg-[rgba(23,79,80,0.1)] text-[#174f50] dark:bg-[rgba(23,79,80,0.25)] dark:text-[#8ecfd0]" },
    processing: { label: "处理中", cls: "bg-[rgba(245,200,66,0.12)] text-[#9a7c00] dark:bg-[rgba(245,200,66,0.18)] dark:text-[#f5c842]" },
    rejected: { label: "已拒", cls: "bg-red/8 text-red/80" },
  };
  const entry = map[status] ?? { label: status, cls: "bg-ink/5 text-muted/60" };
  const { label, cls } = entry;
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${cls}`}>
      {label}
    </span>
  );
}

export function AdminRecentList({ wallpapers }: AdminRecentListProps) {
  const [rows, setRows] = useState<RowItem[]>(
    wallpapers.map((w) => ({ wallpaper: w, deleted: false, deleting: false })),
  );
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.wallpaper.id === id ? { ...r, deleting: true } : r,
      ),
    );
    setConfirmId(null);

    try {
      const res = await fetch(`/api/wallpapers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
      setRows((prev) =>
        prev.map((r) =>
          r.wallpaper.id === id ? { ...r, deleted: true, deleting: false } : r,
        ),
      );
    } catch {
      setRows((prev) =>
        prev.map((r) =>
          r.wallpaper.id === id ? { ...r, deleting: false } : r,
        ),
      );
    }
  }

  const visible = rows.filter((r) => !r.deleted);

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="text-2xl opacity-20">◻</span>
        <p className="text-[13px] text-muted">暂无壁纸</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-ink/6 dark:divide-paper/8">
      {visible.map(({ wallpaper, deleting }) => {
        const thumb =
          wallpaper.files.find((f) =>
            ["thumbnail", "preview", "compressed"].some((v) =>
              f.storagePath?.includes(v),
            ),
          )?.url ??
          wallpaper.files[0]?.url ??
          null;

        const isConfirming = confirmId === wallpaper.id;

        return (
          <div
            key={wallpaper.id}
            className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-ink/[0.02] dark:hover:bg-paper/[0.03]"
          >
            {/* 缩略图 */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] bg-ink/5 dark:bg-paper/8">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={wallpaper.title ?? ""}
                  fill
                  className="object-cover"
                  sizes="44px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-muted/40">
                  ◻
                </div>
              )}
            </div>

            {/* 标题 + meta */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">
                {wallpaper.title ?? wallpaper.slug}
              </p>
              <div className="mt-1 flex items-center gap-2.5">
                <StatusBadge status={wallpaper.status} />
                <span className="font-mono text-[9px] text-muted/50">
                  ↓{wallpaper.downloadsCount ?? 0}
                </span>
                <span className="font-mono text-[9px] text-muted/50">
                  ♥{wallpaper.likesCount ?? 0}
                </span>
                <span className="font-mono text-[9px] text-muted/40">
                  {new Date(wallpaper.createdAt).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* 操作 */}
            <div className="flex shrink-0 items-center gap-2">
              <Link
                className="rounded-[8px] border border-ink/8 bg-white/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/16 hover:text-ink dark:border-paper/10 dark:bg-paper/5 dark:hover:border-paper/20"
                href={`/wallpaper/${wallpaper.slug}`}
                target="_blank"
              >
                查看
              </Link>
              <Link
                className="rounded-[8px] border border-ink/8 bg-white/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted transition hover:border-ink/16 hover:text-ink dark:border-paper/10 dark:bg-paper/5 dark:hover:border-paper/20"
                href={`/creator/studio/manage`}
              >
                编辑
              </Link>

              {isConfirming ? (
                <div className="flex items-center gap-1.5">
                  <button
                    className="rounded-[8px] border border-red/25 bg-red/8 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-red transition hover:bg-red/14 disabled:opacity-50"
                    disabled={deleting}
                    onClick={() => void handleDelete(wallpaper.id)}
                  >
                    {deleting ? "删除中" : "确认"}
                  </button>
                  <button
                    className="rounded-[8px] px-2 py-1.5 font-mono text-[9px] text-muted/50 transition hover:text-muted"
                    onClick={() => setConfirmId(null)}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  className="rounded-[8px] border border-transparent px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted/40 transition hover:border-red/20 hover:text-red/70"
                  onClick={() => setConfirmId(wallpaper.id)}
                >
                  删除
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
