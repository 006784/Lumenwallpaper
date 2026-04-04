import { ZodError } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";
import { createPresignedUpload, isR2Configured } from "@/lib/r2";
import { presignUploadSchema } from "@/lib/wallpapers";

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/upload/presign", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/upload/presign");

  if (auth instanceof Response) {
    return auth;
  }

  if (!isR2Configured()) {
    return jsonError("R2 is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
      headers: getOpenClawPrivateHeaders(),
    });
  }

  try {
    const body = presignUploadSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      contentType: body.contentType,
    });
    const upload = await createPresignedUpload(body.filename, body.contentType);

    logger.done("openclaw.upload.presign.created", {
      actor: auth.actor,
      key: upload.key,
    });

    return jsonSuccess(upload, {
      headers: getOpenClawPrivateHeaders(),
      status: 201,
      message: "Presigned upload URL created.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid upload payload.", {
        status: 400,
        code: "INVALID_UPLOAD_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/upload/presign",
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to create upload URL.",
      {
        status: 500,
        code: "OPENCLAW_UPLOAD_PRESIGN_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
