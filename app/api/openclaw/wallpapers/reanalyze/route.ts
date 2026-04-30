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
import { backfillWallpaperAssets, listWallpapers } from "@/lib/wallpapers";
import type {
  Wallpaper,
  WallpaperAssetBackfillResult,
  WallpaperStatus,
} from "@/types/wallpaper";

const wallpaperStatusSchema = z.enum([
  "processing",
  "published",
  "rejected",
  "all",
]);

const wallpaperBulkReanalyzeSchema = z
  .object({
    identifiers: z.array(z.string().trim().min(1)).max(25).optional(),
    status: wallpaperStatusSchema.optional().default("published"),
    limit: z.number().int().positive().max(10).optional().default(5),
    offset: z.number().int().min(0).optional().default(0),
    dryRun: z.boolean().optional().default(false),
  })
  .refine((value) => {
    return !value.identifiers || value.offset === 0;
  }, {
    message: "offset is only supported when identifiers is omitted.",
    path: ["offset"],
  });

type BulkReanalyzePayload = z.infer<typeof wallpaperBulkReanalyzeSchema>;

const REANALYZE_STATUSES: WallpaperStatus[] = [
  "published",
  "processing",
  "rejected",
];

async function listReanalyzeCandidates(payload: BulkReanalyzePayload) {
  if (payload.identifiers?.length) {
    return payload.identifiers.map((identifier) => ({
      id: identifier,
      slug: identifier,
      title: identifier,
    }));
  }

  const statuses =
    payload.status === "all" ? REANALYZE_STATUSES : [payload.status];
  const candidates: Wallpaper[] = [];

  for (const status of statuses) {
    const wallpapers = await listWallpapers({
      limit: payload.limit + payload.offset,
      motion: false,
      status,
    });

    candidates.push(...wallpapers);
  }

  return candidates
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(payload.offset, payload.offset + payload.limit);
}

export async function POST(request: Request) {
  const logger = createRouteLogger(
    "/api/openclaw/wallpapers/reanalyze",
    request,
  );
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/reanalyze",
  );

  if (auth instanceof Response) {
    return auth;
  }

  let payload: BulkReanalyzePayload;

  try {
    const result = wallpaperBulkReanalyzeSchema.safeParse(await request.json());

    if (!result.success) {
      return jsonError("Invalid wallpaper reanalyze payload.", {
        status: 400,
        code: "INVALID_BODY",
        details: formatZodError(result.error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    payload = result.data;
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Invalid wallpaper reanalyze payload.",
      {
        status: 400,
        code: "INVALID_BODY",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }

  logger.start({
    actor: auth.actor,
    dryRun: payload.dryRun,
    identifierCount: payload.identifiers?.length ?? 0,
    limit: payload.limit,
    offset: payload.offset,
    status: payload.status,
  });

  try {
    const candidates = await listReanalyzeCandidates(payload);

    if (payload.dryRun) {
      return jsonSuccess(
        {
          dryRun: true,
          requested: {
            limit: payload.limit,
            offset: payload.offset,
            status: payload.status,
          },
          candidateCount: candidates.length,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            slug: candidate.slug,
            title: candidate.title,
          })),
        },
        {
          headers: getOpenClawPrivateHeaders(),
          message: "Wallpaper AI reanalysis dry run completed.",
        },
      );
    }

    const results: WallpaperAssetBackfillResult[] = [];
    const failures: Array<{ identifier: string; error: string }> = [];

    for (const candidate of candidates) {
      try {
        const result = await backfillWallpaperAssets(candidate.id, {
          forceAi: true,
        });

        if (!result) {
          failures.push({
            identifier: candidate.id,
            error: "Wallpaper could not be loaded for AI reanalysis.",
          });
        } else if (result.aiAnalysisStatus === "failed") {
          failures.push({
            identifier: candidate.id,
            error: result.aiAnalysisError ?? "AI reanalysis failed.",
          });
          results.push(result);
        } else {
          results.push(result);
        }
      } catch (error) {
        failures.push({
          identifier: candidate.id,
          error:
            error instanceof Error
              ? error.message
              : "Failed to reanalyze wallpaper.",
        });
      }
    }

    logger.done("openclaw.wallpapers.reanalyze.completed", {
      actor: auth.actor,
      failedCount: failures.length,
      processedCount: results.length,
    });

    return jsonSuccess(
      {
        requested: {
          limit: payload.limit,
          offset: payload.offset,
          status: payload.status,
        },
        candidateCount: candidates.length,
        processedCount: results.length,
        failedCount: failures.length,
        nextOffset: payload.offset + candidates.length,
        results,
        failures,
      },
      {
        headers: getOpenClawPrivateHeaders(),
        message: "Wallpaper AI reanalysis batch completed.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/reanalyze",
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to reanalyze wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPERS_REANALYZE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
