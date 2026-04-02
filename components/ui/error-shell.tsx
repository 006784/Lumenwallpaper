"use client";

import Link from "next/link";

type ErrorShellProps = {
  error?: Error & {
    digest?: string;
  };
  onRetry?: (() => void) | null;
};

export function ErrorShell({ error, onRetry = null }: ErrorShellProps) {
  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_20%,rgba(245,200,66,0.16),transparent_18%),radial-gradient(circle_at_82%_18%,rgba(212,43,43,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.7),rgba(244,239,230,0.92))]" />

      <div className="relative mx-auto max-w-5xl border-frame border-ink bg-paper/88 p-8 shadow-[18px_18px_0_0_rgba(10,8,4,0.08)] md:p-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-red">
          System Drift
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-[clamp(2.6rem,7vw,5.2rem)] leading-[0.92] tracking-[-0.05em]">
          这一页暂时失去了光线
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-muted md:text-base">
          Lumen 已记录这次异常。你可以重新尝试当前操作，或者先回到首页继续浏览，稍后再回来。
        </p>

        {error?.digest ? (
          <p className="mt-6 inline-flex border border-ink/10 bg-paper px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Digest {error.digest}
          </p>
        ) : null}

        {process.env.NODE_ENV === "development" && error?.message ? (
          <p className="mt-4 max-w-3xl border border-red/15 bg-red/5 px-4 py-3 font-mono text-xs leading-6 text-red">
            {error.message}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          {onRetry ? (
            <button
              className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink bg-ink px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-paper transition hover:-translate-y-0.5 hover:border-red hover:bg-red"
              onClick={onRetry}
              type="button"
            >
              重试当前页面
            </button>
          ) : null}
          <Link
            className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink bg-paper px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper"
            href="/"
          >
            返回首页
          </Link>
          <Link
            className="inline-flex min-h-[44px] items-center justify-center border-frame border-ink/20 bg-paper/70 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted transition hover:-translate-y-0.5 hover:border-ink hover:text-ink"
            href="/explore"
          >
            继续浏览
          </Link>
        </div>
      </div>
    </section>
  );
}
