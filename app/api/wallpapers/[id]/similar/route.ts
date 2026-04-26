import { ZodError, z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCachedSimilarWallpapers } from "@/lib/public-wallpaper-cache";

type SimilarWallpapersRouteProps = {
  params: {
    id: string;
  };
};

const similarWallpapersQuerySchema = z.object({
  limit: z
    .preprocess((value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : value;
    }, z.number().int().min(1).max(12).optional())
    .optional(),
});

export async function GET(
  request: Request,
  { params }: SimilarWallpapersRouteProps,
) {
  try {
    const { searchParams } = new URL(request.url);
    const query = similarWallpapersQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );
    const snapshot = await getCachedSimilarWallpapers(params.id, {
      limit: query.limit,
    });

    if (!snapshot) {
      return jsonError("Wallpaper not found.", {
        headers: getPublicApiCacheHeaders(false),
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "Similar wallpapers loaded.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid similar wallpaper query parameters.", {
        status: 400,
        code: "INVALID_SIMILAR_WALLPAPER_QUERY",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers/[id]/similar",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load similar wallpapers.", {
      status: 500,
      code: "SIMILAR_WALLPAPERS_FAILED",
    });
  }
}
