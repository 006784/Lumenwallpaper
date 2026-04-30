import { ZodError, z } from "zod";

import {
  captureServerException,
  formatZodError,
  jsonError,
  jsonSuccess,
} from "@/lib/api";
import { getPublicApiCacheHeaders } from "@/lib/cache";
import {
  getCachedInsPicksSnapshot,
  getInsPickCollection,
} from "@/lib/ins-picks";

export const dynamic = "force-dynamic";

const insPicksQuerySchema = z.object({
  collection: z
    .string()
    .trim()
    .toLowerCase()
    .max(64)
    .optional()
    .transform((value) => value || undefined),
  limit: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null || value === "") {
          return undefined;
        }

        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue : value;
      },
      z.number().int().min(1).max(100).optional(),
    )
    .optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = insPicksQuerySchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    if (query.collection && !(await getInsPickCollection(query.collection))) {
      return jsonError("Unknown INS picks collection.", {
        status: 400,
        code: "INVALID_INS_PICK_COLLECTION",
      });
    }

    const snapshot = await getCachedInsPicksSnapshot({
      collectionSlug: query.collection,
      limit: query.limit,
    });

    return jsonSuccess(snapshot, {
      headers: getPublicApiCacheHeaders(true),
      message: "INS picks loaded.",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid INS picks query parameters.", {
        status: 400,
        code: "INVALID_INS_PICKS_QUERY",
        details: formatZodError(error),
      });
    }

    captureServerException(error, {
      route: "/api/ins-picks",
      tags: {
        method: "GET",
      },
    });

    return jsonError("Failed to load INS picks.", {
      status: 500,
      code: "INS_PICKS_LOAD_FAILED",
    });
  }
}
