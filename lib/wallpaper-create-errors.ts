import { isR2AccessDeniedError, isR2NotFoundError } from "@/lib/r2";
import { WallpaperVariantGenerationError } from "@/lib/wallpaper-variants";

type WallpaperCreateErrorResponse = {
  code: string;
  message: string;
  status: number;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function getErrorCauses(error: unknown) {
  const causes: unknown[] = [];
  let current = error;

  while (current && typeof current === "object" && "cause" in current) {
    const cause = current.cause;

    if (!cause || causes.includes(cause)) {
      break;
    }

    causes.push(cause);
    current = cause;
  }

  return causes;
}

function hasCause(error: unknown, predicate: (cause: unknown) => boolean) {
  return [error, ...getErrorCauses(error)].some(predicate);
}

export function getWallpaperCreateErrorResponse(
  error: unknown,
): WallpaperCreateErrorResponse {
  const message = getErrorMessage(error);

  if (message.includes("Supabase is not configured")) {
    return {
      code: "SUPABASE_NOT_CONFIGURED",
      message: "Supabase is not configured.",
      status: 503,
    };
  }

  if (message.includes("Original R2 object path is required")) {
    return {
      code: "WALLPAPER_UPLOAD_SOURCE_PATH_MISSING",
      message: "上传源文件路径缺失，请重新选择文件后再发布。",
      status: 400,
    };
  }

  if (
    hasCause(error, isR2NotFoundError) ||
    /NoSuchKey|NotFound|specified key does not exist/i.test(message)
  ) {
    return {
      code: "WALLPAPER_UPLOAD_SOURCE_NOT_FOUND",
      message: "源文件还没有上传到 R2，或对象路径不正确。请重新上传后再发布。",
      status: 400,
    };
  }

  if (
    hasCause(error, isR2AccessDeniedError) ||
    /AccessDenied|Forbidden/i.test(message)
  ) {
    return {
      code: "R2_ACCESS_DENIED",
      message: "R2 拒绝读取或写入对象，请检查 Bucket 权限和访问密钥。",
      status: 503,
    };
  }

  if (/Input buffer contains unsupported image format/i.test(message)) {
    return {
      code: "WALLPAPER_UPLOAD_UNSUPPORTED_SOURCE",
      message: "源文件格式无法生成壁纸变体，请换一张 PNG、JPG 或 WebP 图片。",
      status: 400,
    };
  }

  if (error instanceof WallpaperVariantGenerationError) {
    return {
      code: "WALLPAPER_VARIANT_GENERATION_FAILED",
      message: "源文件已上传，但生成预览、缩略图或 4K 变体失败，请稍后重试。",
      status: 502,
    };
  }

  return {
    code: "WALLPAPER_CREATE_FAILED",
    message: "Failed to create wallpaper.",
    status: 500,
  };
}
