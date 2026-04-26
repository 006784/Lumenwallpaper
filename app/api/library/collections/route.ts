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
  createUserCollection,
  listUserCollections,
} from "@/lib/wallpapers";

const createCollectionSchema = z.object({
  isPublic: z.boolean().optional().default(false),
  name: z.string().trim().min(1).max(40),
});

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

export async function GET() {
  const auth = requireLibraryUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const collections = await listUserCollections(auth.user.id);

    return jsonSuccess(
      {
        collections,
      },
      {
        message: "Collections loaded.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/library/collections",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load collections.", {
      status: 500,
      code: "COLLECTIONS_LOAD_FAILED",
    });
  }
}

export async function POST(request: Request) {
  const auth = requireLibraryUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const payload = createCollectionSchema.parse(await request.json());
    const result = await createUserCollection(auth.user.id, payload);

    logServerEvent("info", "library.collection.created", {
      collectionId: result.collection.id,
      isPublic: result.collection.isPublic,
      userId: auth.user.id,
    });

    return jsonSuccess(result, {
      status: 201,
      message: "Collection created.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError("Invalid collection payload.", {
        status: 400,
        code: "INVALID_COLLECTION_PAYLOAD",
        details: formatZodError(error),
      });
    }

    if (
      error instanceof Error &&
      error.message === "Collection name already exists."
    ) {
      return jsonError("Collection name already exists.", {
        status: 409,
        code: "COLLECTION_NAME_EXISTS",
      });
    }

    captureServerException(error, {
      route: "/api/library/collections",
      tags: {
        method: "POST",
      },
    });

    return jsonError("Failed to create collection.", {
      status: 500,
      code: "COLLECTION_CREATE_FAILED",
    });
  }
}
