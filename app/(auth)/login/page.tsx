import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import {
  getCurrentUser,
  isAuthConfigured,
  normalizeRedirectPath,
} from "@/lib/auth";

type LoginPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectPath = normalizeRedirectPath(searchParams?.next);

  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="Magic Link 登录已经落到真实流程，但当前环境还没有配置 NEXTAUTH_SECRET。先补齐认证环境变量，再从这里继续。"
        eyebrow="Auth"
        title="认证环境尚未配置"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (currentUser) {
    redirect(redirectPath);
  }

  return (
    <section className="glass-panel-grid relative overflow-hidden px-4 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Auth
        </p>
        <h1 className="max-w-3xl font-body text-[clamp(2.4rem,7vw,5rem)] font-semibold leading-[1.02]">
          用邮箱接回你的 Lumen 身份
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里已经切到真实的 Magic Link 登录流程。输入邮箱后，系统会发送一次性链接；验证成功后会建立 HttpOnly 会话，并回到你刚才的页面。
        </p>

        <div className="mt-8 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="glass-chip px-3 py-2">
            一次性链接
          </span>
          <span className="glass-chip px-3 py-2">
            HttpOnly Session
          </span>
          {redirectPath !== "/" ? (
            <span className="glass-chip-active px-3 py-2">
              登录后将返回 {redirectPath}
            </span>
          ) : null}
        </div>

        <div className="mt-12">
          <LoginForm redirectTo={redirectPath} />
        </div>
      </div>
    </section>
  );
}
