"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { ErrorShell } from "@/components/ui/error-shell";

type AppErrorProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <ErrorShell error={error} onRetry={reset} />;
}
