import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import {
  getWallpaperByIdOrSlug,
  getWallpaperFavoriteState,
  toggleWallpaperFavorite,
} from "@/lib/wallpapers";

type WallpaperFavoriteRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  _request: Request,
  { params }: WallpaperFavoriteRouteProps,
) {
  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
      });
    }

    const currentUser = getCurrentUser();
    const snapshot = await getWallpaperFavoriteState(
      params.id,
      currentUser?.id ?? null,
    );

    return jsonSuccess(
      {
        ...snapshot,
        isSignedIn: Boolean(currentUser),
      },
      {
      message: "Favorite state loaded.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/favorite",
      tags: {
        method: "GET",
      },
    });
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load favorite state.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_FAVORITE_STATE_FAILED",
    });
  }
}

export async function POST(
  _request: Request,
  { params }: WallpaperFavoriteRouteProps,
) {
  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before favoriting wallpapers.", {
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

    const snapshot = await toggleWallpaperFavorite(params.id, currentUser.id);

    return jsonSuccess(snapshot, {
      message: snapshot.isFavorited
        ? "Wallpaper favorited."
        : "Wallpaper unfavorited.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/wallpapers/[id]/favorite",
      tags: {
        method: "POST",
      },
    });
    const message =
      error instanceof Error ? error.message : "Failed to toggle favorite.";

    return jsonError(message, {
      status: 500,
      code: "WALLPAPER_FAVORITE_TOGGLE_FAILED",
    });
  }
}
