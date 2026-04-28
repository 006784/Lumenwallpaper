import Link from "next/link";
import { redirect } from "next/navigation";

type VerifyPageProps = {
  searchParams?: {
    email?: string;
    error?: string;
    token?: string;
  };
};

const errorMessages: Record<string, string> = {
  invalid: "这个登录链接无效，可能已经被替换或截断。",
  expired: "这个登录链接已经过期，请重新请求一封新的邮件。",
  missing: "缺少登录 token，请重新从邮件里的完整链接进入。",
  used: "这个登录链接已经被使用过，请重新请求新的登录邮件。",
  unknown: "登录验证失败，请重新尝试。",
};

export default function VerifyPage({ searchParams }: VerifyPageProps) {
  const token = searchParams?.token?.trim();

  if (token) {
    redirect(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  }

  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error] ?? errorMessages.unknown
    : null;

  return (
    <section className="glass-panel-grid px-4 py-24 md:px-10 md:py-28">
      <div className="glass-surface mx-auto max-w-3xl px-6 py-8 md:px-8 md:py-10">
        <p className="text-[10px] uppercase tracking-[0.35em] text-red">
          Verify
        </p>
        <h1 className="mt-4 font-body text-[clamp(2.2rem,6vw,4.2rem)] font-semibold leading-[1.02]">
          {errorMessage ? "这个登录请求没有成功完成" : "登录链接已经发出"}
        </h1>
        <p className="mt-6 text-sm leading-7 text-muted md:text-base">
          {errorMessage
            ? errorMessage
            : searchParams?.email
              ? `请检查 ${searchParams.email} 的收件箱，并点击邮件里的登录链接。`
              : "请检查你的收件箱，并点击邮件里的登录链接。"}
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="glass-primary inline-flex px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em]"
            href="/login"
          >
            重新发送链接
          </Link>
          <Link
            className="glass-control inline-flex px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition"
            href="/"
          >
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
