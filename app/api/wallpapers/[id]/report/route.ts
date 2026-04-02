import { ZodError } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
  consumeRateLimit,
  getRateLimitHeaders,
  getRequestIpAddress,
} from "@/lib/rate-limit";
import {
  createWallpaperReport,
  createWallpaperReportSchema,
} from "@/lib/wallpapers";

type WallpaperReportRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: WallpaperReportRouteProps,
) {
  const reporterIp = getRequestIpAddress(request);
  const rateLimit = await consumeRateLimit({
    key: `report:${reporterIp}`,
    limit: 5,
    windowSeconds: 60 * 60,
  });
  const rateLimitHeaders = getRateLimitHeaders(rateLimit);

  if (!rateLimit.allowed) {
    return jsonError("举报次数过于频繁，请稍后再试。", {
      status: 429,
      code: "REPORT_RATE_LIMITED",
      headers: rateLimitHeaders,
    });
  }

  try {
    const currentUser = getCurrentUser();
    const payload = createWallpaperReportSchema.parse(await request.json());
    const report = await createWallpaperReport(params.id, payload, {
      reporterEmail: currentUser?.email ?? null,
      reporterIp,
      reporterUserId: currentUser?.id ?? null,
    });

    if (!report) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
        headers: rateLimitHeaders,
      });
    }

    return jsonSuccess(report, {
      headers: rateLimitHeaders,
      message: "Wallpaper report submitted.",
      status: 201,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper report payload.", {
        status: 400,
        code: "INVALID_WALLPAPER_REPORT_PAYLOAD",
        details: formatZodError(error),
        headers: rateLimitHeaders,
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers/[id]/report",
    });
    const message =
      error instanceof Error ? error.message : "Failed to submit wallpaper report.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_REPORT_FAILED",
      headers: rateLimitHeaders,
    });
  }
}
