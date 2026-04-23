import { ZodError } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { consumeRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createPresignedUpload, isR2Configured } from "@/lib/r2";
import { presignUploadSchema } from "@/lib/wallpapers";

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/upload/presign", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before requesting an upload URL.", {
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
    const body = presignUploadSchema.parse(await request.json());
    logger.start({
      contentType: body.contentType,
      userId: String(currentUser.id),
    });
    const uploadRateLimit = await consumeRateLimit({
      key: `upload:user:${String(currentUser.id)}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!uploadRateLimit.allowed) {
      logger.warn("upload.presign.rate_limited", {
        rateLimitSource: uploadRateLimit.source,
        userId: String(currentUser.id),
      });

      return jsonError("上传过于频繁，请稍后再试。", {
        status: 429,
        code: "UPLOAD_RATE_LIMITED",
        headers: getRateLimitHeaders(uploadRateLimit),
      });
    }

    const upload = await createPresignedUpload(body.filename, body.contentType);
    logger.done("upload.presign.created", {
      key: upload.key,
      userId: String(currentUser.id),
    });

    return jsonSuccess(upload, {
      headers: getRateLimitHeaders(uploadRateLimit),
      status: 201,
      message: "Presigned upload URL created.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid upload payload.", {
        status: 400,
        code: "INVALID_UPLOAD_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/upload/presign",
    });

    return jsonError("Failed to create upload URL.", {
      status: 500,
      code: "UPLOAD_PRESIGN_FAILED",
    });
  }
}
