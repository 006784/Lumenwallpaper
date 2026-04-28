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

  const isEditor = isEditorUser(currentUser);
  const wallpapers = await listManagedWallpapers(currentUser.id, {
    includeAll: isEditor,
  });

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Creator Studio
        </p>
        <h1 className="max-w-4xl font-body text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[1.02]">
          管理你已经发布的作品
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里是 Phase 3
          里的上传管理后台。你可以查看自己的作品、调整标题和标签、切换状态，在必要时删除它们，也可以手动重跑
          AI 标签分析。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="glass-chip px-3 py-2">
            @{currentUser.username}
          </span>
          <span className="glass-chip px-3 py-2">
            作品 {wallpapers.length}
          </span>
          <span className="glass-chip px-3 py-2">
            可编辑元数据
          </span>
          <span className="glass-chip px-3 py-2 text-red">
            AI Fallback Ready
          </span>
          <span className="glass-chip-active px-3 py-2">
            Delete Protected
          </span>
          {isEditor ? (
            <>
              <Link
                className="glass-chip px-3 py-2 text-red transition hover:text-ink"
                href="/creator/studio/moderation"
              >
                打开审核台
              </Link>
              <Link
                className="glass-chip px-3 py-2 transition hover:text-ink"
                href="/creator/studio/import"
              >
                打开 R2 导入台
              </Link>
            </>
          ) : null}
        </div>

        <div className="mt-12">
          <ManageWallpapersBoard
            canModerate={isEditor}
            initialWallpapers={wallpapers}
          />
        </div>
      </div>
    </section>
  );
}
