import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import {
  buildInsPickUploadMetadata,
  createCustomInsPickCollection,
  createInsPickSlug,
  listInsPickCollections,
} from "@/lib/ins-picks";

const createCollectionSchema = z.object({
  aliases: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  description: z
    .string()
    .trim()
    .max(400)
    .optional()
    .transform((value) => value || undefined),
  label: z.string().trim().min(1).max(80),
  nativeName: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || undefined),
  slug: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((value) => (value ? createInsPickSlug(value) : undefined)),
  status: z.enum(["active", "planned"]).optional(),
  subtitle: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => value || undefined),
});

export async function GET() {
  try {
    const collections = await listInsPickCollections();

    return jsonSuccess(
      {
        collections,
        upload: buildInsPickUploadMetadata(collections),
      },
      {
        message: "INS pick collections loaded.",
      },
    );
  } catch (error) {
    captureServerException(error, {
      route: "/api/ins-picks/collections",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load INS pick collections.", {
      status: 500,
      code: "INS_PICK_COLLECTIONS_LOAD_FAILED",
    });
  }
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/ins-picks/collections", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before creating INS pick collections.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const body = createCollectionSchema.parse(await request.json());

    logger.start({
      label: body.label,
      slug: body.slug ?? null,
      userId: String(currentUser.id),
    });

    const collection = await createCustomInsPickCollection(body, currentUser.id);
    const collections = await listInsPickCollections();

    logger.done("ins_picks.collection.created", {
      collection: collection.slug,
      r2Prefix: collection.r2Prefix,
      userId: String(currentUser.id),
    });

    return jsonSuccess(
      {
        collection,
        upload: buildInsPickUploadMetadata(collections),
      },
      {
        status: 201,
        message: "INS pick collection created.",
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS pick collection payload.", {
        status: 400,
        code: "INVALID_INS_PICK_COLLECTION_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks/collections",
      tags: {
        method: "POST",
      },
    });

    return jsonError("Failed to create INS pick collection.", {
      status: 500,
      code: "INS_PICK_COLLECTION_CREATE_FAILED",
    });
  }
}
