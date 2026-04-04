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
import { listDuplicateWallpaperGroups } from "@/lib/wallpapers";

const duplicateQuerySchema = z.object({
  creator: z.string().trim().max(64).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  reason: z.enum(["all", "asset_id", "fallback_fingerprint"]).optional(),
  status: z.enum(["all", "processing", "published", "rejected"]).optional(),
});

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers/duplicates", request);
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/duplicates",
  );

  if (auth instanceof Response) {
    return auth;
  }

  const params = new URL(request.url).searchParams;
  const parsed = duplicateQuerySchema.safeParse({
    creator: params.get("creator") ?? undefined,
    limit: params.get("limit") ?? undefined,
    reason: params.get("reason") ?? undefined,
    status: params.get("status") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid duplicate query.", {
      status: 400,
      code: "INVALID_DUPLICATE_QUERY",
      details: formatZodError(parsed.error),
      headers: getOpenClawPrivateHeaders(),
    });
  }

  try {
    const groups = await listDuplicateWallpaperGroups(parsed.data);

    logger.done("openclaw.wallpapers.duplicates.loaded", {
      actor: auth.actor,
      count: groups.length,
    });

    return jsonSuccess(groups, {
      headers: getOpenClawPrivateHeaders(),
      message: "Duplicate wallpaper groups loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/duplicates",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to detect duplicate wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_DUPLICATE_WALLPAPERS_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
