import { ZodError } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
} from "@/lib/openclaw";
import {
  getWallpaperReportById,
  reviewWallpaperReportSchema,
  updateWallpaperReportReview,
} from "@/lib/wallpapers";

type OpenClawReportRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: OpenClawReportRouteProps,
) {
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/reports/[id]");

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const report = await getWallpaperReportById(params.id);

    if (!report) {
      return jsonError("Report not found.", {
        status: 404,
        code: "REPORT_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(report, {
      headers: getOpenClawPrivateHeaders(),
      message: "Report loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/reports/[id]",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to load report.",
      {
        status: 500,
        code: "OPENCLAW_REPORT_GET_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: OpenClawReportRouteProps,
) {
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/reports/[id]");

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = reviewWallpaperReportSchema.parse(await request.json());
    const report = await updateWallpaperReportReview(params.id, payload);

    if (!report) {
      return jsonError("Report not found.", {
        status: 404,
        code: "REPORT_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(report, {
      headers: getOpenClawPrivateHeaders(),
      message: "Report updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid report review payload.", {
        status: 400,
        code: "INVALID_REPORT_REVIEW_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/reports/[id]",
      tags: {
        method: "PATCH",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to update report.",
      {
        status: 500,
        code: "OPENCLAW_REPORT_UPDATE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
