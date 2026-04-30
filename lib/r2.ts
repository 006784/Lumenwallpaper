import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  PresignedUploadPayload,
  WallpaperVariant,
} from "@/types/wallpaper";
import type {
  R2UploadCorsDiagnosticHeaders,
  R2UploadCorsDiagnosticIssue,
  R2UploadCorsDiagnostics,
  R2UploadCorsRequirement,
} from "@/types/r2-diagnostics";

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_SIZE_BYTES = 200 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_BYTES = MAX_VIDEO_UPLOAD_SIZE_BYTES;
export const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 60 * 5;
export const R2_STORAGE_PREFIXES: Record<WallpaperVariant, string> = {
  original: "originals",
  "4k": "compressed",
  thumb: "thumbnails",
  preview: "previews",
};
export const R2_UPLOAD_CORS_REQUEST_HEADERS = ["content-type"] as const;
export const R2_UPLOAD_CORS_EXPOSE_HEADERS = ["ETag"] as const;
export const R2_UPLOAD_CORS_METHODS = ["PUT"] as const;

let r2Client: S3Client | null = null;

type R2UploadOptions = {
  path: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  variant: WallpaperVariant;
  metadata?: Record<string, string | null | undefined>;
  cacheControl?: string;
  contentDisposition?: string;
};

export class R2UploadValidationError extends Error {
  readonly code:
    | "R2_UPLOAD_CONTENT_TYPE_MISMATCH"
    | "R2_UPLOAD_SIZE_MISMATCH"
    | "R2_UPLOAD_TOO_LARGE";

  constructor(
    code: R2UploadValidationError["code"],
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "R2UploadValidationError";
    this.code = code;
  }
}

export function getR2Config() {
  return {
    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.CLOUDFLARE_R2_BUCKET ?? "lument",
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL ?? "https://img.byteify.icu",
  };
}

export function isR2Configured() {
  const config = getR2Config();
  return Boolean(
    config.accountId &&
    config.accessKeyId &&
    config.secretAccessKey &&
    config.bucket &&
    config.publicUrl,
  );
}

export function getR2ObjectUrl(path: string) {
  const base = getR2Config().publicUrl;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return new URL(path.replace(/^\/+/, ""), normalizedBase).toString();
}

export function getR2ErrorStatus(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const metadata = "$metadata" in error ? error.$metadata : null;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const statusCode =
    "httpStatusCode" in metadata ? metadata.httpStatusCode : null;

  return typeof statusCode === "number" ? statusCode : null;
}

export function getR2ErrorName(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const name = "name" in error ? error.name : null;

  return typeof name === "string" ? name : null;
}

export function isR2NotFoundError(error: unknown) {
  const name = getR2ErrorName(error);

  return (
    getR2ErrorStatus(error) === 404 ||
    name === "NoSuchKey" ||
    name === "NotFound"
  );
}

export function isR2AccessDeniedError(error: unknown) {
  const name = getR2ErrorName(error);

  return (
    getR2ErrorStatus(error) === 403 ||
    name === "AccessDenied" ||
    name === "Forbidden"
  );
}

function normalizeCorsList(value: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function corsAllowsValue(headerValue: string | null, requiredValue: string) {
  const allowedValues = normalizeCorsList(headerValue);
  return (
    allowedValues.includes("*") ||
    allowedValues.includes(requiredValue.trim().toLowerCase())
  );
}

function corsAllowsOrigin(headerValue: string | null, origin: string) {
  const allowedOrigins = normalizeCorsList(headerValue);
  return (
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin.trim().toLowerCase())
  );
}

function getR2UploadCorsDiagnosticStatus(
  issues: R2UploadCorsDiagnosticIssue[],
) {
  if (issues.some((issue) => issue.severity === "error")) {
    return "fail";
  }

  if (issues.length > 0) {
    return "warning";
  }

  return "pass";
}

function readCorsDiagnosticHeaders(headers: Headers): R2UploadCorsDiagnosticHeaders {
  return {
    accessControlAllowHeaders: headers.get("access-control-allow-headers"),
    accessControlAllowMethods: headers.get("access-control-allow-methods"),
    accessControlAllowOrigin: headers.get("access-control-allow-origin"),
    accessControlExposeHeaders: headers.get("access-control-expose-headers"),
    accessControlMaxAge: headers.get("access-control-max-age"),
  };
}

export function getR2UploadCorsRequirement(origin: string): R2UploadCorsRequirement {
  return {
    origins: [origin],
    methods: [...R2_UPLOAD_CORS_METHODS],
    requestHeaders: [...R2_UPLOAD_CORS_REQUEST_HEADERS],
    exposeHeaders: [...R2_UPLOAD_CORS_EXPOSE_HEADERS],
    examplePolicy: [
      {
        AllowedOrigins: [origin],
        AllowedMethods: [...R2_UPLOAD_CORS_METHODS],
        AllowedHeaders: [...R2_UPLOAD_CORS_REQUEST_HEADERS],
        ExposeHeaders: [...R2_UPLOAD_CORS_EXPOSE_HEADERS],
        MaxAgeSeconds: 3600,
      },
    ],
  };
}

export async function inspectR2UploadCors(
  origin: string,
): Promise<R2UploadCorsDiagnostics> {
  const config = getR2Config();
  const requirements = getR2UploadCorsRequirement(origin);
  const upload = await createPresignedUpload(
    "lumen-cors-diagnostic.png",
    "image/png",
  );
  const requestHeaders = Object.keys(upload.headers).map((header) =>
    header.toLowerCase(),
  );
  const issues: R2UploadCorsDiagnosticIssue[] = [];
  let responseStatus: number | null = null;
  let responseOk = false;
  let responseHeaders: R2UploadCorsDiagnosticHeaders = {
    accessControlAllowHeaders: null,
    accessControlAllowMethods: null,
    accessControlAllowOrigin: null,
    accessControlExposeHeaders: null,
    accessControlMaxAge: null,
  };

  try {
    const response = await fetch(upload.presignedUrl, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Headers": requestHeaders.join(", "),
        "Access-Control-Request-Method": upload.method,
      },
      cache: "no-store",
    });

    responseStatus = response.status;
    responseOk = response.ok;
    responseHeaders = readCorsDiagnosticHeaders(response.headers);

    if (!response.ok) {
      issues.push({
        code: "R2_CORS_PREFLIGHT_STATUS",
        message: `R2 预检请求返回 ${response.status}，浏览器直传会被阻止。`,
        severity: "error",
      });
    }

    if (
      !corsAllowsOrigin(
        responseHeaders.accessControlAllowOrigin,
        origin,
      )
    ) {
      issues.push({
        code: "R2_CORS_ORIGIN_MISSING",
        message: `R2 CORS 没有允许当前来源 ${origin}。`,
        severity: "error",
      });
    }

    if (
      !corsAllowsValue(
        responseHeaders.accessControlAllowMethods,
        upload.method,
      )
    ) {
      issues.push({
        code: "R2_CORS_METHOD_MISSING",
        message: "R2 CORS 没有允许浏览器直传所需的 PUT 方法。",
        severity: "error",
      });
    }

    for (const header of requestHeaders) {
      if (!corsAllowsValue(responseHeaders.accessControlAllowHeaders, header)) {
        issues.push({
          code: "R2_CORS_HEADER_MISSING",
          message: `R2 CORS 没有允许请求头 ${header}。`,
          severity: "error",
        });
      }
    }

    if (
      responseHeaders.accessControlExposeHeaders &&
      !corsAllowsValue(responseHeaders.accessControlExposeHeaders, "etag")
    ) {
      issues.push({
        code: "R2_CORS_ETAG_NOT_EXPOSED",
        message:
          "R2 CORS 响应暴露了部分响应头，但没有暴露 ETag；建议暴露 ETag，便于浏览器和诊断工具确认对象写入结果。",
        severity: "warning",
      });
    }
  } catch (error) {
    issues.push({
      code: "R2_CORS_PREFLIGHT_FAILED",
      message:
        error instanceof Error
          ? `R2 预检请求失败：${error.message}`
          : "R2 预检请求失败。",
      severity: "error",
    });
  }

  const status = getR2UploadCorsDiagnosticStatus(issues);

  return {
    bucket: config.bucket,
    checkedAt: new Date().toISOString(),
    issues,
    ok: status === "pass" || status === "warning",
    origin,
    preflight: {
      ok: responseOk && !issues.some((issue) => issue.severity === "error"),
      requestHeaders,
      responseHeaders,
      status: responseStatus,
    },
    publicUrl: config.publicUrl,
    requirements,
    status,
    upload: {
      expiresIn: upload.expiresIn,
      method: upload.method,
      signedHeaders: requestHeaders,
    },
  };
}

export function normalizeR2StoragePath(path: string) {
  const normalizedPath = path.trim();

  if (!normalizedPath) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedPath)) {
    const publicUrl = getR2Config().publicUrl;

    try {
      const targetUrl = new URL(normalizedPath);
      const publicBase = new URL(
        publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`,
      );

      if (targetUrl.origin === publicBase.origin) {
        return decodeURIComponent(targetUrl.pathname.replace(/^\/+/, ""));
      }
    } catch {
      return normalizedPath;
    }
  }

  return normalizedPath.replace(/^\/+/, "");
}

export function getR2AssetId(path: string) {
  const normalizedPath = normalizeR2StoragePath(path);
  const filename = normalizedPath.split("/").pop() ?? "";
  const basename = filename.replace(/\.[^.]+$/, "");

  return basename
    .replace(/_4k$/i, "")
    .replace(/_800$/i, "")
    .replace(/_400$/i, "");
}

export async function listR2Objects(options?: {
  continuationToken?: string;
  limit?: number;
  prefix?: string;
}) {
  const client = createR2Client();
  const config = getR2Config();
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.bucket,
      ContinuationToken: options?.continuationToken,
      MaxKeys: options?.limit,
      Prefix: options?.prefix,
    }),
  );

  return {
    continuationToken: response.NextContinuationToken ?? null,
    isTruncated: response.IsTruncated ?? false,
    objects: (response.Contents ?? [])
      .filter((object) => Boolean(object.Key))
      .map((object) => ({
        key: object.Key as string,
        lastModified: object.LastModified?.toISOString() ?? null,
        size: object.Size ?? 0,
      })),
  };
}

export function createR2Client() {
  if (!r2Client) {
    const config = getR2Config();

    if (!isR2Configured()) {
      throw new Error(
        "R2 client is not configured. Add CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET, and CLOUDFLARE_R2_PUBLIC_URL.",
      );
    }

    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return r2Client;
}

function getFileExtension(filename: string) {
  const dotIndex = filename.lastIndexOf(".");

  if (dotIndex === -1) {
    return "bin";
  }

  return filename.slice(dotIndex + 1).toLowerCase();
}

function normalizeR2Directory(directory: string | undefined) {
  if (!directory) {
    return "";
  }

  return directory
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .map((part) =>
      part
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("/");
}

function encodeContentDispositionFilename(filename: string) {
  return encodeURIComponent(filename).replace(
    /['()]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function sanitizeR2Metadata(
  metadata: Record<string, string | null | undefined> | undefined,
) {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).filter(
    (entry): entry is [string, string] =>
      Boolean(entry[0].trim()) &&
      typeof entry[1] === "string" &&
      entry[1].length > 0,
  );

  if (!entries.length) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

async function readR2BodyAsBuffer(body: unknown) {
  if (!body) {
    throw new Error("R2 response did not include a body.");
  }

  if (
    typeof body === "object" &&
    "transformToByteArray" in body &&
    typeof body.transformToByteArray === "function"
  ) {
    const bytes = await body.transformToByteArray();
    return Buffer.from(bytes);
  }

  if (typeof body === "object" && Symbol.asyncIterator in body) {
    const chunks: Uint8Array[] = [];

    for await (const chunk of body as AsyncIterable<
      Uint8Array | Buffer | string | ArrayBuffer
    >) {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      if (chunk instanceof ArrayBuffer) {
        chunks.push(Buffer.from(chunk));
        continue;
      }

      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  throw new Error("R2 response body could not be converted to a buffer.");
}

function createReadableStreamFromAsyncIterable(
  body: AsyncIterable<Uint8Array | Buffer | string | ArrayBuffer>,
) {
  const iterator = body[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await iterator.next();

      if (done) {
        controller.close();
        return;
      }

      if (typeof value === "string") {
        controller.enqueue(new TextEncoder().encode(value));
        return;
      }

      if (value instanceof ArrayBuffer) {
        controller.enqueue(new Uint8Array(value));
        return;
      }

      controller.enqueue(value instanceof Uint8Array ? value : new Uint8Array(value));
    },
    async cancel() {
      if (typeof iterator.return === "function") {
        await iterator.return();
      }
    },
  });
}

export function buildR2StoragePath(options: {
  assetId?: string;
  directory?: string;
  filename?: string;
  variant: WallpaperVariant;
}) {
  const assetId = options.assetId ?? crypto.randomUUID();
  const directory = normalizeR2Directory(options.directory);
  const extension =
    options.variant === "original"
      ? getFileExtension(options.filename ?? "upload.bin")
      : "webp";
  const withDirectory = (prefix: string, filename: string) =>
    directory ? `${prefix}/${directory}/${filename}` : `${prefix}/${filename}`;

  if (options.variant === "original") {
    return withDirectory(R2_STORAGE_PREFIXES.original, `${assetId}.${extension}`);
  }

  if (options.variant === "4k") {
    return withDirectory(R2_STORAGE_PREFIXES["4k"], `${assetId}_4k.${extension}`);
  }

  if (options.variant === "thumb") {
    return withDirectory(R2_STORAGE_PREFIXES.thumb, `${assetId}_800.${extension}`);
  }

  return withDirectory(R2_STORAGE_PREFIXES.preview, `${assetId}_400.${extension}`);
}

function getVariantCacheControl(variant: WallpaperVariant) {
  if (variant === "original") {
    return "public, max-age=31536000, immutable";
  }

  return "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400";
}

export function isVideoUploadMimeType(contentType: string) {
  return contentType.startsWith("video/");
}

export function getUploadMaxSizeBytes(contentType: string) {
  return isVideoUploadMimeType(contentType)
    ? MAX_VIDEO_UPLOAD_SIZE_BYTES
    : MAX_IMAGE_UPLOAD_SIZE_BYTES;
}

export async function createPresignedUpload(
  filename: string,
  contentType: (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
  options: {
    directory?: string;
  } = {},
): Promise<PresignedUploadPayload> {
  const client = createR2Client();
  const config = getR2Config();
  const key = buildR2StoragePath({
    directory: options.directory,
    variant: "original",
    filename,
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  });
  const headers = {
    "Content-Type": contentType,
  };

  return {
    constraints: {
      allowedContentTypes: [...ALLOWED_UPLOAD_MIME_TYPES],
      maxSizeBytes: getUploadMaxSizeBytes(contentType),
    },
    contentType,
    diagnostics: {
      corsDiagnosticsUrl: "/api/upload/diagnostics",
      requiredHeaders: Object.keys(headers),
      requiredMethod: "PUT",
    },
    filename,
    key,
    presignedUrl,
    publicUrl: getR2ObjectUrl(key),
    headers,
    method: "PUT",
    expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  };
}

export async function getR2ObjectBuffer(path: string) {
  const normalizedPath = normalizeR2StoragePath(path);

  if (!normalizedPath) {
    throw new Error("R2 object path is required.");
  }

  const client = createR2Client();
  const config = getR2Config();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: normalizedPath,
    }),
  );

  return readR2BodyAsBuffer(response.Body);
}

export async function getR2ObjectMetadata(path: string) {
  const normalizedPath = normalizeR2StoragePath(path);

  if (!normalizedPath) {
    throw new Error("R2 object path is required.");
  }

  const client = createR2Client();
  const config = getR2Config();
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: config.bucket,
      Key: normalizedPath,
    }),
  );

  return {
    contentLength:
      typeof response.ContentLength === "number" ? response.ContentLength : null,
    contentType: response.ContentType ?? null,
    etag: response.ETag ?? null,
    lastModified: response.LastModified?.toISOString() ?? null,
  };
}

function normalizeContentType(contentType: string | null | undefined) {
  return contentType?.split(";")[0]?.trim().toLowerCase() || null;
}

export async function assertR2ObjectMatchesUpload(options: {
  declaredSize?: number | null;
  expectedContentType?: (typeof ALLOWED_UPLOAD_MIME_TYPES)[number] | null;
  path: string;
}) {
  const metadata = await getR2ObjectMetadata(options.path);
  const actualContentLength = metadata.contentLength;
  const expectedContentType = normalizeContentType(options.expectedContentType);
  const actualContentType = normalizeContentType(metadata.contentType);
  const maxSizeBytes = expectedContentType
    ? getUploadMaxSizeBytes(expectedContentType)
    : MAX_UPLOAD_SIZE_BYTES;

  if (actualContentLength !== null && actualContentLength > maxSizeBytes) {
    throw new R2UploadValidationError(
      "R2_UPLOAD_TOO_LARGE",
      `Uploaded R2 object is too large: ${actualContentLength} bytes exceeds ${maxSizeBytes} bytes.`,
    );
  }

  if (
    typeof options.declaredSize === "number" &&
    actualContentLength !== null &&
    actualContentLength !== options.declaredSize
  ) {
    throw new R2UploadValidationError(
      "R2_UPLOAD_SIZE_MISMATCH",
      `Uploaded R2 object size mismatch: declared ${options.declaredSize} bytes, actual ${actualContentLength} bytes.`,
    );
  }

  if (
    expectedContentType &&
    actualContentType &&
    actualContentType !== expectedContentType
  ) {
    throw new R2UploadValidationError(
      "R2_UPLOAD_CONTENT_TYPE_MISMATCH",
      `Uploaded R2 object content type mismatch: expected ${expectedContentType}, actual ${actualContentType}.`,
    );
  }

  return metadata;
}

export async function getR2ObjectStream(path: string) {
  const normalizedPath = normalizeR2StoragePath(path);

  if (!normalizedPath) {
    throw new Error("R2 object path is required.");
  }

  const client = createR2Client();
  const config = getR2Config();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: normalizedPath,
    }),
  );

  if (!response.Body) {
    throw new Error("R2 object body is missing.");
  }

  const body = response.Body as unknown;
  const stream =
    typeof body === "object" &&
    body !== null &&
    "transformToWebStream" in body &&
    typeof body.transformToWebStream === "function"
      ? body.transformToWebStream()
      : typeof body === "object" &&
          body !== null &&
          Symbol.asyncIterator in body
        ? createReadableStreamFromAsyncIterable(
            body as AsyncIterable<Uint8Array | Buffer | string | ArrayBuffer>,
          )
        : null;

  if (!stream) {
    throw new Error("R2 object body could not be converted to a stream.");
  }

  return {
    contentLength:
      typeof response.ContentLength === "number" ? response.ContentLength : null,
    contentType: response.ContentType ?? "application/octet-stream",
    etag: response.ETag ?? null,
    lastModified: response.LastModified?.toUTCString() ?? null,
    stream,
  };
}

export async function putR2Object(options: R2UploadOptions) {
  const normalizedPath = normalizeR2StoragePath(options.path);

  if (!normalizedPath) {
    throw new Error("R2 object path is required.");
  }

  const client = createR2Client();
  const config = getR2Config();
  const filename = normalizedPath.split("/").pop() ?? `${options.variant}.bin`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: normalizedPath,
      Body: options.body,
      ContentType: options.contentType,
      CacheControl:
        options.cacheControl ?? getVariantCacheControl(options.variant),
      ContentDisposition:
        options.contentDisposition ??
        `inline; filename*=UTF-8''${encodeContentDispositionFilename(filename)}`,
      Metadata: sanitizeR2Metadata(options.metadata),
    }),
  );

  return {
    path: normalizedPath,
    url: getR2ObjectUrl(normalizedPath),
  };
}

export async function deleteR2Objects(paths: string[]) {
  const normalizedPaths = [
    ...new Set(paths.map(normalizeR2StoragePath).filter(Boolean)),
  ];

  if (!normalizedPaths.length || !isR2Configured()) {
    return;
  }

  const client = createR2Client();
  const config = getR2Config();
  const command = new DeleteObjectsCommand({
    Bucket: config.bucket,
    Delete: {
      Objects: normalizedPaths.map((path) => ({
        Key: path,
      })),
      Quiet: true,
    },
  });

  const response = await client.send(command);

  if (response.Errors && response.Errors.length > 0) {
    const messages = response.Errors.map(
      (error) =>
        `${error.Key ?? "unknown"}: ${error.Message ?? "delete failed"}`,
    ).join("; ");
    throw new Error(`Failed to delete one or more R2 objects: ${messages}`);
  }
}
