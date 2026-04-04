import { z } from "zod";

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
  getR2ObjectStream,
  normalizeR2StoragePath,
} from "@/lib/r2";
import {
  getWallpaperDownloadFile,
  getWallpaperDownloadFileByVariant,
  getWallpaperDownloadOptions,
} from "@/lib/wallpaper-presenters";
import type { WallpaperVariant } from "@/types/wallpaper";
import {
  getWallpaperByIdOrSlug,
  incrementWallpaperDownloads,
} from "@/lib/wallpapers";

type OpenClawWallpaperDownloadRouteProps = {
  params: {
    id: string;
  };
};

const DOWNLOAD_VARIANTS = new Set<WallpaperVariant>([
  "preview",
  "thumb",
  "4k",
  "original",
]);

const downloadQuerySchema = z.object({
  stream: z.enum(["true", "false", "1", "0"]).optional(),
  track: z.enum(["true", "false", "1", "0"]).optional(),
  variant: z.enum(["preview", "thumb", "4k", "original"]).optional(),
});

function parseOptionalBoolean(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === "true" || value === "1";
}

function sanitizeDownloadFilenameSegment(value: string) {
  return value
    .replace(/[<>:\"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDownloadExtension(format: string | null | undefined) {
  if (!format) {
    return "bin";
  }

  const normalizedFormat = format.trim().toLowerCase();

  if (normalizedFormat === "jpeg") {
    return "jpg";
  }

  return normalizedFormat || "bin";
}

function buildDownloadFilename(
  label: string,
  variant: string,
  format: string | null | undefined,
) {
  const safeTitle = sanitizeDownloadFilenameSegment(label) || "Lumen Wallpaper";
  const variantSuffix = variant === "original" ? "" : ` ${variant.toUpperCase()}`;
  const extension = getDownloadExtension(format);

  return `${safeTitle}${variantSuffix}.${extension}`;
}

export async function GET(
  request: Request,
  { params }: OpenClawWallpaperDownloadRouteProps,
) {
  const logger = createRouteLogger(
    "/api/openclaw/wallpapers/[id]/download",
    request,
  );
  const auth = requireOpenClawApiAccess(
    request,
    "/api/openclaw/wallpapers/[id]/download",
  );

  if (auth instanceof Response) {
    return auth;
  }

  const url = new URL(request.url);
  const parsed = downloadQuerySchema.safeParse({
    stream: url.searchParams.get("stream") ?? undefined,
    track: url.searchParams.get("track") ?? undefined,
    variant: url.searchParams.get("variant") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError("Invalid download query.", {
      status: 400,
      code: "INVALID_DOWNLOAD_QUERY",
      details: formatZodError(parsed.error),
      headers: getOpenClawPrivateHeaders(),
    });
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

    const requestedVariant = parsed.data.variant as WallpaperVariant | undefined;
    const selectedFile =
      requestedVariant && DOWNLOAD_VARIANTS.has(requestedVariant)
        ? getWallpaperDownloadFileByVariant(wallpaper, requestedVariant)
        : getWallpaperDownloadFile(wallpaper);

    if (!selectedFile) {
      return jsonError("Wallpaper download file not found.", {
        status: 404,
        code: "WALLPAPER_DOWNLOAD_NOT_FOUND",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    const selectedVariant = selectedFile.variant;
    const displayTitle = toOpenClawWallpaperPayload(wallpaper).displayTitle;
    const filename = buildDownloadFilename(
      displayTitle,
      selectedVariant,
      selectedFile.format,
    );

    if (!parseOptionalBoolean(parsed.data.stream)) {
      const search = new URLSearchParams();
      search.set("variant", selectedVariant);
      search.set("stream", "true");

      return jsonSuccess(
        {
          wallpaperId: wallpaper.id,
          title: wallpaper.title,
          displayTitle,
          selectedVariant,
          filename,
          options: getWallpaperDownloadOptions(wallpaper),
          downloadUrl: `${url.origin}/api/openclaw/wallpapers/${encodeURIComponent(params.id)}/download?${search.toString()}`,
          publicDownloadUrl: `${url.origin}/api/wallpapers/${encodeURIComponent(params.id)}/download?variant=${encodeURIComponent(selectedVariant)}`,
        },
        {
          headers: getOpenClawPrivateHeaders(),
          message: "Wallpaper download options loaded.",
        },
      );
    }

    const normalizedStoragePath = normalizeR2StoragePath(selectedFile.storagePath);

    if (!normalizedStoragePath) {
      return jsonError("Wallpaper download file is missing its storage path.", {
        status: 500,
        code: "WALLPAPER_DOWNLOAD_STORAGE_PATH_MISSING",
        headers: getOpenClawPrivateHeaders(),
      });
    }

    let nextDownloadsCount: number | null = null;

    if (parseOptionalBoolean(parsed.data.track)) {
      try {
        const tracking = await incrementWallpaperDownloads(params.id, {
          userId: null,
          variant: selectedVariant,
        });
        nextDownloadsCount = tracking.downloadsCount;
      } catch (error) {
        captureServerException(error, {
          route: "/api/openclaw/wallpapers/[id]/download",
          tags: {
            section: "download_tracking",
          },
        });
      }
    }

    const object = await getR2ObjectStream(normalizedStoragePath);

    logger.done("openclaw.wallpapers.download.stream", {
      actor: auth.actor,
      wallpaperId: wallpaper.id,
      variant: selectedVariant,
      track: parseOptionalBoolean(parsed.data.track) ?? false,
    });

    return new Response(object.stream, {
      status: 200,
      headers: {
        ...getOpenClawPrivateHeaders(),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": object.contentType,
        ...(object.contentLength && object.contentLength > 0
          ? { "Content-Length": String(object.contentLength) }
          : {}),
        ...(object.etag ? { ETag: object.etag } : {}),
        ...(object.lastModified
          ? { "Last-Modified": object.lastModified }
          : {}),
        ...(nextDownloadsCount !== null
          ? { "X-Wallpaper-Downloads-Count": String(nextDownloadsCount) }
          : {}),
        "X-Wallpaper-Download-Variant": selectedVariant,
      },
    });
  } catch (error) {
    captureServerException(error, {
      route: "/api/openclaw/wallpapers/[id]/download",
      tags: {
        method: "GET",
      },
    });

    return jsonError(
      error instanceof Error ? error.message : "Failed to prepare wallpaper download.",
      {
        status: 500,
        code: "OPENCLAW_WALLPAPER_DOWNLOAD_FAILED",
        headers: getOpenClawPrivateHeaders(),
      },
    );
  }
}
