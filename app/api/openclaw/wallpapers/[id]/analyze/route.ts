import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
  toOpenClawWallpaperPayload,
} from "@/lib/openclaw";
import { reanalyzeWallpaperMetadata } from "@/lib/wallpapers";

type OpenClawWallpaperAnalyzeRouteProps = {
  params: {
    id: string;
  };
};

export async function POST(
  request: Request,
  { params }: OpenClawWallpaperAnalyzeRouteProps,
) {
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/[id]/analyze",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const wallpaper = await reanalyzeWallpaperMetadata(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(toOpenClawWallpaperPayload(wallpaper), {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpaper AI analysis completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/[id]/analyze",
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to analyze wallpaper.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_ANALYZE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
