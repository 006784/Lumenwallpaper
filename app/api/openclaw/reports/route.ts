import { ZodError, z } from "zod";

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
import {
  getWallpaperReportCounts,
  listWallpaperReports,
  reviewWallpaperReportSchema,
  updateWallpaperReportReviewsBatch,
} from "@/lib/wallpapers";

const reportReasonSchema = z.enum([
  "copyright",
  "sensitive",
  "spam",
  "misleading",
  "other",
  "all",
]);

const reportStatusSchema = z.enum([
  "all",
  "open",
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

const reportQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  creator: z.string().trim().max(64).optional(),
  reason: reportReasonSchema.optional(),
  search: z.string().trim().max(200).optional(),
  status: reportStatusSchema.optional(),
});

const batchReviewSchema = reviewWallpaperReportSchema.extend({
  reportIds: z.array(z.string().trim().min(1)).min(1).max(50),
});

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/reports", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/reports");

  if (auth instanceof Response) {
    return auth;
  }

  const params = new URL(request.url).searchParams;
  const parsed = reportQuerySchema.safeParse({
    limit: params.get("limit") ?? undefined,
    creator: params.get("creator") ?? undefined,
    reason: params.get("reason") ?? undefined,
    search: params.get("search") ?? undefined,
    status: params.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid report query.", {
      status: 400,
      code: "INVALID_REPORT_QUERY",
      details: formatZodError(parsed.error),
      headers: getOpenClawPrivateHeaders(),
    });
  }

  try {
    logger.start({
      actor: auth.actor,
      status: parsed.data.status ?? "open",
    });

    const [counts, reports] = await Promise.all([
      getWallpaperReportCounts(),
      listWallpaperReports({
        creator: parsed.data.creator,
        limit: parsed.data.limit,
        reason: parsed.data.reason,
        search: parsed.data.search,
        status: parsed.data.status,
      }),
    ]);

    logger.done("openclaw.reports.loaded", {
      actor: auth.actor,
      count: reports.length,
    });

    return jsonSuccess(
      {
        counts,
        reports,
      },
      {
        headers: getOpenClawPrivateHeaders(),
        message: "Reports loaded.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/reports",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to load reports.",
      {
        status: 500,
        code: "OPENCLAW_REPORTS_GET_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function PATCH(request: Request) {
  const logger = createRouteLogger("/api/openclaw/reports", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/reports");

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = batchReviewSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      reportIds: payload.reportIds.length,
      status: payload.status,
    });
    const reports = await updateWallpaperReportReviewsBatch(payload.reportIds, {
      reviewNote: payload.reviewNote,
      status: payload.status,
      wallpaperStatus: payload.wallpaperStatus,
    });

    logger.done("openclaw.reports.batch_review.completed", {
      actor: auth.actor,
      count: reports.length,
    });

    return jsonSuccess(reports, {
      headers: getOpenClawPrivateHeaders(),
      message: "Reports updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid batch report payload.", {
        status: 400,
        code: "INVALID_BATCH_REPORT_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/reports",
      tags: {
        method: "PATCH",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to update reports.",
      {
        status: 500,
        code: "OPENCLAW_BATCH_REPORT_UPDATE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
