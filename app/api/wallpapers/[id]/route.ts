import { ZodError } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import {
  deleteWallpaperRecord,
  getWallpaperByIdOrSlug,
  updateWallpaperRecord,
  updateWallpaperSchema,
} from "@/lib/wallpapers";

type WallpaperRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: WallpaperRouteProps,
) {
  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        headers: getPublicApiCacheHeaders(false),
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(wallpaper, {
      headers: getPublicApiCacheHeaders(true),
      message: "Wallpaper loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]",
      tags: {
        method: "GET",
      },
    });
    return jsonError("Failed to load wallpaper.", {
      status: 500,
      code: "WALLPAPER_GET_FAILED",
    });
  }
}

export async function PATCH(
  request: Request,
  { params }: WallpaperRouteProps,
) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before updating wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    const canModerate = isEditorUser(currentUser);

    if (wallpaper.userId !== currentUser.id && !canModerate) {
      return jsonError("You can only update your own wallpapers.", {
        status: 403,
        code: "WALLPAPER_FORBIDDEN",
      });
    }

    const payload = updateWallpaperSchema.parse(await request.json());

    if (
      !canModerate &&
      ((payload.featured !== undefined &&
        payload.featured !== wallpaper.featured) ||
        (payload.status !== undefined && payload.status !== wallpaper.status))
    ) {
      return jsonError("Only editor accounts can change moderation fields.", {
        status: 403,
        code: "WALLPAPER_MODERATION_FORBIDDEN",
      });
    }

    const updatedWallpaper = await updateWallpaperRecord(wallpaper.id, payload);

    if (!updatedWallpaper) {
      return jsonError("Wallpaper not found after update.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    return jsonSuccess(updatedWallpaper, {
      message: "Wallpaper updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper update payload.", {
        status: 400,
        code: "INVALID_WALLPAPER_UPDATE_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/wallpapers/[id]",
      tags: {
        method: "PATCH",
      },
    });
    return jsonError("Failed to update wallpaper.", {
      status: 500,
      code: "WALLPAPER_UPDATE_FAILED",
    });
  }
}

export async function DELETE(
  _request: Request,
  { params }: WallpaperRouteProps,
) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before deleting wallpapers.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    if (wallpaper.userId !== currentUser.id && !isEditorUser(currentUser)) {
      return jsonError("You can only delete your own wallpapers.", {
        status: 403,
        code: "WALLPAPER_FORBIDDEN",
      });
    }

    await deleteWallpaperRecord(wallpaper.id);

    return jsonSuccess(
      {
        id: wallpaper.id,
      },
      {
        message: "Wallpaper deleted.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]",
      tags: {
        method: "DELETE",
      },
    });
    return jsonError("Failed to delete wallpaper.", {
      status: 500,
      code: "WALLPAPER_DELETE_FAILED",
    });
  }
}
