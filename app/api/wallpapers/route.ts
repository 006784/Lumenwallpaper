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

const wallpaperSortQueryParam = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized || normalized === "new") {
      return normalized || undefined;
    }

    if (["hot", "download", "downloads", "trending"].includes(normalized)) {
      return "popular";
    }

    if (["favorite", "favorites", "liked"].includes(normalized)) {
      return "likes";
    }

    return normalized;
  },
  z.enum(["popular", "likes", "latest"]).optional(),
);

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
  aspect: z
    .enum(["desktop", "phone", "square", "tablet", "ultrawide"])
    .optional(),
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
  media: z.enum(["all", "motion", "static"]).optional(),
  minHeight: optionalIntegerQueryParam({ max: 20000 }),
  minWidth: optionalIntegerQueryParam({ max: 20000 }),
  motion: optionalBooleanQueryParam,
  offset: optionalIntegerQueryParam({ max: 5000, min: 0 }),
  orientation: z.enum(["landscape", "portrait", "square"]).optional(),
  page: optionalIntegerQueryParam({ max: 1000 }),
  q: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
  resolution: z.enum(["1080p", "2k", "4k", "5k", "8k"]).optional(),
  sort: wallpaperSortQueryParam,
  color: z
    .string()
    .trim()
    .max(32)
    .optional()
    .transform((value) => value || undefined),
  style: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => value || undefined),
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
      aspect: query.aspect,
      color: query.color,
      limit: query.limit,
      media: query.media,
      minHeight: query.minHeight,
      minWidth: query.minWidth,
      offset: query.offset,
      orientation: query.orientation,
      resolution: query.resolution,
      search: query.q,
      tag: query.tag,
      category: query.category,
      sort: query.sort,
      style: query.style,
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
            aspect: options.aspect,
            color: options.color,
            featured: options.featured,
            media: options.media,
            minHeight: options.minHeight,
            minWidth: options.minWidth,
            motion: options.motion,
            orientation: options.orientation,
            resolution: options.resolution,
            sort: options.sort,
            style: options.style,
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
      details: response.details,
    });
  }
}
