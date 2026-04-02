import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  createMagicLinkSession,
  isAuthConfigured,
  normalizeRedirectPath,
} from "@/lib/auth";
import {
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestIpAddress,
  normalizeRateLimitKeyPart,
} from "@/lib/rate-limit";
import { isResendConfigured, sendMagicLinkEmail } from "@/lib/resend";
import { isSupabaseConfigured } from "@/lib/supabase";

const sendMagicLinkSchema = z.object({
  email: z.string().trim().email(),
  redirectTo: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/email/send", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  if (!isSupabaseConfigured()) {
    return jsonError("Supabase is not configured.", {
      status: 503,
      code: "SUPABASE_NOT_CONFIGURED",
    });
  }

  try {
    const payload = sendMagicLinkSchema.parse(await request.json());
    logger.start({
      recipientDomain: payload.email.split("@")[1] ?? null,
      redirectTo: normalizeRedirectPath(payload.redirectTo),
    });
    const ipRateLimit = await consumeRateLimit({
      key: `magic-link:ip:${getRequestIpAddress(request)}`,
      limit: 5,
      windowSeconds: 60,
    });

    if (!ipRateLimit.allowed) {
      logger.warn("magic_link.rate_limited", {
        rateLimitScope: "ip",
        rateLimitSource: ipRateLimit.source,
      });

      return jsonError("请求过于频繁，请稍后再试。", {
        status: 429,
        code: "MAGIC_LINK_IP_RATE_LIMITED",
        headers: getRateLimitHeaders(ipRateLimit),
      });
    }

    const emailRateLimit = await consumeRateLimit({
      key: `magic-link:email:${normalizeRateLimitKeyPart(payload.email)}`,
      limit: 1,
      windowSeconds: 5 * 60,
    });

    if (!emailRateLimit.allowed) {
      logger.warn("magic_link.rate_limited", {
        rateLimitScope: "email",
        rateLimitSource: emailRateLimit.source,
      });

      return jsonError("同一邮箱 5 分钟内只能请求一次登录链接。", {
        status: 429,
        code: "MAGIC_LINK_EMAIL_RATE_LIMITED",
        headers: getRateLimitHeaders(emailRateLimit),
      });
    }

    const session = await createMagicLinkSession(
      payload.email,
      normalizeRedirectPath(payload.redirectTo),
    );
    const verifyRequestUrl = `/verify?email=${encodeURIComponent(payload.email)}`;
    const isDevFallback =
      process.env.NODE_ENV !== "production" && !isResendConfigured();

    if (isDevFallback) {
      logger.done("magic_link.created", {
        delivery: "development_fallback",
      });

      return jsonSuccess(
        {
          email: payload.email,
          verifyRequestUrl,
          devMagicLink: session.magicLink,
        },
        {
          status: 201,
          message: "Magic link created in development fallback mode.",
        },
      );
    }

    await sendMagicLinkEmail(payload.email, session.magicLink);
    logger.done("magic_link.sent", {
      delivery: "resend",
    });

    return jsonSuccess(
      {
        email: payload.email,
        verifyRequestUrl,
      },
      {
        status: 201,
        message: "Magic link email sent.",
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid login email payload.", {
        status: 400,
        code: "INVALID_MAGIC_LINK_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/email/send",
    });
    const message =
      error instanceof Error ? error.message : "Failed to send login email.";

    return jsonError(message, {
      status: 500,
      code: "MAGIC_LINK_SEND_FAILED",
    });
  }
}
