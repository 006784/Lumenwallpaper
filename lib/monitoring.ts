import * as Sentry from "@sentry/nextjs";

const DEFAULT_DEVELOPMENT_TRACES_SAMPLE_RATE = 1;
const DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE = 0.15;
const STRUCTURED_LOG_SERVICE_NAME = "lumen-web";

type StructuredLogLevel = "info" | "warn" | "error";

function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function sanitizeLogValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (depth > 3) {
    return "[truncated]";
  }

  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 497)}...` : value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeLogValue(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter((entry) => entry[1] !== undefined)
        .slice(0, 30)
        .map(([key, nestedValue]) => [key, sanitizeLogValue(nestedValue, depth + 1)]),
    );
  }

  return String(value);
}

function parseSampleRate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.min(1, Math.max(0, parsed));
}

function getDefaultTracesSampleRate() {
  return process.env.NODE_ENV === "development"
    ? DEFAULT_DEVELOPMENT_TRACES_SAMPLE_RATE
    : DEFAULT_PRODUCTION_TRACES_SAMPLE_RATE;
}

export function getSentryEnvironment() {
  return (
    process.env.SENTRY_ENVIRONMENT ??
    process.env.VERCEL_ENV ??
    process.env.NODE_ENV ??
    "development"
  );
}

export function getClientSentryOptions() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  return {
    debug: false,
    dsn,
    enabled: Boolean(dsn),
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    tracesSampleRate:
      parseSampleRate(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
          process.env.SENTRY_TRACES_SAMPLE_RATE,
      ) ?? getDefaultTracesSampleRate(),
  };
}

export function getServerSentryOptions() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

  return {
    debug: false,
    dsn,
    enabled: Boolean(dsn),
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    tracesSampleRate:
      parseSampleRate(
        process.env.SENTRY_TRACES_SAMPLE_RATE ??
          process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      ) ?? getDefaultTracesSampleRate(),
  };
}

export function isSentryConfigured() {
  return Boolean(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN);
}

export function shouldEnableVercelAnalytics() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS,
    process.env.NODE_ENV === "production",
  );
}

export function shouldEnableVercelSpeedInsights() {
  return parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_SPEED_INSIGHTS,
    process.env.NODE_ENV === "production",
  );
}

export function logServerEvent(
  level: StructuredLogLevel,
  message: string,
  context?: Record<string, unknown>,
) {
  const sanitizedContext = context
    ? (sanitizeLogValue(context) as Record<string, unknown>)
    : {};

  const payload = {
    level,
    message,
    service: STRUCTURED_LOG_SERVICE_NAME,
    environment: getSentryEnvironment(),
    timestamp: new Date().toISOString(),
    ...sanitizedContext,
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function createRouteLogger(route: string, request?: Request) {
  const startedAt = Date.now();
  const requestId =
    request?.headers.get("x-vercel-id") ??
    request?.headers.get("x-request-id") ??
    null;
  const method = request?.method ?? null;

  const baseContext = {
    route,
    requestId,
    method,
  };

  return {
    start(context?: Record<string, unknown>) {
      logServerEvent("info", "request.start", {
        ...baseContext,
        ...context,
      });
    },
    done(message: string, context?: Record<string, unknown>) {
      logServerEvent("info", message, {
        ...baseContext,
        durationMs: Date.now() - startedAt,
        ...context,
      });
    },
    warn(message: string, context?: Record<string, unknown>) {
      logServerEvent("warn", message, {
        ...baseContext,
        durationMs: Date.now() - startedAt,
        ...context,
      });
    },
  };
}

export function captureServerException(
  error: unknown,
  context?: {
    extra?: Record<string, unknown>;
    message?: string;
    route?: string;
    tags?: Record<string, string>;
  },
) {
  const exception =
    error instanceof Error
      ? error
      : new Error(
          typeof error === "string" ? error : "Unknown server exception",
        );

  logServerEvent("error", context?.message ?? exception.message, {
    route: context?.route,
    ...context?.tags,
    ...context?.extra,
    error: {
      message: exception.message,
      name: exception.name,
    },
  });

  Sentry.withScope((scope) => {
    if (context?.route) {
      scope.setTag("route", context.route);
    }

    for (const [key, value] of Object.entries(context?.tags ?? {})) {
      scope.setTag(key, value);
    }

    for (const [key, value] of Object.entries(context?.extra ?? {})) {
      scope.setExtra(key, value);
    }

    Sentry.captureException(exception);
  });

  return exception;
}
