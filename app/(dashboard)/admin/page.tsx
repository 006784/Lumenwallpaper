import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminRecentList } from "@/components/admin/admin-recent-list";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import {
  getCurrentUser,
  isAuthConfigured,
  isEditorUser,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getWallpaperReportCounts,
  listManagedWallpapers,
} from "@/lib/wallpapers";

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default async function AdminPage() {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        eyebrow="Admin"
        title="认证环境未配置"
        description="管理台需要 NEXTAUTH_SECRET。"
      />
    );
  }

  const currentUser = getCurrentUser();
  if (!currentUser) redirect("/login?next=/admin");

  const isEditor = isEditorUser(currentUser);

  if (!isSupabaseConfigured()) {
    return (
      <PagePlaceholder
        eyebrow="Admin"
        title="数据库未连接"
        description="管理台需要 Supabase 环境变量。"
      />
    );
  }

  const [wallpapers, reportCounts] = await Promise.all([
    listManagedWallpapers(currentUser.id, { includeAll: isEditor }),
    isEditor ? getWallpaperReportCounts() : Promise.resolve(null),
  ]);

  const totalDownloads = wallpapers.reduce(
    (s, w) => s + (w.downloadsCount ?? 0),
    0,
  );
  const totalLikes = wallpapers.reduce((s, w) => s + (w.likesCount ?? 0), 0);
  const publishedCount = wallpapers.filter(
    (w) => w.status === "published",
  ).length;
  const processingCount = wallpapers.filter(
    (w) => w.status === "processing",
  ).length;

  const recentWallpapers = wallpapers.slice(0, 30);

  const stats = [
    {
      value: fmt(publishedCount),
      label: "已发布壁纸",
      sub: `共 ${wallpapers.length} 件`,
      accent: false,
    },
    {
      value: fmt(totalDownloads),
      label: "累计下载",
      sub: "全部作品",
      accent: false,
    },
    {
      value: fmt(totalLikes),
      label: "累计收藏",
      sub: "全部作品",
      accent: false,
    },
    {
      value: reportCounts ? String(reportCounts.open) : "—",
      label: "待处理举报",
      sub: reportCounts ? `共 ${reportCounts.total} 条` : "需编辑权限",
      accent: (reportCounts?.open ?? 0) > 0,
    },
  ];

  const actions = [
    {
      icon: "↑",
      title: "上传作品",
      desc: "直传 R2，绑定创作者身份",
      href: "/creator/studio",
      primary: true,
    },
    {
      icon: "≡",
      title: "管理作品",
      desc: "编辑元数据、标记精选、下架",
      href: "/creator/studio/manage",
      primary: false,
    },
    ...(isEditor
      ? [
          {
            icon: "⚑",
            title: "内容审核",
            desc: `${reportCounts?.open ?? 0} 条待处理举报`,
            href: "/creator/studio/moderation",
            primary: false,
          },
          {
            icon: "⊕",
            title: "R2 批量导入",
            desc: "从存储桶一键导入",
            href: "/creator/studio/import",
            primary: false,
          },
        ]
      : []),
    {
      icon: "◎",
      title: "个人库",
      desc: "收藏与下载历史",
      href: "/library",
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen px-4 pb-24 pt-24 md:px-10 md:pt-32">
      <div className="mx-auto max-w-6xl">

        {/* ── 页头 ── */}
        <div className="mb-12">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
            Admin · 管理台
          </p>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.6rem)] font-medium leading-tight tracking-tight text-ink">
            {isEditor ? "平台总览" : "创作者后台"}
          </h1>
          <p className="mt-2 text-[13px] text-muted">
            @{currentUser.username}
            {isEditor ? (
              <span className="ml-2 inline-block rounded-full border border-red/20 bg-red/8 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-red/70">
                Editor
              </span>
            ) : null}
          </p>
        </div>

        {/* ── 统计卡片 ── */}
        <div className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ value, label, sub, accent }) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-[20px] border px-5 py-5 ${
                accent
                  ? "border-red/20 bg-red/5 dark:border-red/25 dark:bg-red/8"
                  : "border-ink/8 bg-white/55 dark:border-paper/10 dark:bg-paper/6"
              }`}
            >
              {accent && (
                <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,rgba(212,43,43,0.6),transparent)]" />
              )}
              <p
                className={`font-mono text-[2rem] font-medium leading-none ${accent ? "text-red" : "text-ink"}`}
              >
                {value}
              </p>
              <p className="mt-2 text-[11px] font-medium text-ink/80">{label}</p>
              <p className="mt-0.5 font-mono text-[9px] text-muted/50">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ── 最近上传 ── */}
          <div className="overflow-hidden rounded-[22px] border border-ink/8 bg-white/55 dark:border-paper/10 dark:bg-paper/6">
            {/* 表头 */}
            <div className="flex items-center justify-between border-b border-ink/6 px-5 py-4 dark:border-paper/8">
              <div className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red/60" />
                <p className="text-[12px] font-semibold text-ink">
                  最近上传
                  <span className="ml-2 font-mono text-[10px] font-normal text-muted/50">
                    ({recentWallpapers.length})
                  </span>
                </p>
              </div>
              <Link
                className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted/50 transition hover:text-muted"
                href="/creator/studio/manage"
              >
                全部 →
              </Link>
            </div>

            <AdminRecentList wallpapers={recentWallpapers} />
          </div>

          {/* ── 快捷操作 ── */}
          <div className="flex flex-col gap-3">
            <div className="rounded-[22px] border border-ink/8 bg-white/55 p-5 dark:border-paper/10 dark:bg-paper/6">
              <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-red/60" />
                快捷操作
              </p>
              <div className="flex flex-col gap-2">
                {actions.map(({ icon, title, desc, href, primary }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3.5 rounded-[14px] border px-4 py-3.5 transition ${
                      primary
                        ? "border-ink/12 bg-ink text-paper hover:bg-ink/90 dark:border-paper/20 dark:bg-paper dark:text-ink dark:hover:bg-paper/90"
                        : "border-ink/8 bg-white/40 hover:border-ink/16 hover:bg-white/70 dark:border-paper/10 dark:bg-paper/5 dark:hover:border-paper/18 dark:hover:bg-paper/10"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[14px] ${
                        primary
                          ? "bg-white/15 text-paper dark:bg-ink/15 dark:text-ink"
                          : "bg-ink/6 text-ink dark:bg-paper/10 dark:text-paper"
                      }`}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] font-medium ${primary ? "text-paper dark:text-ink" : "text-ink"}`}
                      >
                        {title}
                      </p>
                      <p
                        className={`mt-0.5 truncate text-[11px] ${primary ? "text-paper/60 dark:text-ink/60" : "text-muted"}`}
                      >
                        {desc}
                      </p>
                    </div>
                    <span
                      className={`text-[12px] opacity-30 transition group-hover:opacity-70 ${primary ? "text-paper dark:text-ink" : "text-ink"}`}
                    >
                      →
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* 处理中提示 */}
            {processingCount > 0 && (
              <div className="rounded-[16px] border border-[rgba(245,200,66,0.3)] bg-[rgba(245,200,66,0.08)] px-4 py-4 dark:border-[rgba(245,200,66,0.2)] dark:bg-[rgba(245,200,66,0.06)]">
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#9a7c00] dark:text-[#f5c842]">
                  待审核
                </p>
                <p className="mt-1.5 text-[13px] font-medium text-ink">
                  {processingCount} 件作品处理中
                </p>
                <Link
                  className="mt-2.5 inline-flex items-center gap-1 font-mono text-[10px] text-[#9a7c00] underline decoration-[rgba(154,124,0,0.3)] underline-offset-4 transition hover:decoration-[rgba(154,124,0,0.6)] dark:text-[#f5c842]"
                  href="/creator/studio/moderation"
                >
                  前往审核 →
                </Link>
              </div>
            )}

            {/* 平台链接 */}
            <div className="rounded-[16px] border border-ink/6 bg-white/30 px-4 py-4 dark:border-paper/8 dark:bg-paper/4">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.24em] text-muted/50">
                平台
              </p>
              {[
                ["探索目录", "/explore"],
                ["INS 专区", "/ins"],
                ["暗室精选", "/darkroom"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  target="_blank"
                  className="flex items-center justify-between py-1.5 text-[12px] text-muted transition hover:text-ink"
                >
                  {label}
                  <span className="text-[10px] opacity-40">↗</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
