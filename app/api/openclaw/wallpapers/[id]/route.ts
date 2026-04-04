import { ZodError } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import {
  getOpenClawPrivateHeaders,
  requireOpenClawApiAccess,
  toOpenClawWallpaperPayload,
} from "@/lib/openclaw";
import {
  deleteWallpaperRecord,
  getWallpaperByIdOrSlug,
  updateWallpaperRecord,
  updateWallpaperSchema,
} from "@/lib/wallpapers";

type OpenClawWallpaperRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(
  request: Request,
  { params }: OpenClawWallpaperRouteProps,
) {
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/[id]",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const wallpaper = await getWallpaperByIdOrSlug(params.id);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(toOpenClawWallpaperPayload(wallpaper), {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpaper loaded.",
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/[id]",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to load wallpaper.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_GET_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: OpenClawWallpaperRouteProps,
) {
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/[id]",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const payload = updateWallpaperSchema.parse(await request.json());
    const wallpaper = await updateWallpaperRecord(params.id, payload);

    if (!wallpaper) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(toOpenClawWallpaperPayload(wallpaper), {
      headers: getOpenClawPrivateHeaders(),
      message: "Wallpaper updated.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid wallpaper update payload.", {
        status: 400,
        code: "INVALID_WALLPAPER_UPDATE_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/wallpapers/[id]",
      tags: {
        method: "PATCH",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to update wallpaper.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_UPDATE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: OpenClawWallpaperRouteProps,
) {
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/[id]",
  );

  if (auth instanceof Response) {
    return auth;
  }

  try {
    const deleted = await deleteWallpaperRecord(params.id);

    if (!deleted) {
      return jsonError("Wallpaper not found.", {
        status: 404,
        code: "WALLPAPER_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    return jsonSuccess(
      {
        id: params.id,
      },
      {
        headers: getOpenClawPrivateHeaders(),
        message: "Wallpaper deleted.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/[id]",
      tags: {
        method: "DELETE",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to delete wallpaper.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_DELETE_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
