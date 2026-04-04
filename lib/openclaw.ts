import { createHash, timingSafeEqual } from "node:crypto";

import { jsonError } from "@/lib/api";
import { PRIVATE_NO_STORE_CACHE_CONTROL } from "@/lib/cache";
import { logServerEvent } from "@/lib/monitoring";
import { getWallpaperDisplayTitle } from "@/lib/wallpaper-presenters";
import type { Wallpaper } from "@/types/wallpaper";

type OpenClawAuthHeaderName =
  | "authorization"
  | "x-openclaw-key"
  | "x-api-key";

export type OpenClawAuthContext = {
  actor: string;
  authHeader: OpenClawAuthHeaderName;
  keyFingerprint: string;
};

function normalizeHeaderValue(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getConfiguredOpenClawApiKey() {
  return (
    normalizeHeaderValue(process.env.OPENCLAW_API_KEY) ??
    normalizeHeaderValue(process.env.LUMEN_OPENCLAW_API_KEY) ??
    null
  );
}

function createKeyFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function readProvidedOpenClawKey(request: Request) {
  const authorization = normalizeHeaderValue(request.headers.get("authorization"));

  if (authorization?.toLowerCase().startsWith("bearer ")) {
    const token = normalizeHeaderValue(authorization.slice("bearer ".length));

    if (token) {
      return {
        authHeader: "authorization" as const,
        token,
      };
    }
  }

  const openClawHeader = normalizeHeaderValue(request.headers.get("x-openclaw-key"));

  if (openClawHeader) {
    return {
      authHeader: "x-openclaw-key" as const,
      token: openClawHeader,
    };
  }

  const genericHeader = normalizeHeaderValue(request.headers.get("x-api-key"));

  if (genericHeader) {
    return {
      authHeader: "x-api-key" as const,
      token: genericHeader,
    };
  }

  return null;
}

export function isOpenClawConfigured() {
  return Boolean(getConfiguredOpenClawApiKey());
}

export function getOpenClawPrivateHeaders(): HeadersInit {
  return {
    "Cache-Control": PRIVATE_NO_STORE_CACHE_CONTROL,
  };
}

export function toOpenClawWallpaperPayload<T extends Wallpaper>(wallpaper: T) {
  return {
    ...wallpaper,
    displayTitle: getWallpaperDisplayTitle(wallpaper),
  };
}

export function toOpenClawWallpaperCollection<T extends Wallpaper>(wallpapers: T[]) {
  return wallpapers.map((wallpaper) => toOpenClawWallpaperPayload(wallpaper));
}

export function requireOpenClawApiAccess(
  request: Request,
  route: string,
): OpenClawAuthContext | Response {
  const expectedApiKey = getConfiguredOpenClawApiKey();

  if (!expectedApiKey) {
    return jsonError("OpenClaw API is not configured.", {
      status: 503,
      code: "OPENCLAW_NOT_CONFIGURED",
      headers: getOpenClawPrivateHeaders(),
    });
  }

  const providedApiKey = readProvidedOpenClawKey(request);

  if (!providedApiKey) {
    logServerEvent("warn", "openclaw.auth.missing", {
      route,
    });

    return jsonError("Missing OpenClaw API key.", {
      status: 401,
      code: "OPENCLAW_AUTH_REQUIRED",
      headers: getOpenClawPrivateHeaders(),
    });
  }

  if (!safeCompare(providedApiKey.token, expectedApiKey)) {
    logServerEvent("warn", "openclaw.auth.invalid", {
      authHeader: providedApiKey.authHeader,
      keyFingerprint: createKeyFingerprint(providedApiKey.token),
      route,
    });

    return jsonError("Invalid OpenClaw API key.", {
      status: 403,
      code: "OPENCLAW_AUTH_INVALID",
      headers: getOpenClawPrivateHeaders(),
    });
  }

  return {
    actor:
      normalizeHeaderValue(request.headers.get("x-openclaw-actor")) ??
      normalizeHeaderValue(request.headers.get("user-agent")) ??
      "OpenClaw",
    authHeader: providedApiKey.authHeader,
    keyFingerprint: createKeyFingerprint(providedApiKey.token),
  };
}
