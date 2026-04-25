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
  toOpenClawWallpaperCollection,
  toOpenClawWallpaperPayload,
} from "@/lib/openclaw";
import { getWallpaperCreateErrorResponse } from "@/lib/wallpaper-create-errors";
import {
  createWallpaperRecord,
  createWallpaperSchema,
  listWallpapers,
} from "@/lib/wallpapers";

const wallpaperStatusSchema = z.enum(["processing", "published", "rejected"]);
const wallpaperSortSchema = z.enum(["latest", "popular", "likes"]);

const wallpapersQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(64).optional(),
  category: z.string().trim().max(64).optional(),
  sort: wallpaperSortSchema.optional(),
  status: wallpaperStatusSchema.optional(),
  featured: z.enum(["true", "false", "1", "0"]).optional(),
  motion: z.enum(["true", "false", "1", "0"]).optional(),
});

function parseOptionalBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === "true" || value === "1";
}

export async function GET(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/wallpapers");

  if (auth instanceof Response) {
    return auth;
  }

  const params = new URL(request.url).searchParams;
  const parsedQuery = wallpapersQuerySchema.safeParse({
    limit: params.get("limit") ?? undefined,
    q: params.get("q") ?? undefined,
    tag: params.get("tag") ?? undefined,
    category: params.get("category") ?? undefined,
    sort: params.get("sort") ?? undefined,
    status: params.get("status") ?? undefined,
    featured: params.get("featured") ?? undefined,
    motion: params.get("motion") ?? undefined,
  });

  if (!parsedQuery.success) {
    return jsonError("Invalid wallpaper query.", {
      status: 400,
      code: "INVALID_WALLPAPER_QUERY",
      details: formatZodError(parsedQuery.error),
      headers: getOpenClawPrivateHeaders(),
    });
  }

  try {
    logger.start({
      actor: auth.actor,
      status: parsedQuery.data.status ?? "published",
    });

    const wallpapers = await listWallpapers({
      limit: parsedQuery.data.limit,
      search: parsedQuery.data.q,
      tag: parsedQuery.data.tag,
      category: parsedQuery.data.category,
      sort: parsedQuery.data.sort,
      status: parsedQuery.data.status,
      featured: parseOptionalBoolean(parsedQuery.data.featured),
      motion: parseOptionalBoolean(parsedQuery.data.motion),
    });

    logger.done("openclaw.wallpapers.list.loaded", {
      actor: auth.actor,
      count: wallpapers.length,
    });

    return jsonSuccess(toOpenClawWallpaperCollection(wallpapers), {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpapers loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to list wallpapers.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPERS_LIST_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/wallpapers", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/wallpapers");

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = createWallpaperSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      hasDescription: Boolean(payload.description?.trim()),
      tagCount: payload.tags.length,
    });
    const wallpaper = await createWallpaperRecord(payload);

    if (!wallpaper) {
      return jsonError("Wallpaper was created but could not be reloaded.", {
        status: 500,
        code: "WALLPAPER_RELOAD_FAILED",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    logger.done("openclaw.wallpaper.created", {
      actor: auth.actor,
      wallpaperId: wallpaper.id,
      status: wallpaper.status,
    });

    return jsonSuccess(toOpenClawWallpaperPayload(wallpaper), {
      headers: getOpenClawPrivateHeaders(),
      status: 201,
      message: "Wallpaper created.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper payload.", {
        status: 400,
        code: "INVALID_WALLPAPER_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/wallpapers",
      tags: {
        method: "POST",
      },
    });
    const response = getWallpaperCreateErrorResponse(error);

    logger.warn("openclaw.wallpaper.create.failed", {
      actor: auth.actor,
      code: response.code,
      status: response.status,
    });

    return jsonError(response.message, {
      status: response.status,
      code:
        response.code === "WALLPAPER_CREATE_FAILED"
          ? "OPENCLAW_WALLPAPER_CREATE_FAILED"
          : response.code,
      headers: getOpenClawPrivateHeaders(),
    });
  }
}
