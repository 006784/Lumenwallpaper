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
        className="relative overflow-hidden border-frame border-ink bg-paper/75 px-5 py-5 shadow-[14px_14px_0_0_rgba(10,8,4,0.06)] backdrop-blur md:px-7 md:py-7"
        onSubmit={handleSubmit}
      >
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-gold via-red to-transparent" />
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-red">
              01 — 邮件验证
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              输入你常用的邮箱，我们会把一次性登录链接发到那里。
            </p>
          </div>
          <p className="border border-ink/10 bg-paper/70 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-muted">
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
            className="w-full border-frame border-ink bg-paper/80 px-4 py-3.5 text-[15px] outline-none transition placeholder:text-muted/70 focus:border-red focus:bg-paper"
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
          className="inline-flex min-h-[50px] w-full items-center justify-center border-frame border-ink bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.24em] text-paper shadow-[8px_8px_0_0_rgba(10,8,4,0.08)] transition hover:-translate-y-0.5 hover:bg-red hover:shadow-[10px_10px_0_0_rgba(212,43,43,0.15)] disabled:cursor-not-allowed disabled:opacity-60"
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

      <aside className="relative overflow-hidden border-frame border-ink bg-ink px-5 py-5 text-paper shadow-[14px_14px_0_0_rgba(10,8,4,0.12)] md:px-7 md:py-7">
        <div className="pointer-events-none absolute right-[-52px] top-[-52px] h-40 w-40 rounded-full bg-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-74px] left-[-74px] h-44 w-44 rounded-full bg-red/10 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">
            Magic Link
          </p>
          <p className="mt-3 text-sm leading-7 text-paper/80">
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
              className="border border-paper/12 bg-paper/5 px-4 py-4"
            >
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">
                {index}
              </p>
              <p className="mt-2 font-display text-[25px] leading-none italic text-paper">
                {title}
              </p>
              <p className="mt-3 text-sm leading-6 text-paper/65">{description}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-6 space-y-2 border-t border-paper/10 pt-5 text-[11px] uppercase tracking-[0.2em] text-paper/45">
          <p>有效期：15 分钟</p>
          <p>链接仅可使用一次</p>
          <p>登录成功后会自动回到 Lumen</p>
        </div>
      </aside>
    </div>
  );
}
