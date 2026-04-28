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
    <section className="glass-panel-grid relative overflow-hidden px-4 py-24 md:px-10 md:py-28">
      <div className="glass-surface relative mx-auto max-w-5xl p-8 md:p-12">
        <p className="text-[10px] uppercase tracking-[0.35em] text-red">
          System Drift
        </p>
        <h1 className="mt-5 max-w-3xl font-body text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[1.02]">
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
              className="glass-primary inline-flex min-h-[44px] items-center justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em]"
              onClick={onRetry}
              type="button"
            >
              重试当前页面
            </button>
          ) : null}
          <Link
            className="glass-control inline-flex min-h-[44px] items-center justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-ink transition"
            href="/"
          >
            返回首页
          </Link>
          <Link
            className="glass-control inline-flex min-h-[44px] items-center justify-center px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink"
            href="/explore"
          >
            继续浏览
          </Link>
        </div>
      </div>
    </section>
  );
}
