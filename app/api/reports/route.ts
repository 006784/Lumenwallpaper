import { ZodError, z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getCurrentUser,
  isAuthConfigured,
  isEditorUser,
} from "@/lib/auth";
import {
  reviewWallpaperReportSchema,
  updateWallpaperReportReviewsBatch,
} from "@/lib/wallpapers";

const batchReviewSchema = reviewWallpaperReportSchema.extend({
  reportIds: z.array(z.string().trim().min(1)).min(1).max(50),
});

export async function PATCH(request: Request) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before reviewing reports.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  if (!isEditorUser(currentUser)) {
    return jsonError("You do not have permission to review reports.", {
      status: 403,
      code: "REPORT_REVIEW_FORBIDDEN",
    });
  }

  try {
    const payload = batchReviewSchema.parse(await request.json());
    const reports = await updateWallpaperReportReviewsBatch(payload.reportIds, {
      reviewNote: payload.reviewNote,
      status: payload.status,
      wallpaperStatus: payload.wallpaperStatus,
    });

    return jsonSuccess(reports, {
      message: "Reports updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid batch report payload.", {
        status: 400,
        code: "INVALID_BATCH_REPORT_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/reports",
    });
    const message =
      error instanceof Error ? error.message : "Failed to update reports.";

    return jsonError(message, {
      status: 500,
      code: "BATCH_REPORT_UPDATE_FAILED",
    });
  }
}
