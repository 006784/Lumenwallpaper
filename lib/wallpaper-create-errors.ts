import {
  isR2AccessDeniedError,
  isR2NotFoundError,
  R2UploadValidationError,
} from "@/lib/r2";
import { WallpaperVariantGenerationError } from "@/lib/wallpaper-variants";

type WallpaperCreateErrorResponse = {
  code: string;
  details: {
    actionHref?: string;
    actionLabel?: string;
    description: string;
    retryable: boolean;
    title: string;
    troubleshooting: string[];
  };
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
      details: {
        description: "作品数据暂时无法写入数据库。",
        retryable: false,
        title: "数据库还没有连接好",
        troubleshooting: ["检查生产环境 Supabase URL 与 service role key。"],
      },
      message: "Supabase is not configured.",
      status: 503,
    };
  }

  if (message.includes("Original R2 object path is required")) {
    return {
      code: "WALLPAPER_UPLOAD_SOURCE_PATH_MISSING",
      details: {
        actionLabel: "重新选择文件",
        description: "发布前没有拿到上传文件路径，通常是页面状态丢失或上传步骤未完成。",
        retryable: true,
        title: "还没拿到上传文件",
        troubleshooting: ["重新选择文件并等待上传完成后再发布。"],
      },
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
      details: {
        actionHref: "/api/upload/diagnostics",
        actionLabel: "打开上传诊断",
        description: "浏览器可能中断了直传，或者 R2 没有收到这个对象。",
        retryable: true,
        title: "上传没有真正完成",
        troubleshooting: [
          "重新上传一次原文件。",
          "如果仍然失败，打开上传诊断检查 R2 CORS 和请求头。",
        ],
      },
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
      details: {
        actionHref: "/api/upload/diagnostics",
        actionLabel: "检查上传诊断",
        description: "Lumen 无法读取或写入 R2 对象，常见原因是密钥、Bucket 权限或 CORS 配置不匹配。",
        retryable: false,
        title: "存储权限异常",
        troubleshooting: [
          "确认线上环境变量使用同一个 R2 bucket。",
          "确认 R2 token 允许读写对象。",
          "运行上传诊断查看浏览器直传是否被 CORS 拦截。",
        ],
      },
      message: "R2 拒绝读取或写入对象，请检查 Bucket 权限和访问密钥。",
      status: 503,
    };
  }

  if (error instanceof R2UploadValidationError) {
    const isTooLarge = error.code === "R2_UPLOAD_TOO_LARGE";

    return {
      code: error.code,
      details: {
        actionLabel: "重新选择文件",
        description: isTooLarge
          ? "R2 收到的实际文件超过允许大小，已拒绝发布。"
          : "R2 收到的实际文件与发布请求里的文件信息不一致，可能是直传被替换或浏览器上传头异常。",
        retryable: true,
        title: isTooLarge ? "文件超过大小限制" : "上传文件校验失败",
        troubleshooting: [
          "重新选择原文件并等待上传完成。",
          "如果仍然失败，打开上传诊断检查 R2 CORS 和请求头。",
        ],
      },
      message: isTooLarge
        ? "上传文件超过允许大小，请压缩后重新上传。"
        : "上传文件与发布请求不一致，请重新上传后再发布。",
      status: 400,
    };
  }

  if (/Input buffer contains unsupported image format/i.test(message)) {
    return {
      code: "WALLPAPER_UPLOAD_UNSUPPORTED_SOURCE",
      details: {
        actionLabel: "换一个文件",
        description: "源文件无法被当前图片处理器解码，可能是格式损坏或编码不兼容。",
        retryable: true,
        title: "这张图暂时不能处理",
        troubleshooting: ["请改用 PNG、JPG 或 WebP，再重新上传。"],
      },
      message: "源文件格式无法生成壁纸变体，请换一张 PNG、JPG 或 WebP 图片。",
      status: 400,
    };
  }

  if (error instanceof WallpaperVariantGenerationError) {
    return {
      code: "WALLPAPER_VARIANT_GENERATION_FAILED",
      details: {
        actionLabel: "稍后重试",
        description: "源文件已到达 R2，但生成预览、缩略图或 4K 变体时失败了。",
        retryable: true,
        title: "预览图生成失败",
        troubleshooting: [
          "稍后重新发布。",
          "如果是超大图，先压缩到 50MB 以内再上传。",
        ],
      },
      message: "源文件已上传，但生成预览、缩略图或 4K 变体失败，请稍后重试。",
      status: 502,
    };
  }

  return {
    code: "WALLPAPER_CREATE_FAILED",
    details: {
      actionLabel: "重试发布",
      description: "发布流程在服务器端失败，但没有匹配到更具体的错误类型。",
      retryable: true,
      title: "发布没有成功",
      troubleshooting: ["请重试一次；如果持续失败，查看服务器日志中的 wallpaper.create.failed。"],
    },
    message: "Failed to create wallpaper.",
    status: 500,
  };
}
