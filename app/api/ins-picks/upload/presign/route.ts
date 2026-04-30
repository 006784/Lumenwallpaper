import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import {
  getInsPickCollection,
  getInsPickUploadTags,
  INS_PICK_UPLOAD_METADATA,
} from "@/lib/ins-picks";
import { consumeRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { createPresignedUpload, isR2Configured } from "@/lib/r2";
import { presignUploadSchema } from "@/lib/wallpapers";

const collectionSchema = z.object({
  collection: z
    .string()
    .trim()
    .toLowerCase()
    .max(64)
    .refine((value) => Boolean(getInsPickCollection(value)), {
      message: "Unknown INS picks collection.",
    }),
});

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/ins-picks/upload/presign", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before requesting an INS upload URL.", {
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
    const rawBody = await request.json();
    const body = presignUploadSchema.parse(rawBody);
    const { collection: collectionSlug } = collectionSchema.parse(rawBody);
    const collection = getInsPickCollection(collectionSlug);

    if (!collection) {
      return jsonError("Unknown INS picks collection.", {
        status: 400,
        code: "INVALID_INS_PICK_COLLECTION",
      });
    }

    logger.start({
      collection: collection.slug,
      contentType: body.contentType,
      userId: String(currentUser.id),
    });
    const uploadRateLimit = await consumeRateLimit({
      key: `ins-picks-upload:user:${String(currentUser.id)}`,
      limit: 10,
      windowSeconds: 60 * 60,
    });

    if (!uploadRateLimit.allowed) {
      logger.warn("ins_picks.upload.presign.rate_limited", {
        collection: collection.slug,
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
    const requiredTags = getInsPickUploadTags(collection);

    logger.done("ins_picks.upload.presign.created", {
      collection: collection.slug,
      key: upload.key,
      userId: String(currentUser.id),
    });

    return jsonSuccess(
      {
        ...upload,
        collection: {
          label: collection.label,
          nativeName: collection.nativeName,
          requiredTags,
          slug: collection.slug,
        },
        createEndpoint: INS_PICK_UPLOAD_METADATA.createEndpoint,
        presignEndpoint: INS_PICK_UPLOAD_METADATA.presignEndpoint,
      },
      {
        headers: getRateLimitHeaders(uploadRateLimit),
        status: 201,
        message: "INS picks presigned upload URL created.",
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS picks presign payload.", {
        status: 400,
        code: "INVALID_INS_PICK_PRESIGN_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks/upload/presign",
    });

    return jsonError("Failed to create INS picks upload URL.", {
      status: 500,
      code: "INS_PICK_UPLOAD_PRESIGN_FAILED",
    });
  }
}
