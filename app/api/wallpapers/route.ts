import { ZodError } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import {
  getCachedPublishedWallpapers,
  EXPLORE_PAGE_SIZE,
  getCachedPublishedWallpapersPage,
} from "@/lib/public-wallpaper-cache";
import type { WallpaperSort } from "@/types/wallpaper";
import {
  createWallpaperRecord,
  createWallpaperSchema,
} from "@/lib/wallpapers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const q = searchParams.get("q");
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const featured = searchParams.get("featured");
    const motion = searchParams.get("motion");
    const page = searchParams.get("page");
    const withMeta = searchParams.get("withMeta");

    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? Number.parseInt(offset, 10) : undefined;
    const parsedSort: WallpaperSort | undefined =
      sort === "popular" || sort === "likes" || sort === "latest"
        ? sort
        : undefined;
    const parsedPage = page ? Number.parseInt(page, 10) : undefined;
    const normalizedLimit =
      parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : undefined;
    const options = {
      limit: normalizedLimit,
      offset:
        parsedOffset && Number.isFinite(parsedOffset) && parsedOffset > 0
          ? parsedOffset
          : undefined,
      search: q ?? undefined,
      tag: tag ?? undefined,
      category: category ?? undefined,
      sort: parsedSort,
      featured:
        featured === null ? undefined : featured === "true" || featured === "1",
      motion: motion === null ? undefined : motion === "true" || motion === "1",
    };

    const shouldReturnPageMeta =
      withMeta === "true" || withMeta === "1" || parsedPage !== undefined;

    const data = shouldReturnPageMeta
      ? await getCachedPublishedWallpapersPage(
          {
            search: options.search,
            tag: options.tag,
            category: options.category,
            featured: options.featured,
            motion: options.motion,
            sort: options.sort,
          },
          parsedPage && Number.isFinite(parsedPage) && parsedPage > 0
            ? parsedPage
            : 1,
          normalizedLimit ?? EXPLORE_PAGE_SIZE,
        )
      : await getCachedPublishedWallpapers(options);

    return jsonSuccess(data, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpapers loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers",
      tags: {
        method: "GET",
      },
    });
    const message =
      error instanceof Error ? error.message : "Failed to list wallpapers.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPERS_LIST_FAILED",
    });
  }
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/wallpapers", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before creating wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const payload = createWallpaperSchema.parse(await request.json());
    logger.start({
      creatorId: String(currentUser.id),
      hasDescription: Boolean(payload.description?.trim()),
      tagCount: payload.tags.length,
    });
    const wallpaper = await createWallpaperRecord(payload, {
      creatorId: currentUser.id,
    });

    if (!wallpaper) {
      return jsonError("Wallpaper was created but could not be reloaded.", {
        status: 500,
        code: "WALLPAPER_RELOAD_FAILED",
      });
    }

    logger.done("wallpaper.created", {
      creatorId: String(currentUser.id),
      status: wallpaper.status,
      wallpaperId: String(wallpaper.id),
    });

    return jsonSuccess(wallpaper, {
      status: 201,
      message: "Wallpaper created.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper payload.", {
        status: 400,
        code: "INVALID_WALLPAPER_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers",
      tags: {
        method: "POST",
      },
    });
    const message =
      error instanceof Error ? error.message : "Failed to create wallpaper.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_CREATE_FAILED",
    });
  }
}
