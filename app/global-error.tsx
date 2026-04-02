"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorShell } from "@/components/ui/error-shell";

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
    <html lang="zh-CN">
      <body className="bg-paper font-body text-ink antialiased">
        <ErrorShell error={error} onRetry={reset} />
      </body>
    </html>
  );
}
