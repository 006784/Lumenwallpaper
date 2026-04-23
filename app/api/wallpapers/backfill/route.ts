import { z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import {
  backfillCreatorWallpaperAssets,
  backfillWallpaperAssets,
} from "@/lib/wallpapers";
import type { WallpaperAssetBackfillSummary } from "@/types/wallpaper";

const wallpaperBackfillSchema = z
  .object({
    creatorUsername: z.string().trim().min(1).max(64).optional(),
    identifiers: z.array(z.string().trim().min(1)).max(50).optional(),
    limit: z.number().int().positive().max(50).optional(),
    forceAi: z.boolean().optional().default(false),
    forceColors: z.boolean().optional().default(false),
    forceVariants: z.boolean().optional().default(false),
  })
  .refine((value) => {
    return Boolean(value.creatorUsername) || (value.identifiers?.length ?? 0) > 0;
  }, {
    message: "Provide creatorUsername or identifiers.",
    path: ["creatorUsername"],
  });

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/wallpapers/backfill", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before backfilling wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  if (!isEditorUser(currentUser)) {
    return jsonError("Only editor accounts can backfill wallpaper assets.", {
      status: 403,
      code: "WALLPAPER_BACKFILL_FORBIDDEN",
    });
  }

  let parsedBody: z.infer<typeof wallpaperBackfillSchema>;

  try {
    const body = await request.json();
    const result = wallpaperBackfillSchema.safeParse(body);

    if (!result.success) {
      return jsonError("Invalid wallpaper backfill payload.", {
        status: 400,
        code: "INVALID_BODY",
        details: formatZodError(result.error),
      });
    }

    parsedBody = result.data;
  } catch {
    return jsonError("Invalid wallpaper backfill payload.", {
      status: 400,
      code: "INVALID_BODY",
    });
  }

  logger.start({
    creatorUsername: parsedBody.creatorUsername ?? null,
    identifierCount: parsedBody.identifiers?.length ?? 0,
  });

  try {
    let summary: WallpaperAssetBackfillSummary;

    if (parsedBody.creatorUsername) {
      summary = await backfillCreatorWallpaperAssets(parsedBody.creatorUsername, {
        forceAi: parsedBody.forceAi,
        forceColors: parsedBody.forceColors,
        forceVariants: parsedBody.forceVariants,
        limit: parsedBody.limit,
      });
    } else {
      const results = [];

      for (const identifier of parsedBody.identifiers ?? []) {
        const result = await backfillWallpaperAssets(identifier, {
          forceAi: parsedBody.forceAi,
          forceColors: parsedBody.forceColors,
          forceVariants: parsedBody.forceVariants,
        });

        if (result) {
          results.push(result);
        }
      }

      summary = {
        creatorUsername: null,
        processedCount: results.length,
        results,
      };
    }

    logger.done("wallpaper.backfill.request.completed", {
      processedCount: summary.processedCount,
    });

    return jsonSuccess(summary, {
      message: "Wallpaper asset backfill completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/backfill",
    });

    logger.warn("wallpaper.backfill.request.failed", {
      error: error instanceof Error ? error.message : "Unknown error.",
    });

    return jsonError("Failed to backfill wallpapers.", {
      status: 500,
      code: "WALLPAPER_BACKFILL_FAILED",
    });
  }
}
