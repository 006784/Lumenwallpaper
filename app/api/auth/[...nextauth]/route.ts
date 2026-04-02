import { type NextRequest, NextResponse } from "next/server";

import { jsonError, jsonSuccess } from "@/lib/api";
import {
  consumeMagicLinkSession,
  FRAME_SESSION_COOKIE,
  getCurrentSession,
  getSessionCookieOptions,
  isAuthConfigured,
  normalizeRedirectPath,
} from "@/lib/auth";

type AuthRouteProps = {
  params: {
    nextauth?: string[];
  };
};

function notFound() {
  return jsonError("Authentication route not found.", {
    status: 404,
    code: "AUTH_ROUTE_NOT_FOUND",
  });
}

function mapAuthErrorToCode(error: string) {
  if (error.includes("expired")) {
    return "expired";
  }

  if (error.includes("used")) {
    return "used";
  }

  if (error.includes("invalid")) {
    return "invalid";
  }

  if (error.includes("token")) {
    return "missing";
  }

  return "unknown";
}

export async function GET(request: NextRequest, { params }: AuthRouteProps) {
  const action = params.nextauth?.[0] ?? "";

  if (action === "session") {
    const session = getCurrentSession();

    return jsonSuccess(
      {
        authenticated: Boolean(session),
        session,
      },
      {
        message: session ? "Session loaded." : "No active session.",
      },
    );
  }

  if (action === "verify") {
    if (!isAuthConfigured()) {
      return NextResponse.redirect(
        new URL("/verify?error=unknown", request.url),
      );
    }

    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
      return NextResponse.redirect(
        new URL("/verify?error=missing", request.url),
      );
    }

    try {
      const result = await consumeMagicLinkSession(token);
      const response = NextResponse.redirect(
        new URL(result.redirectTo, request.url),
      );

      response.cookies.set({
        name: FRAME_SESSION_COOKIE,
        value: result.sessionCookieValue,
        ...getSessionCookieOptions(),
      });

      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "unknown";

      return NextResponse.redirect(
        new URL(`/verify?error=${mapAuthErrorToCode(message)}`, request.url),
      );
    }
  }

  return notFound();
}

export async function POST(request: NextRequest, { params }: AuthRouteProps) {
  const action = params.nextauth?.[0] ?? "";

  if (action === "signout") {
    const redirectTo = normalizeRedirectPath(
      request.nextUrl.searchParams.get("redirectTo"),
    );
    const response = NextResponse.redirect(new URL(redirectTo, request.url));

    response.cookies.delete(FRAME_SESSION_COOKIE);

    return response;
  }

  return notFound();
}
