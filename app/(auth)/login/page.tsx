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
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(245,200,66,0.18),transparent_18%),radial-gradient(circle_at_86%_24%,rgba(212,43,43,0.08),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.2),transparent_42%)]" />
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Auth
        </p>
        <h1 className="max-w-3xl font-display text-[clamp(2.4rem,7vw,5rem)] leading-[0.94] tracking-[-0.05em]">
          用邮箱接回你的 Lumen 身份
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里已经切到真实的 Magic Link 登录流程。输入邮箱后，系统会发送一次性链接；验证成功后会建立 HttpOnly 会话，并回到你刚才的页面。
        </p>

        <div className="mt-8 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            一次性链接
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            HttpOnly Session
          </span>
          {redirectPath !== "/" ? (
            <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
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
