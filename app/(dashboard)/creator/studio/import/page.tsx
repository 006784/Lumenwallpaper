import Link from "next/link";
import { redirect } from "next/navigation";

import { R2ImportBoard } from "@/components/creator/r2-import-board";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import {
  getCurrentUser,
  isAuthConfigured,
  isEditorUser,
} from "@/lib/auth";
import { isR2Configured } from "@/lib/r2";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function CreatorStudioImportPage() {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="导入入口依赖登录态。先补齐 NEXTAUTH_SECRET，再回来继续。"
        eyebrow="R2 Import"
        title="认证环境尚未配置"
      />
    );
  }

  if (!isSupabaseConfigured() || !isR2Configured()) {
    return (
      <PagePlaceholder
        description="R2 导入入口依赖 Supabase 和 R2 都已经接通。先补齐环境变量后再继续。"
        eyebrow="R2 Import"
        title="存储环境尚未连接"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/creator/studio/import");
  }

  if (!isEditorUser(currentUser)) {
    return (
      <PagePlaceholder
        description="这个入口只开放给编辑账号，用来把手动上传到 R2 的原始文件一键同步到前台。"
        eyebrow="R2 Import"
        title="当前账号没有导入权限"
      />
    );
  }

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Creator Studio
        </p>
        <h1 className="max-w-4xl font-body text-[clamp(2.5rem,7vw,5rem)] font-semibold leading-[1.02]">
          从 R2 一键同步到前台
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          以后你只要把原始图片或视频先丢进 R2，这里就能扫描出还没入库的文件，
          再一键补到 <code className="text-ink">wallpapers</code> 和{" "}
          <code className="text-ink">wallpaper_files</code> 里，让前台马上读取。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="glass-chip px-3 py-2">
            @{currentUser.username}
          </span>
          <span className="glass-chip px-3 py-2">
            Bucket Scan
          </span>
          <span className="glass-chip px-3 py-2">
            Supabase Sync
          </span>
          <span className="glass-chip-active px-3 py-2">
            Editor Only
          </span>
          <Link
            className="glass-chip px-3 py-2 transition hover:text-ink"
            href="/creator/studio/manage"
          >
            返回管理台
          </Link>
        </div>

        <div className="mt-12">
          <R2ImportBoard
            defaultCreatorUsername={
              process.env.LUMEN_DEFAULT_IMPORT_CREATOR_USERNAME?.trim() ||
              currentUser.username
            }
          />
        </div>
      </div>
    </section>
  );
}
