import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { PRIVATE_NO_STORE_CACHE_CONTROL } from "@/lib/cache";
import {
  getLocaleResponseHeaders,
  getLocaleCookieValue,
  LOCALE_COOKIE_NAME,
  LOCALE_REQUEST_HEADER,
  resolveLocale,
} from "@/lib/i18n";

const PRIMARY_HOST = "byteify.icu";
const REDIRECT_HOSTS = new Set(["www.byteify.icu", "lumen-wallpaper.vercel.app"]);

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
  "frame-src 'none'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Origin-Agent-Cluster": "?1",
  "Permissions-Policy":
    "camera=(), geolocation=(), microphone=(), browsing-topics=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-Permitted-Cross-Domain-Policies": "none",
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
    pathname === "/api/i18n" ||
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
  const queryLocale = request.nextUrl.searchParams.get("locale");
  const locale = resolveLocale({
    acceptLanguage: request.headers.get("accept-language"),
    cookieHeader: request.headers.get("cookie"),
    headerLocale: request.headers.get(LOCALE_REQUEST_HEADER),
    searchLocale: queryLocale,
  });
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(LOCALE_REQUEST_HEADER, locale);

  const shouldRedirectToPrimaryHost =
    REDIRECT_HOSTS.has(host) ||
    (process.env.VERCEL_ENV === "production" && host.endsWith(".vercel.app"));

  if (shouldRedirectToPrimaryHost) {
    const redirectUrl = new URL(request.url);
    redirectUrl.host = PRIMARY_HOST;
    redirectUrl.protocol = "https:";

    return NextResponse.redirect(redirectUrl, 308);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  for (const [key, value] of Object.entries(getLocaleResponseHeaders(locale))) {
    response.headers.set(key, value);
  }

  if (
    queryLocale &&
    getLocaleCookieValue(request.headers.get("cookie")) !== locale
  ) {
    response.cookies.set(LOCALE_COOKIE_NAME, locale, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
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
