import {
  captureServerException,
  createRouteLogger,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { consumeRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { inspectR2UploadCors, isR2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";

function getRequestOrigin(request: Request) {
  const explicitOrigin = request.headers.get("origin");

  if (explicitOrigin) {
    return explicitOrigin;
  }

  const url = new URL(request.url);
  return url.origin;
}

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/upload/diagnostics", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before checking upload diagnostics.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  if (!isR2Configured()) {
    return jsonError("R2 is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
    });
  }

  try {
    const diagnosticsRateLimit = await consumeRateLimit({
      key: `upload-diagnostics:user:${String(currentUser.id)}`,
      limit: 12,
      windowSeconds: 10 * 60,
    });
    const rateLimitHeaders = getRateLimitHeaders(diagnosticsRateLimit);

    if (!diagnosticsRateLimit.allowed) {
      logger.warn("upload.diagnostics.rate_limited", {
        rateLimitSource: diagnosticsRateLimit.source,
        userId: String(currentUser.id),
      });

      return jsonError("上传诊断请求过于频繁，请稍后再试。", {
        status: 429,
        code: "UPLOAD_DIAGNOSTICS_RATE_LIMITED",
        headers: rateLimitHeaders,
      });
    }

    const origin = getRequestOrigin(request);
    logger.start({
      origin,
      userId: String(currentUser.id),
    });

    const diagnostics = await inspectR2UploadCors(origin);

    logger.done("upload.diagnostics.completed", {
      issueCodes: diagnostics.issues.map((issue) => issue.code),
      origin,
      status: diagnostics.status,
      userId: String(currentUser.id),
    });

    return jsonSuccess(diagnostics, {
      headers: {
        ...rateLimitHeaders,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
      message: diagnostics.ok
        ? "R2 upload diagnostics completed."
        : "R2 upload diagnostics found blocking issues.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/upload/diagnostics",
    });

    return jsonError("Failed to inspect R2 upload diagnostics.", {
      status: 500,
      code: "UPLOAD_DIAGNOSTICS_FAILED",
    });
  }
}
