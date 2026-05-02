import { Buffer } from "node:buffer";

import { ZodError, z } from "zod";

import {
  captureServerException,
  createRouteLogger,
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
  ALLOWED_UPLOAD_MIME_TYPES,
  buildR2StoragePath,
  getR2ObjectUrl,
  getUploadMaxSizeBytes,
  isR2Configured,
  isVideoUploadMimeType,
  putR2Object,
} from "@/lib/r2";
import { getWallpaperCreateErrorResponse } from "@/lib/wallpaper-create-errors";
import {
  createWallpaperRecord,
  createWallpaperSchema,
} from "@/lib/wallpapers";

export const maxDuration = 60;

const allowedUploadMimeTypeSchema = z.enum(ALLOWED_UPLOAD_MIME_TYPES);

const remoteUploadSchema = createWallpaperSchema
  .omit({
    original: true,
    posterOriginal: true,
    videoUrl: true,
  })
  .extend({
    contentType: allowedUploadMimeTypeSchema.optional(),
    directory: z.string().trim().min(1).max(120).optional(),
    filename: z.string().trim().min(1).max(255).optional(),
    licenseAccepted: z.boolean().optional().default(true),
    posterContentType: allowedUploadMimeTypeSchema.optional(),
    posterFilename: z.string().trim().min(1).max(255).optional(),
    posterSourceUrl: z.string().trim().url().optional(),
    preserveSourceObjects: z.boolean().optional().default(true),
    skipAiEnrichment: z.boolean().optional().default(false),
    skipVariantGeneration: z.boolean().optional().default(false),
    sourceUrl: z.string().trim().url(),
  });

type RemoteUploadPayload = z.infer<typeof remoteUploadSchema>;

type DownloadedRemoteAsset = {
  buffer: Buffer;
  contentType: (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];
  filename: string;
  format: string;
  size: number;
  sourceUrl: string;
};

const extensionToContentType = new Map<
  string,
  (typeof ALLOWED_UPLOAD_MIME_TYPES)[number]
>([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["mp4", "video/mp4"],
  ["webm", "video/webm"],
  ["mov", "video/quicktime"],
]);

function isPrivateIpLiteral(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (
    normalized === "localhost" ||
    normalized === "::1" ||
    normalized.startsWith("127.") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("169.254.") ||
    normalized.startsWith("192.168.") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  ) {
    return true;
  }

  const parts = normalized.split(".");
  const first = Number(parts[0]);
  const second = Number(parts[1]);

  return first === 172 && second >= 16 && second <= 31;
}

function assertRemoteUrlAllowed(rawUrl: string) {
  const url = new URL(rawUrl);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Remote upload source must use http or https.");
  }

  if (isPrivateIpLiteral(url.hostname)) {
    throw new Error("Remote upload source cannot point to a private host.");
  }
}

function getFilenameFromUrl(rawUrl: string, fallback: string) {
  const pathname = new URL(rawUrl).pathname;
  const filename = decodeURIComponent(pathname.split("/").pop() ?? "").trim();

  return filename || fallback;
}

function getFileExtension(filename: string, contentType: string) {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension && extensionToContentType.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  if (contentType === "video/mp4") {
    return "mp4";
  }

  if (contentType === "video/webm") {
    return "webm";
  }

  return "mov";
}

function normalizeResponseContentType(value: string | null) {
  return value?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function inferContentType(
  filename: string,
  responseContentType: string,
  declaredContentType?: (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
) {
  if (declaredContentType) {
    return declaredContentType;
  }

  const normalizedResponseContentType =
    normalizeResponseContentType(responseContentType);

  if (allowedUploadMimeTypeSchema.safeParse(normalizedResponseContentType).success) {
    return normalizedResponseContentType as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];
  }

  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const inferred = extensionToContentType.get(extension);

  if (inferred) {
    return inferred;
  }

  throw new Error("Remote upload content type is not supported.");
}

async function downloadRemoteAsset(options: {
  contentType?: (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];
  fallbackFilename: string;
  filename?: string;
  sourceUrl: string;
}): Promise<DownloadedRemoteAsset> {
  assertRemoteUrlAllowed(options.sourceUrl);

  const filename =
    options.filename ?? getFilenameFromUrl(options.sourceUrl, options.fallbackFilename);
  const response = await fetch(options.sourceUrl, {
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Remote upload source returned HTTP ${response.status}.`);
  }

  const contentType = inferContentType(
    filename,
    response.headers.get("content-type") ?? "",
    options.contentType,
  );
  const maxSizeBytes = getUploadMaxSizeBytes(contentType);
  const declaredSize = Number(response.headers.get("content-length") ?? 0);

  if (declaredSize > maxSizeBytes) {
    throw new Error("Remote upload source is larger than the allowed size.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > maxSizeBytes) {
    throw new Error("Remote upload source is larger than the allowed size.");
  }

  const format = getFileExtension(filename, contentType);

  return {
    buffer,
    contentType,
    filename,
    format,
    size: buffer.length,
    sourceUrl: options.sourceUrl,
  };
}

async function uploadRemoteAsset(options: {
  asset: DownloadedRemoteAsset;
  directory?: string;
  metadata?: Record<string, string>;
}) {
  const storagePath = buildR2StoragePath({
    directory: options.directory,
    filename: options.asset.filename,
    variant: "original",
  });

  const uploaded = await putR2Object({
    path: storagePath,
    body: options.asset.buffer,
    contentType: options.asset.contentType,
    variant: "original",
    metadata: {
      source: "openclaw-remote-upload",
      source_url: options.asset.sourceUrl,
      ...options.metadata,
    },
  });

  return {
    contentType: options.asset.contentType,
    format: options.asset.format,
    size: options.asset.size,
    storagePath: uploaded.path,
    url: uploaded.url || getR2ObjectUrl(uploaded.path),
  };
}

export async function POST(request: Request) {
  const logger = createRouteLogger("/api/openclaw/upload/remote", request);
  const auth = requireOpenClawApiAccess(request, "/api/openclaw/upload/remote");

  if (auth instanceof Response) {
    return auth;
  }

  if (!isR2Configured()) {
    return jsonError("R2 is not configured.", {
      status: 503,
      code: "R2_NOT_CONFIGURED",
      headers: getOpenClawPrivateHeaders(),
    });
  }

  try {
    const payload = remoteUploadSchema.parse(await request.json());
    logger.start({
      actor: auth.actor,
      hasPosterSource: Boolean(payload.posterSourceUrl),
      title: payload.title,
    });

    const originalAsset = await downloadRemoteAsset({
      contentType: payload.contentType,
      fallbackFilename: "openclaw-upload",
      filename: payload.filename,
      sourceUrl: payload.sourceUrl,
    });
    const original = await uploadRemoteAsset({
      asset: originalAsset,
      directory: payload.directory,
      metadata: {
        openclaw_actor: auth.actor,
      },
    });
    const posterOriginal =
      payload.posterSourceUrl && isVideoUploadMimeType(original.contentType)
        ? await downloadRemoteAsset({
            contentType: payload.posterContentType,
            fallbackFilename: "openclaw-poster",
            filename: payload.posterFilename,
            sourceUrl: payload.posterSourceUrl,
          }).then((asset) =>
            uploadRemoteAsset({
              asset,
              directory: payload.directory,
              metadata: {
                openclaw_actor: auth.actor,
                role: "poster",
              },
            }),
          )
        : undefined;

    const createPayload = createWallpaperSchema.parse({
      colors: payload.colors,
      creator: payload.creator,
      description: payload.description,
      featured: payload.featured,
      height: payload.height,
      licenseAccepted: payload.licenseAccepted,
      licenseVersion: payload.licenseVersion,
      original,
      posterOriginal,
      status: payload.status,
      tags: payload.tags,
      title: payload.title,
      videoUrl: isVideoUploadMimeType(original.contentType)
        ? original.url
        : undefined,
      width: payload.width,
    });
    const wallpaper = await createWallpaperRecord(createPayload, {
      preserveSourceObjects: payload.preserveSourceObjects,
      skipAiEnrichment: payload.skipAiEnrichment,
      skipVariantGeneration: payload.skipVariantGeneration,
    });

    if (!wallpaper) {
      return jsonError("Wallpaper was created but could not be reloaded.", {
        status: 500,
        code: "WALLPAPER_RELOAD_FAILED",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    logger.done("openclaw.upload.remote.created", {
      actor: auth.actor,
      contentType: original.contentType,
      wallpaperId: wallpaper.id,
    });

    return jsonSuccess(
      {
        source: {
          contentType: original.contentType,
          size: original.size,
          storagePath: original.storagePath,
          url: original.url,
        },
        wallpaper: toOpenClawWallpaperPayload(wallpaper),
      },
      {
        headers: getOpenClawPrivateHeaders(),
        status: 201,
        message: "Remote wallpaper uploaded.",
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError("Invalid remote upload payload.", {
        status: 400,
        code: "INVALID_REMOTE_UPLOAD_PAYLOAD",
        details: formatZodError(error),
        headers: getOpenClawPrivateHeaders(),
      });
    }

    captureServerException(error, {
      route: "/api/openclaw/upload/remote",
      tags: {
        method: "POST",
      },
    });
    const response = getWallpaperCreateErrorResponse(error);

    logger.warn("openclaw.upload.remote.failed", {
      actor: auth.actor,
      code: response.code,
      status: response.status,
    });

    return jsonError(
      response.code === "WALLPAPER_CREATE_FAILED" && error instanceof Error
        ? error.message
        : response.message,
      {
        status: response.status,
        code:
          response.code === "WALLPAPER_CREATE_FAILED"
            ? "OPENCLAW_REMOTE_UPLOAD_FAILED"
            : response.code,
        details: response.details,
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
