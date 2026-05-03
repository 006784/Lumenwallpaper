import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import {
  buildInsPickUploadMetadata,
  getInsPickCollection,
  getInsPickUploadTags,
  listInsPickCollections,
} from "@/lib/ins-picks";
import { revalidateWallpaperPublicData } from "@/lib/revalidate";
import { getWallpaperCreateErrorResponse } from "@/lib/wallpaper-create-errors";
import { createWallpaperRecord, createWallpaperSchema } from "@/lib/wallpapers";
import { getProfessionalWallpaperTitle } from "@/lib/wallpaper-title";
import type { InsPickUploadResult } from "@/types/ins-picks";

const collectionSchema = z.object({
  collection: z
    .string()
    .trim()
    .toLowerCase()
    .max(64),
});

const insPickUploadSchema = createWallpaperSchema.extend({
  collection: collectionSchema.shape.collection,
});

export async function GET() {
  return jsonSuccess(buildInsPickUploadMetadata(await listInsPickCollections()), {
    message: "INS picks upload metadata loaded.",
  });
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/ins-picks/upload", request);

  if (!isAuthConfigured()) {
    return jsonError("Authentication is not configured.", {
      status: 503,
      code: "AUTH_NOT_CONFIGURED",
    });
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return jsonError("Please sign in before uploading INS picks.", {
      status: 401,
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const rawBody = await request.json();
    const payload = insPickUploadSchema.parse(rawBody);
    const collection = await getInsPickCollection(payload.collection);

    if (!collection) {
      return jsonError("Unknown INS picks collection.", {
        status: 400,
        code: "INVALID_INS_PICK_COLLECTION",
      });
    }

    if (
      !isEditorUser(currentUser) &&
      (payload.featured || payload.status !== "published")
    ) {
      return jsonError("Only editor accounts can set moderation fields.", {
        status: 403,
        code: "WALLPAPER_MODERATION_FORBIDDEN",
      });
    }

    const uploadTags = getInsPickUploadTags(collection, payload.tags);
    const normalizedPayload = createWallpaperSchema.parse({
      ...payload,
      tags: uploadTags,
      title: getProfessionalWallpaperTitle({
        aiCaption: null,
        aiTags: [],
        height: payload.height,
        tags: uploadTags,
        title: payload.title,
        videoUrl: payload.videoUrl,
        width: payload.width,
      }),
    });

    logger.start({
      collection: collection.slug,
      creatorId: String(currentUser.id),
      tagCount: normalizedPayload.tags.length,
    });
    const wallpaper = await createWallpaperRecord(normalizedPayload, {
      creatorId: currentUser.id,
    });

    if (!wallpaper) {
      return jsonError("Wallpaper was created but could not be reloaded.", {
        status: 500,
        code: "WALLPAPER_RELOAD_FAILED",
      });
    }

    logger.done("ins_picks.wallpaper.created", {
      collection: collection.slug,
      creatorId: String(currentUser.id),
      status: wallpaper.status,
      wallpaperId: String(wallpaper.id),
    });
    revalidateWallpaperPublicData({
      creatorUsernames: [wallpaper.creator?.username],
      identifiers: [wallpaper.id, wallpaper.slug],
      insPickCollectionSlugs: [collection.slug],
    });

    const result: InsPickUploadResult = {
      collection: {
        label: collection.label,
        nativeName: collection.nativeName,
        requiredTags: collection.requiredTags,
        r2Prefix: collection.r2Prefix,
        slug: collection.slug,
      },
      upload: buildInsPickUploadMetadata(await listInsPickCollections()),
      wallpaper,
    };

    return jsonSuccess(result, {
      status: 201,
      message: "INS pick wallpaper created.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS picks upload payload.", {
        status: 400,
        code: "INVALID_INS_PICK_UPLOAD_PAYLOAD",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks/upload",
      tags: {
        method: "POST",
      },
    });
    const response = getWallpaperCreateErrorResponse(error);

    logger.warn("ins_picks.wallpaper.create.failed", {
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
