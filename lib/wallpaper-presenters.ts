import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  FilmCellData,
  GradientKey,
  MoodCardData,
  MoodShape,
} from "@/types/home";
import type {
  Wallpaper,
  WallpaperDownloadOption,
  WallpaperFile,
  WallpaperVariant,
} from "@/types/wallpaper";

const GRADIENT_SEQUENCE: GradientKey[] = [
  "forest",
  "lava",
  "ocean",
  "void",
  "dusk",
  "ice",
  "ember",
  "night",
  "blush",
  "moss",
];

const PREVIEW_FILE_VARIANT_PRIORITY: Array<WallpaperFile["variant"]> = [
  "preview",
  "thumb",
  "4k",
  "original",
];

const MEDIUM_CARD_FILE_VARIANT_PRIORITY: Array<WallpaperFile["variant"]> = [
  "thumb",
  "4k",
  "original",
  "preview",
];

const LARGE_CARD_FILE_VARIANT_PRIORITY: Array<WallpaperFile["variant"]> = [
  "4k",
  "thumb",
  "original",
  "preview",
];

const ARTWORK_FILE_VARIANT_PRIORITY: Array<WallpaperFile["variant"]> = [
  "4k",
  "original",
  "thumb",
  "preview",
];

const RECOMMENDED_IMAGE_DOWNLOAD_PRIORITY: Array<WallpaperFile["variant"]> = [
  "4k",
  "original",
  "thumb",
  "preview",
];

const RECOMMENDED_VIDEO_DOWNLOAD_PRIORITY: Array<WallpaperFile["variant"]> = [
  "original",
];

const DOWNLOAD_OPTION_VARIANT_ORDER: WallpaperVariant[] = [
  "preview",
  "thumb",
  "4k",
  "original",
];

function hashInput(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export function getWallpaperGradientKey(wallpaper: Pick<Wallpaper, "slug" | "tags" | "colors">): GradientKey {
  const source =
    wallpaper.tags[0] ?? wallpaper.colors[0] ?? wallpaper.slug ?? "frame";
  return GRADIENT_SEQUENCE[hashInput(source) % GRADIENT_SEQUENCE.length];
}

function getWallpaperFileByPriority(
  wallpaper: Pick<Wallpaper, "files">,
  priorities: Array<WallpaperFile["variant"]>,
) {
  return [...wallpaper.files].sort((left, right) => {
    return priorities.indexOf(left.variant) - priorities.indexOf(right.variant);
  })[0];
}

function isVideoWallpaperFile(file: WallpaperFile) {
  return (
    file.format?.startsWith("video/") ||
    /\.(mp4|webm|mov)$/i.test(file.url) ||
    /\.(mp4|webm|mov)$/i.test(file.storagePath)
  );
}

function getDominantDimension(
  file: Pick<WallpaperFile, "width" | "height">,
) {
  return Math.max(file.width ?? 0, file.height ?? 0);
}

function getDownloadOptionLabel(file: WallpaperFile, includeVideo: boolean) {
  if (includeVideo) {
    return file.variant === "original" ? "原视频" : "动态封面";
  }

  if (file.variant === "original") {
    return "原图";
  }

  if (file.variant === "4k") {
    return "4K 超清";
  }

  if (file.variant === "thumb") {
    return getDominantDimension(file) >= 1080 ? "全高清" : "高清";
  }

  return "标清";
}

export function getPreferredWallpaperFile(
  wallpaper: Pick<Wallpaper, "files">,
) {
  return getWallpaperFileByPriority(wallpaper, ARTWORK_FILE_VARIANT_PRIORITY);
}

export function getWallpaperPreviewUrl(
  wallpaper: Pick<Wallpaper, "files">,
  preference: "default" | "medium" | "large" = "default",
) {
  const priorities =
    preference === "large"
      ? LARGE_CARD_FILE_VARIANT_PRIORITY
      : preference === "medium"
        ? MEDIUM_CARD_FILE_VARIANT_PRIORITY
        : PREVIEW_FILE_VARIANT_PRIORITY;

  return getWallpaperFileByPriority(
    {
      files: wallpaper.files.filter((file) => !isVideoWallpaperFile(file)),
    },
    priorities,
  )?.url;
}

export function getWallpaperDownloadFile(wallpaper: Pick<Wallpaper, "files">) {
  const includesVideo = wallpaper.files.some((file) => isVideoWallpaperFile(file));

  return getWallpaperFileByPriority(
    wallpaper,
    includesVideo
      ? RECOMMENDED_VIDEO_DOWNLOAD_PRIORITY
      : RECOMMENDED_IMAGE_DOWNLOAD_PRIORITY,
  );
}

export function getWallpaperDownloadFileByVariant(
  wallpaper: Pick<Wallpaper, "files" | "videoUrl">,
  variant: WallpaperVariant,
) {
  const includeVideo = Boolean(wallpaper.videoUrl);

  return wallpaper.files.find((file) => {
    if (file.variant !== variant) {
      return false;
    }

    return includeVideo ? isVideoWallpaperFile(file) : !isVideoWallpaperFile(file);
  });
}

export function getWallpaperDownloadOptions(
  wallpaper: Pick<Wallpaper, "files" | "videoUrl">,
): WallpaperDownloadOption[] {
  const includeVideo = Boolean(wallpaper.videoUrl);
  const defaultFile = getWallpaperDownloadFile(wallpaper);

  return DOWNLOAD_OPTION_VARIANT_ORDER.flatMap((variant) => {
    const file = getWallpaperDownloadFileByVariant(wallpaper, variant);

    if (!file) {
      return [];
    }

    return [
      {
        variant: file.variant,
        label: getDownloadOptionLabel(file, includeVideo),
        width: file.width,
        height: file.height,
        sizeBytes: file.size,
        format: file.format,
        isDefault: defaultFile?.variant === file.variant,
      },
    ];
  });
}

export function getWallpaperShape(wallpaper: Pick<Wallpaper, "width" | "height">): MoodShape {
  const width = wallpaper.width ?? 0;
  const height = wallpaper.height ?? 0;

  if (!width || !height) {
    return "portrait";
  }

  const ratio = width / height;

  if (ratio >= 1.35) {
    return "landscape";
  }

  if (ratio <= 0.58) {
    return "tall";
  }

  if (ratio >= 0.9 && ratio <= 1.15) {
    return "square";
  }

  return "portrait";
}

export function getWallpaperMeta(wallpaper: Pick<Wallpaper, "tags" | "width" | "height">) {
  const primaryTag = wallpaper.tags[0] ?? "精选";
  const resolution =
    wallpaper.width && wallpaper.height
      ? `${Math.max(wallpaper.width, wallpaper.height)}p`
      : "高清";

  return `${primaryTag} · ${resolution}`;
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getWallpaperResolutionLabel(
  wallpaper: Pick<Wallpaper, "width" | "height">,
) {
  const dominantSize = Math.max(wallpaper.width ?? 0, wallpaper.height ?? 0);

  if (dominantSize >= 5120) {
    return "5K";
  }

  if (dominantSize >= 3840) {
    return "4K";
  }

  if (dominantSize >= 2560) {
    return "2K";
  }

  return "高清";
}

function looksLikeImportedFilename(value: string) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return false;
  }

  return (
    /^(beauty|image|img|photo|wallpaper|lumen)[\s_-]*[a-z]*[\s_-]*\d{2,}$/i.test(
      normalized,
    ) ||
    /^(dsc|img|pxl|mvimg|mmexport|wechatimg)[\s_-]?\d+/i.test(normalized) ||
    /\b(copy|final|edit|export|upload)\b/i.test(normalized) ||
    /^精选壁纸(?:\s+\d+)?$/i.test(normalized) ||
    /^lumen curated(?:\s+\d+)?$/i.test(normalized) ||
    /^(?:[a-f0-9]{4,12}[\s_-]){3,}[a-f0-9]{4,24}$/i.test(normalized)
  );
}

function getPrimaryWallpaperLabel(
  wallpaper: Pick<Wallpaper, "aiCategory" | "aiTags" | "tags">,
) {
  return wallpaper.aiCategory ?? wallpaper.aiTags[0] ?? wallpaper.tags[0] ?? "精选";
}

export function getWallpaperDisplayTitle(
  wallpaper: Pick<Wallpaper, "aiTags" | "tags" | "title">,
) {
  const aiLabel = wallpaper.aiTags.filter(Boolean).slice(0, 3).join(" · ");

  if (aiLabel.trim().length > 0) {
    return aiLabel;
  }

  const tagLabel = wallpaper.tags.filter(Boolean).slice(0, 3).join(" · ");

  if (tagLabel.trim().length > 0) {
    return tagLabel;
  }

  if (looksLikeImportedFilename(wallpaper.title)) {
    return "精选壁纸";
  }

  return wallpaper.title;
}

function getEditorialDescription(wallpaper: Wallpaper) {
  return (
    wallpaper.description?.trim() ||
    wallpaper.aiCaption?.trim() ||
    `${wallpaper.creator?.username ?? "Lumen"} 上传的精选壁纸，已进入本周首页推荐。`
  );
}

export function wallpaperToMoodCard(
  wallpaper: Wallpaper,
  index: number,
): MoodCardData {
  return {
    id: wallpaper.id,
    gradient: getWallpaperGradientKey(wallpaper),
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    shape: getWallpaperShape(wallpaper),
    number: String(index + 1).padStart(3, "0"),
    name: getWallpaperDisplayTitle(wallpaper),
    meta: getWallpaperMeta(wallpaper),
    href: `/wallpaper/${wallpaper.slug}`,
    videoUrl: wallpaper.videoUrl,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}

export function wallpaperToFilmCell(wallpaper: Wallpaper): FilmCellData {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    label: getWallpaperDisplayTitle(wallpaper),
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    videoUrl: wallpaper.videoUrl ?? undefined,
  };
}

export function wallpaperToEditorialFeature(
  wallpaper: Wallpaper,
): EditorialFeature {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    title: getWallpaperDisplayTitle(wallpaper),
    description: getEditorialDescription(wallpaper),
    eyebrow: wallpaper.featured ? "编辑推荐 · 本周" : "编辑推荐",
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "large"),
    videoUrl: wallpaper.videoUrl,
  };
}

export function wallpaperToEditorialItem(
  wallpaper: Wallpaper,
  index: number,
): EditorialItem {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    number: `NO.${String(index + 2).padStart(2, "0")}`,
    title: getWallpaperDisplayTitle(wallpaper),
    meta: `${getPrimaryWallpaperLabel(wallpaper)} · ${getWallpaperResolutionLabel(wallpaper)} · ${formatCompactCount(wallpaper.downloadsCount)} 次下载`,
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    videoUrl: wallpaper.videoUrl,
  };
}

export function wallpaperToDarkroomItem(
  wallpaper: Wallpaper,
  options?: {
    featured?: boolean;
  },
): DarkroomItem {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    title: getWallpaperDisplayTitle(wallpaper),
    meta: `${getPrimaryWallpaperLabel(wallpaper)} · ${getWallpaperResolutionLabel(wallpaper)}`,
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "large"),
    videoUrl: wallpaper.videoUrl,
    badge: options?.featured ? "本周最佳" : undefined,
    featured: options?.featured ?? false,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}
