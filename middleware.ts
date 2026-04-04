import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { PRIVATE_NO_STORE_CACHE_CONTROL } from "@/lib/cache";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https:${
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""
  }`,
  "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  `connect-src 'self' https: wss:${
    process.env.NODE_ENV === "development" ? " http: ws:" : ""
  }`,
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy":
    "camera=(), geolocation=(), microphone=(), browsing-topics=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} satisfies Record<string, string>;

function shouldDisableCaching(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return true;
  }

  const { pathname } = request.nextUrl;

  return (
    pathname === "/login" ||
    pathname === "/verify" ||
    pathname === "/library" ||
    pathname.startsWith("/creator/studio") ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/email/send" ||
    pathname === "/api/health" ||
    pathname === "/api/notifications" ||
    pathname.startsWith("/api/notifications/") ||
    pathname === "/api/reports" ||
    pathname.startsWith("/api/reports/") ||
    pathname === "/api/upload/presign" ||
    /^\/api\/wallpapers\/[^/]+\/(analyze|download|favorite|report)$/.test(
      pathname,
    )
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  if (host === "www.byteify.icu") {
    const redirectUrl = new URL(request.url);
    redirectUrl.host = "byteify.icu";
    redirectUrl.protocol = "https:";

    return NextResponse.redirect(redirectUrl, 308);
  }

  const response = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  if (shouldDisableCaching(request)) {
    response.headers.set("Cache-Control", PRIVATE_NO_STORE_CACHE_CONTROL);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
