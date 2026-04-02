import { redirect } from "next/navigation";

import { UploadStudioForm } from "@/components/creator/upload-studio-form";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export default function CreatorStudioPage() {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="上传工作台已经切到登录态流程，但当前环境还没有配置 NEXTAUTH_SECRET。先补齐认证环境变量，再回来继续。"
        eyebrow="Creator Studio"
        title="认证环境尚未配置"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/creator/studio");
  }

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(245,200,66,0.18),transparent_18%),radial-gradient(circle_at_84%_20%,rgba(212,43,43,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Creator Studio
        </p>
        <h1 className="max-w-3xl font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.94] tracking-[-0.05em]">
          直传 R2，并把作品归到你的创作者档案
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          现在这条链路已经切到登录态。上传权限、元数据写入、授权确认和作品归属都基于当前会话，不再手工填写创作者身份。
        </p>

        <div className="mt-8 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            R2 Direct Upload
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            Session Bound
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            Metadata Synced
          </span>
          <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
            @{currentUser.username}
          </span>
        </div>

        <div className="mt-12">
          <UploadStudioForm
            creatorEmail={currentUser.email}
            creatorUsername={currentUser.username}
          />
        </div>
      </div>
    </section>
  );
}
