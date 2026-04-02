import { ZodError } from "zod";

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
  updateWallpaperReportReview,
} from "@/lib/wallpapers";

type ReportRouteProps = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: ReportRouteProps) {
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
    const payload = reviewWallpaperReportSchema.parse(await request.json());
    const report = await updateWallpaperReportReview(params.id, payload);

    if (!report) {
      return jsonError("Report not found.", {
        status: 404,
        code: "REPORT_NOT_FOUND",
      });
    }

    return jsonSuccess(report, {
      message: "Report review updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid report review payload.", {
        status: 400,
        code: "INVALID_REPORT_REVIEW_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/reports/[id]",
    });
    const message =
      error instanceof Error ? error.message : "Failed to update report review.";

    return jsonError(message, {
      status: 500,
      code: "REPORT_REVIEW_FAILED",
    });
  }
}
