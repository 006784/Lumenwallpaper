import { redirect } from "next/navigation";
import Link from "next/link";

import { ManageWallpapersBoard } from "@/components/creator/manage-wallpapers-board";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import {
  getCurrentUser,
  isAuthConfigured,
  isEditorUser,
} from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { listManagedWallpapers } from "@/lib/wallpapers";

export default async function CreatorStudioManagePage() {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="管理后台依赖登录态。先补齐 NEXTAUTH_SECRET，再从这里继续。"
        eyebrow="Manage"
        title="管理后台尚未启用"
      />
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <PagePlaceholder
        description="作品管理需要连接 Supabase 才能读写元数据。先补齐本地的 Supabase 环境变量。"
        eyebrow="Manage"
        title="数据环境尚未连接"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/creator/studio/manage");
  }

  const wallpapers = await listManagedWallpapers(currentUser.id);
  const isEditor = isEditorUser(currentUser);

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(245,200,66,0.16),transparent_18%),radial-gradient(circle_at_82%_16%,rgba(212,43,43,0.06),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.16),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Creator Studio
        </p>
        <h1 className="max-w-4xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.94] tracking-[-0.05em]">
          管理你已经发布的作品
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里是 Phase 3
          里的上传管理后台。你可以查看自己的作品、调整标题和标签、切换状态，在必要时删除它们，也可以手动重跑
          AI 标签分析。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            @{currentUser.username}
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            作品 {wallpapers.length}
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            可编辑元数据
          </span>
          <span className="border border-gold/20 bg-gold/5 px-3 py-2 text-gold">
            AI Fallback Ready
          </span>
          <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
            Delete Protected
          </span>
          {isEditor ? (
            <Link
              className="border border-gold/20 bg-gold/5 px-3 py-2 text-gold transition hover:bg-gold hover:text-ink"
              href="/creator/studio/moderation"
            >
              打开审核台
            </Link>
          ) : null}
        </div>

        <div className="mt-12">
          <ManageWallpapersBoard initialWallpapers={wallpapers} />
        </div>
      </div>
    </section>
  );
}
