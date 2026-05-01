"use client";

import Image from "next/image";
import Link from "next/link";

import errorArtwork from "./error-404-artwork.png";

type ErrorShellProps = {
  error?: Error & {
    digest?: string;
  };
  kind?: "not-found" | "error" | "global-error";
  onRetry?: (() => void) | null;
};

const errorCopy = {
  "not-found": {
    eyebrow: "404",
    title: "Looks like you're out of frame.",
    description:
      "The page you're looking for may have been moved, deleted, or never existed. Let's get you back to beautiful.",
  },
  error: {
    eyebrow: "Frame Error",
    title: "Looks like this frame broke.",
    description:
      "The page hit an unexpected problem. We recorded the issue, and you can retry the frame or continue exploring.",
  },
  "global-error": {
    eyebrow: "System Drift",
    title: "Looks like Lumen slipped out of frame.",
    description:
      "A critical page error interrupted this view. Try reloading, or return home while we keep the issue trace.",
  },
} as const;

function ActionIcon({ children }: { children: string }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/45 text-[16px] text-ink/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
    >
      {children}
    </span>
  );
}

export function ErrorShell({
  error,
  kind = "error",
  onRetry = null,
}: ErrorShellProps) {
  const copy = errorCopy[kind];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#edf0f4] text-ink">
      <Image
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        fill
        priority
        sizes="100vw"
        src={errorArtwork}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#eef2f6_0%,#eef2f6_34%,rgba(238,242,246,0.9)_45%,rgba(238,242,246,0.36)_62%,rgba(238,242,246,0.04)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[54%] bg-white/20 backdrop-blur-[2px]" />
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(0deg,rgba(238,242,246,0.92),rgba(238,242,246,0.42)_58%,rgba(238,242,246,0))]" />

      <section className="relative z-10 flex min-h-screen items-center px-5 py-8 md:px-12 lg:px-20">
        <div className="w-full max-w-[1280px]">
          <div className="max-w-[34rem] pt-8 md:pt-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
              {copy.eyebrow}
            </p>
            <h1 className="mt-4 font-body text-[clamp(3.8rem,10vw,7.5rem)] font-semibold leading-[0.82] tracking-normal text-ink">
              {kind === "not-found" ? "404" : "Error"}
            </h1>
            <h2 className="mt-6 max-w-[25rem] font-body text-[clamp(1.9rem,4.5vw,3.1rem)] font-semibold leading-[1.02] tracking-normal text-ink">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-[28rem] text-sm leading-7 text-muted md:text-base">
              {copy.description}
            </p>

            {error?.digest ? (
              <p className="mt-5 inline-flex rounded-full border border-ink/10 bg-white/45 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted backdrop-blur-md">
                Digest {error.digest}
              </p>
            ) : null}

            {process.env.NODE_ENV === "development" && error?.message ? (
              <p className="mt-4 max-w-[32rem] rounded-[18px] border border-red/15 bg-white/58 px-4 py-3 font-mono text-xs leading-6 text-red backdrop-blur-md">
                {error.message}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {onRetry ? (
                <button
                  className="glass-primary inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm text-paper"
                  onClick={onRetry}
                  type="button"
                >
                  <span aria-hidden="true">↻</span>
                  Retry page
                </button>
              ) : null}
              <Link
                className="glass-primary inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm text-paper"
                href="/"
              >
                <span aria-hidden="true">⌂</span>
                Back to Home
              </Link>
              <Link
                className="glass-control inline-flex min-h-[48px] items-center justify-center gap-2 px-6 py-3 text-sm text-ink transition"
                href="/explore"
              >
                Explore Wallpapers
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="mt-8 flex items-center gap-2 text-sm text-muted">
              <span className="text-red" aria-hidden="true">
                ✦
              </span>
              Need help? We&apos;re here for you.
            </p>
          </div>

          <nav
            aria-label="Error page shortcuts"
            className="mt-16 grid max-w-[46rem] gap-2 rounded-[32px] border border-white/55 bg-white/28 p-3 shadow-[0_24px_90px_rgba(39,58,69,0.16)] backdrop-blur-xl md:grid-cols-3"
          >
            <Link
              className="flex min-h-[70px] items-center gap-3 rounded-[24px] px-4 py-3 transition hover:bg-white/35"
              href="/explore"
            >
              <ActionIcon>⌖</ActionIcon>
              <span>
                <span className="block text-sm font-medium text-ink">
                  Explore Wallpapers
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Discover more
                </span>
              </span>
            </Link>
            <Link
              className="flex min-h-[70px] items-center gap-3 rounded-[24px] px-4 py-3 transition hover:bg-white/35"
              href="/ins"
            >
              <ActionIcon>▦</ActionIcon>
              <span>
                <span className="block text-sm font-medium text-ink">
                  Browse Collections
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Find your style
                </span>
              </span>
            </Link>
            <Link
              className="flex min-h-[70px] items-center gap-3 rounded-[24px] px-4 py-3 transition hover:bg-white/35"
              href="/creator/studio"
            >
              <ActionIcon>✉</ActionIcon>
              <span>
                <span className="block text-sm font-medium text-ink">
                  Contact Support
                </span>
                <span className="mt-1 block text-xs text-muted">
                  We&apos;re here to help
                </span>
              </span>
            </Link>
          </nav>
        </div>
      </section>
    </main>
  );
}
