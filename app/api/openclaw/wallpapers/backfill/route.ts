import { z } from "zod";

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
  const logger = createRouteLogger("/api/openclaw/wallpapers/backfill", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/backfill",
  );

  if (auth instanceof Response) {
    return auth;
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
        headers: getOpenClawPrivateHeaders(),
      });
    }

    parsedBody = result.data;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid wallpaper backfill payload.",
      {
        status: 400,
        code: "INVALID_BODY",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }

  logger.start({
    actor: auth.actor,
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

    logger.done("openclaw.wallpaper.backfill.completed", {
      actor: auth.actor,
      processedCount: summary.processedCount,
    });

    return jsonSuccess(summary, {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpaper asset backfill completed.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/backfill",
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to backfill wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_BACKFILL_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
