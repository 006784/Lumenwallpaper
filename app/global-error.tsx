"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { GeistMono } from "geist/font/mono";

import { ErrorShell } from "@/components/ui/error-shell";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html
      suppressHydrationWarning
      className={GeistMono.variable}
      lang="zh-CN"
    >
      <head>
        {/* Keep the error shell on the same resolved theme as the rest of the app. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-paper font-body text-ink antialiased">
        <ErrorShell error={error} kind="global-error" onRetry={reset} />
      </body>
    </html>
  );
}
