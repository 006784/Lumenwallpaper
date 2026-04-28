"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ApiSuccess = {
  data: {
    email: string;
    verifyRequestUrl: string;
    devMagicLink?: string;
  };
  message?: string;
};

type ApiFailure = {
  error: string;
  code: string;
  status: number;
};

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setDevMagicLink(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          redirectTo,
        }),
      });
      const payload = (await response.json()) as ApiSuccess | ApiFailure;

      if (!response.ok || !("data" in payload)) {
        throw new Error("error" in payload ? payload.error : "发送登录邮件失败。");
      }

      setDevMagicLink(payload.data.devMagicLink ?? null);

      if (payload.data.devMagicLink) {
        return;
      }

      router.push(payload.data.verifyRequestUrl);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "发送登录邮件失败，请稍后再试。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
      <form
        className="glass-surface relative overflow-hidden px-5 py-5 md:px-7 md:py-7"
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-x-8 top-0 h-[3px] rounded-full bg-red/70" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-red">
              01 — 邮件验证
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              输入你常用的邮箱，我们会把一次性登录链接发到那里。
            </p>
          </div>
          <p className="glass-chip px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted">
            Session Secure
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted"
            htmlFor="email"
          >
            邮箱地址
          </label>
          <input
            autoComplete="email"
            className="glass-field w-full px-4 py-3.5 text-[15px] outline-none transition placeholder:text-muted/70"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <p className="mt-3 text-xs leading-6 text-muted">
            推荐使用你准备绑定创作者身份的邮箱。
          </p>
        </div>

        <button
          className="glass-primary inline-flex min-h-[50px] w-full items-center justify-center px-5 py-3 font-mono text-[12px] uppercase tracking-[0.24em] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "发送中…" : "发送登录链接"}
        </button>

        {error ? (
          <p className="border border-red/30 bg-red/10 px-4 py-3 text-sm leading-6 text-red">
            {error}
          </p>
        ) : null}

        {devMagicLink ? (
          <div className="space-y-2 border border-gold/40 bg-gold/10 px-4 py-4 text-sm text-ink">
            <p>当前环境未配置 Resend，已生成本地调试链接：</p>
            <Link
              className="break-all underline decoration-ink/25 underline-offset-4"
              href={devMagicLink}
            >
              {devMagicLink}
            </Link>
          </div>
        ) : null}
      </form>

      <aside className="glass-surface relative overflow-hidden px-5 py-5 text-ink md:px-7 md:py-7">
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red">
            Magic Link
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            输入邮箱后，我们会发送一封一次性登录邮件。点击邮件中的链接即可完成验证并建立 HttpOnly 会话。
          </p>
        </div>

        <div className="relative mt-6 grid gap-3">
          {[
            ["01", "提交邮箱", "请求你的专属登录链接。"],
            ["02", "打开邮件", "点开一次性链接完成验证。"],
            ["03", "自动返回", "回到 Lumen 并建立安全会话。"],
          ].map(([index, title, description]) => (
            <div
              key={index}
              className="glass-surface-soft px-4 py-4"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-red">
                {index}
              </p>
              <p className="mt-2 font-body text-[22px] font-semibold leading-none text-ink">
                {title}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 space-y-2 border-t border-ink/10 pt-5 text-[11px] uppercase tracking-[0.2em] text-muted">
          <p>有效期：15 分钟</p>
          <p>链接仅可使用一次</p>
          <p>登录成功后会自动回到 Lumen</p>
        </div>
      </aside>
    </div>
  );
}
