import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import { getWallpaperCreateErrorResponse } from "@/lib/wallpaper-create-errors";
import {
  getCachedPublishedWallpapers,
  EXPLORE_PAGE_SIZE,
  getCachedPublishedWallpapersPage,
} from "@/lib/public-wallpaper-cache";
import { getExploreCategory } from "@/lib/explore";
import { createWallpaperRecord, createWallpaperSchema } from "@/lib/wallpapers";

const optionalBooleanQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  return value;
}, z.boolean().optional());

function optionalIntegerQueryParam(options: { max: number; min?: number }) {
  return z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return undefined;
      }

      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? numberValue : value;
    },
    z
      .number()
      .int()
      .min(options.min ?? 1)
      .max(options.max)
      .optional(),
  );
}

const wallpapersQuerySchema = z.object({
  category: z
    .string()
    .trim()
    .toLowerCase()
    .max(40)
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || Boolean(getExploreCategory(value)), {
      message: "Unknown wallpaper category.",
    }),
  featured: optionalBooleanQueryParam,
  limit: optionalIntegerQueryParam({ max: 100 }),
  motion: optionalBooleanQueryParam,
  offset: optionalIntegerQueryParam({ max: 5000, min: 0 }),
  page: optionalIntegerQueryParam({ max: 1000 }),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  sort: z.enum(["popular", "likes", "latest"]).optional(),
  tag: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => value || undefined),
  withMeta: optionalBooleanQueryParam,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = wallpapersQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );
    const options = {
      limit: query.limit,
      offset: query.offset,
      search: query.q,
      tag: query.tag,
      category: query.category,
      sort: query.sort,
      featured: query.featured,
      motion: query.motion,
    };

    const shouldReturnPageMeta = query.withMeta || query.page !== undefined;

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
          query.page ?? 1,
          query.limit ?? EXPLORE_PAGE_SIZE,
        )
      : await getCachedPublishedWallpapers(options);

    return jsonSuccess(data, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpapers loaded.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper query parameters.", {
        status: 400,
        code: "INVALID_WALLPAPER_QUERY",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to list wallpapers.", {
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
    const rawBody = await request.json();
    const payload = createWallpaperSchema.parse(rawBody);

    if (
      !isEditorUser(currentUser) &&
      (payload.featured || payload.status !== "published")
    ) {
      return jsonError("Only editor accounts can set moderation fields.", {
        status: 403,
        code: "WALLPAPER_MODERATION_FORBIDDEN",
      });
    }

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
    const response = getWallpaperCreateErrorResponse(error);

    logger.warn("wallpaper.create.failed", {
      code: response.code,
      creatorId: String(currentUser.id),
      status: response.status,
    });

    return jsonError(response.message, {
      status: response.status,
      code: response.code,
    });
  }
}
