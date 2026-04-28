import Link from "next/link";
import { redirect } from "next/navigation";

import { ModerationReportsBoard } from "@/components/creator/moderation-reports-board";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import {
  getCurrentUser,
  isAuthConfigured,
  isEditorUser,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getWallpaperReportCounts, listWallpaperReports } from "@/lib/wallpapers";
import type { WallpaperReportReason } from "@/types/wallpaper";

type CreatorStudioModerationPageProps = {
  searchParams?: {
    creator?: string;
    q?: string;
    reason?: string;
    status?: string;
  };
};

const MODERATION_FILTERS = [
  {
    label: "Open",
    value: "open",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Reviewing",
    value: "reviewing",
  },
  {
    label: "Resolved",
    value: "resolved",
  },
  {
    label: "Dismissed",
    value: "dismissed",
  },
  {
    label: "All",
    value: "all",
  },
] as const;

const REPORT_REASON_FILTERS: Array<{
  label: string;
  value: WallpaperReportReason | "all";
}> = [
  {
    label: "全部类型",
    value: "all",
  },
  {
    label: "版权",
    value: "copyright",
  },
  {
    label: "敏感内容",
    value: "sensitive",
  },
  {
    label: "垃圾重复",
    value: "spam",
  },
  {
    label: "信息不符",
    value: "misleading",
  },
  {
    label: "其他",
    value: "other",
  },
];

export default async function CreatorStudioModerationPage({
  searchParams,
}: CreatorStudioModerationPageProps) {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="审核后台依赖登录态。先补齐 NEXTAUTH_SECRET，再从这里继续。"
        eyebrow="Moderation"
        title="审核后台尚未启用"
      />
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <PagePlaceholder
        description="举报审核需要连接 Supabase 才能读取举报记录与作品状态。先补齐本地的 Supabase 环境变量。"
        eyebrow="Moderation"
        title="数据环境尚未连接"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/creator/studio/moderation");
  }

  if (!isEditorUser(currentUser)) {
    return (
      <PagePlaceholder
        description="当前账号不在编辑审核白名单中。把你的邮箱或用户名加入环境变量后，这里就会开放。"
        eyebrow="Moderation"
        primaryHref="/creator/studio/manage"
        primaryLabel="返回管理台"
        title="你还没有审核权限"
      />
    );
  }

  const statusFilter = (() => {
    const candidate = searchParams?.status;

    if (
      candidate === "all" ||
      candidate === "open" ||
      candidate === "pending" ||
      candidate === "reviewing" ||
      candidate === "resolved" ||
      candidate === "dismissed"
    ) {
      return candidate;
    }

    return "open";
  })();
  const searchQuery = searchParams?.q?.trim() ?? "";
  const creatorQuery = searchParams?.creator?.trim() ?? "";
  const reasonFilter = (() => {
    const candidate = searchParams?.reason;

    if (
      candidate === "all" ||
      candidate === "copyright" ||
      candidate === "sensitive" ||
      candidate === "spam" ||
      candidate === "misleading" ||
      candidate === "other"
    ) {
      return candidate;
    }

    return "all";
  })();
  const reports = await listWallpaperReports({
    creator: creatorQuery || undefined,
    reason: reasonFilter,
    status: statusFilter,
    search: searchQuery || undefined,
    limit: 50,
  });
  const counts = await getWallpaperReportCounts();

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Moderation Desk
        </p>
        <h1 className="max-w-4xl font-body text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[1.02]">
          处理版权、敏感内容与误导性举报
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里是内容安全审核台。编辑可以查看最新举报、记录审核备注，并同步调整作品的公开状态。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="glass-chip-active px-3 py-2">
            @{currentUser.username}
          </span>
          <span className="glass-chip px-3 py-2">
            Showing {reports.length}
          </span>
          <span className="glass-chip px-3 py-2">
            Editor Allowlist
          </span>
          <span className="glass-chip px-3 py-2 text-red">
            Review Notes Enabled
          </span>
        </div>

        <form className="mt-8 grid gap-3 md:grid-cols-[1fr_240px_180px_auto]" method="get">
          <input
            className="glass-field w-full px-4 py-3 text-sm outline-none transition placeholder:text-muted/75"
            defaultValue={searchQuery}
            name="q"
            placeholder="搜索标题、举报说明、举报邮箱"
            type="search"
          />
          <input
            className="glass-field w-full px-4 py-3 text-sm outline-none transition placeholder:text-muted/75"
            defaultValue={creatorQuery}
            name="creator"
            placeholder="按创作者用户名过滤"
            type="search"
          />
          <select
            className="glass-field w-full px-4 py-3 text-sm outline-none transition"
            defaultValue={reasonFilter}
            name="reason"
          >
            {REPORT_REASON_FILTERS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
          <input name="status" type="hidden" value={statusFilter} />
          <button
            className="glass-primary inline-flex min-h-[48px] items-center justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em]"
            type="submit"
          >
            应用筛选
          </button>
        </form>

        <div className="mt-8 grid gap-3 md:grid-cols-6">
          {[
            ["总数", String(counts.total), "text-ink"],
            ["开放中", String(counts.open), "text-red"],
            ["待处理", String(counts.pending), "text-muted"],
            ["审查中", String(counts.reviewing), "text-gold"],
            ["已解决", String(counts.resolved), "text-[#2f7d57]"],
            ["已忽略", String(counts.dismissed), "text-muted"],
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className="glass-surface-soft px-4 py-4"
            >
              <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
                {label}
              </p>
              <p className={`mt-3 font-body text-[30px] font-semibold ${tone}`}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
          {MODERATION_FILTERS.map((filter) => {
            const isActive = filter.value === statusFilter;
            const params = new URLSearchParams();

            if (filter.value !== "open") {
              params.set("status", filter.value);
            }

            if (searchQuery) {
              params.set("q", searchQuery);
            }

            if (creatorQuery) {
              params.set("creator", creatorQuery);
            }

            if (reasonFilter !== "all") {
              params.set("reason", reasonFilter);
            }

            const href = params.size
              ? `/creator/studio/moderation?${params.toString()}`
              : "/creator/studio/moderation";

            return (
              <Link
                key={filter.value}
                className={`border px-3 py-2 transition ${
                  isActive
                    ? "glass-chip-active"
                    : "glass-chip text-muted hover:text-ink"
                }`}
                href={href}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-12">
          <ModerationReportsBoard initialReports={reports} />
        </div>
      </div>
    </section>
  );
}
