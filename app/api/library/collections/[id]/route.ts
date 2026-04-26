import {
  captureServerException,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUserCollectionDetail } from "@/lib/wallpapers";

type LibraryCollectionRouteProps = {
  params: {
    id: string;
  };
};

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

export async function GET(
  _request: Request,
  { params }: LibraryCollectionRouteProps,
) {
  const auth = requireLibraryUser();

  if ("response" in auth) {
    return auth.response;
  }

  try {
    const collection = await getUserCollectionDetail(auth.user.id, params.id);

    if (!collection) {
      return jsonError("Collection not found.", {
        status: 404,
        code: "COLLECTION_NOT_FOUND",
      });
    }

    return jsonSuccess(
      {
        collection,
      },
      {
        message: "Collection loaded.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/library/collections/[id]",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load collection.", {
      status: 500,
      code: "COLLECTION_LOAD_FAILED",
    });
  }
}
