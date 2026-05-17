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
    <div className="grid gap-5 lg:grid-cols-[1fr_0.88fr]">
      {/* 左侧：主表单 */}
      <div className="relative overflow-hidden rounded-[24px] border border-ink/8 bg-white/70 p-6 shadow-[0_8px_40px_rgba(23,79,80,0.08)] backdrop-blur-md dark:border-paper/10 dark:bg-paper/8 md:p-8">
        {/* 顶部红色渐变线 */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_8%,rgba(255,109,45,0.7)_40%,rgba(255,109,45,0.4)_70%,transparent_92%)]" />

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-red/70">
              Magic Link · 邮件验证
            </p>
            <h2 className="mt-3 font-body text-[1.6rem] font-semibold leading-tight tracking-tight text-ink">
              无密码登录
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-muted">
              输入邮箱，收到链接后点击完成验证。
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="block text-[9px] uppercase tracking-[0.28em] text-muted/70"
              htmlFor="email"
            >
              邮箱地址
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-[14px] border border-ink/10 bg-white/80 px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/50 focus:border-red/30 focus:ring-2 focus:ring-red/10 dark:border-paper/12 dark:bg-paper/10 dark:focus:border-red/40"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </div>

          <button
            className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[14px] bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.24em] text-paper transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-paper dark:text-ink"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/30 border-t-paper dark:border-ink/30 dark:border-t-ink" />
                发送中
              </span>
            ) : "发送登录链接"}
          </button>

          {error ? (
            <div className="flex items-start gap-3 rounded-[12px] border border-red/20 bg-red/6 px-4 py-3">
              <span className="mt-0.5 text-[11px] text-red/60">⚠</span>
              <p className="text-[13px] leading-6 text-red">{error}</p>
            </div>
          ) : null}

          {devMagicLink ? (
            <div className="rounded-[12px] border border-gold/30 bg-gold/8 px-4 py-4 dark:border-gold/20 dark:bg-gold/6">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold/80">调试链接</p>
              <Link
                className="mt-2 block break-all text-[13px] text-ink/70 underline decoration-ink/25 underline-offset-4 hover:text-ink"
                href={devMagicLink}
              >
                {devMagicLink}
              </Link>
            </div>
          ) : null}

          <p className="text-[11px] leading-5 text-muted/55">
            首次验证后本机保持登录，推荐使用绑定创作者身份的邮箱。
          </p>
        </form>
      </div>

      {/* 右侧：说明 */}
      <div className="relative overflow-hidden rounded-[24px] border border-ink/6 bg-white/40 p-6 dark:border-paper/8 dark:bg-paper/5 md:p-8">
        <div className="space-y-5">
          <p className="text-[9px] uppercase tracking-[0.4em] text-muted/50">
            登录流程
          </p>
          {[
            { n: "01", title: "发送链接", desc: "输入邮箱，点击发送后一次性登录链接会到达收件箱。" },
            { n: "02", title: "点击验证", desc: "打开邮件中的链接，完成本机设备验证。" },
            { n: "03", title: "长期登录", desc: "验证成功后建立 180 天 HttpOnly 会话，无需再次登录。" },
          ].map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <span className="mt-0.5 font-mono text-[11px] text-red/50">{n}</span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-2 border-t border-ink/6 pt-6 dark:border-paper/8">
          {["链接有效期 15 分钟", "链接仅可使用一次", "会话默认保留 180 天"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[11px] text-muted/60">
              <span className="h-1 w-1 rounded-full bg-red/40" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
