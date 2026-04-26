import { z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { logServerEvent } from "@/lib/monitoring";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  addWallpaperToCollection,
  removeWallpaperFromCollection,
} from "@/lib/wallpapers";

type LibraryCollectionItemsRouteProps = {
  params: {
    id: string;
  };
};

const collectionItemPayloadSchema = z.preprocess(
  (input) => {
    if (!input || typeof input !== "object") {
      return input;
    }

    const payload = input as Record<string, unknown>;

    return {
      wallpaperId: payload.wallpaperId ?? payload.wallpaperSlug ?? payload.id,
    };
  },
  z.object({
    wallpaperId: z.string().trim().min(1).max(160),
  }),
);

function requireLibraryUser() {
  if (!isAuthConfigured()) {
    return {
      response: jsonError("Authentication is not configured.", {
        status: 503,
        code: "AUTH_NOT_CONFIGURED",
      }),
    };
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return {
      response: jsonError("Please sign in before managing collections.", {
        status: 401,
        code: "AUTH_REQUIRED",
      }),
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      response: jsonError("Supabase is not configured.", {
        status: 503,
        code: "SUPABASE_NOT_CONFIGURED",
      }),
    };
  }

  return {
    user: currentUser,
  };
}

async function readCollectionItemPayload(request: Request) {
  const { searchParams } = new URL(request.url);
  const queryWallpaperId =
    searchParams.get("wallpaperId") ??
    searchParams.get("wallpaperSlug") ??
    searchParams.get("id");

  if (queryWallpaperId) {
    return {
      wallpaperId: queryWallpaperId,
    };
  }

  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(
  request: Request,
  { params }: LibraryCollectionItemsRouteProps,
) {
  const auth = requireLibraryUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = collectionItemPayloadSchema.parse(await request.json());
    const result = await addWallpaperToCollection(
      auth.user.id,
      params.id,
      payload.wallpaperId,
    );

    if (!result) {
      return jsonError("Collection or wallpaper not found.", {
        status: 404,
        code: "COLLECTION_ITEM_TARGET_NOT_FOUND",
      });
    }

    logServerEvent("info", "library.collection_item.added", {
      collectionId: result.collection.id,
      userId: auth.user.id,
      wallpaperId: result.wallpaper.id,
    });

    return jsonSuccess(result, {
      status: 201,
      message: "Wallpaper added to collection.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid collection item payload.", {
        status: 400,
        code: "INVALID_COLLECTION_ITEM_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/library/collections/[id]/items",
      tags: {
        method: "POST",
      },
    });

    return jsonError("Failed to add wallpaper to collection.", {
      status: 500,
      code: "COLLECTION_ITEM_ADD_FAILED",
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: LibraryCollectionItemsRouteProps,
) {
  const auth = requireLibraryUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = collectionItemPayloadSchema.parse(
      await readCollectionItemPayload(request),
    );
    const result = await removeWallpaperFromCollection(
      auth.user.id,
      params.id,
      payload.wallpaperId,
    );

    if (!result) {
      return jsonError("Collection or wallpaper not found.", {
        status: 404,
        code: "COLLECTION_ITEM_TARGET_NOT_FOUND",
      });
    }

    logServerEvent("info", "library.collection_item.removed", {
      collectionId: result.collection.id,
      userId: auth.user.id,
      wallpaperId: result.wallpaper.id,
    });

    return jsonSuccess(result, {
      message: "Wallpaper removed from collection.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid collection item payload.", {
        status: 400,
        code: "INVALID_COLLECTION_ITEM_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/library/collections/[id]/items",
      tags: {
        method: "DELETE",
      },
    });

    return jsonError("Failed to remove wallpaper from collection.", {
      status: 500,
      code: "COLLECTION_ITEM_REMOVE_FAILED",
    });
  }
}
