import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { consumeRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import {
  getWallpaperByIdOrSlug,
  reanalyzeWallpaperMetadata,
} from "@/lib/wallpapers";

type WallpaperAnalyzeRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(
  _request: Request,
  { params }: WallpaperAnalyzeRouteProps,
) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before analyzing wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const analyzeRateLimit = await consumeRateLimit({
      key: `wallpaper-ai:user:${String(currentUser.id)}`,
      limit: 20,
      windowSeconds: 60 * 60,
    });

    if (!analyzeRateLimit.allowed) {
      return jsonError("AI 分析请求过于频繁，请稍后再试。", {
        status: 429,
        code: "WALLPAPER_ANALYZE_RATE_LIMITED",
        headers: getRateLimitHeaders(analyzeRateLimit),
      });
    }

    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    if (wallpaper.userId !== currentUser.id) {
      return jsonError("You can only analyze your own wallpapers.", {
        status: 403,
        code: "WALLPAPER_FORBIDDEN",
      });
    }

    const analyzedWallpaper = await reanalyzeWallpaperMetadata(wallpaper.id);

    if (!analyzedWallpaper) {
      return jsonError("Wallpaper not found after AI analysis.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(analyzedWallpaper, {
      headers: getRateLimitHeaders(analyzeRateLimit),
      message: "Wallpaper AI analysis completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/analyze",
    });
    const message =
      error instanceof Error ? error.message : "Failed to analyze wallpaper.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_ANALYZE_FAILED",
    });
  }
}
