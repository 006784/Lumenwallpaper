import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  FilmCellData,
  GradientKey,
  MoodCardData,
  MoodShape,
  WallpaperCoverSource,
} from "@/types/home";
import {
  DEFAULT_LOCALE,
  getI18nMessages,
  translateStaticTerm,
} from "@/lib/i18n";
import type { SupportedLocale } from "@/types/i18n";
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

const RESPONSIVE_SOURCE_VARIANT_FALLBACK_WIDTH: Record<
  WallpaperFile["variant"],
  number
> = {
  preview: 720,
  thumb: 1440,
  "4k": 2160,
  original: 2880,
};

const RESPONSIVE_SOURCE_QUALITY_PRIORITY: Array<WallpaperFile["variant"]> = [
  "original",
  "4k",
  "thumb",
  "preview",
];

function hashInput(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

export function getWallpaperGradientKey(
  wallpaper: Pick<Wallpaper, "slug" | "tags" | "colors">,
): GradientKey {
  const slugPrefix = wallpaper.slug?.split("-")[0] ?? "";

  if (GRADIENT_SEQUENCE.includes(slugPrefix as GradientKey)) {
    return slugPrefix as GradientKey;
  }

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

export function isVideoWallpaperFile(file: WallpaperFile) {
  return (
    file.format?.startsWith("video/") ||
    /\.(mp4|webm|mov)$/i.test(file.url) ||
    /\.(mp4|webm|mov)$/i.test(file.storagePath)
  );
}

function getWallpaperFileSourceWidth(file: WallpaperFile) {
  return (
    file.width ?? RESPONSIVE_SOURCE_VARIANT_FALLBACK_WIDTH[file.variant] ?? 0
  );
}

function getDominantDimension(file: Pick<WallpaperFile, "width" | "height">) {
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

export function getPreferredWallpaperFile(wallpaper: Pick<Wallpaper, "files">) {
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

export function getWallpaperCoverSources(
  wallpaper: Pick<Wallpaper, "files">,
): WallpaperCoverSource[] {
  const bestByWidth = new Map<number, WallpaperFile>();

  for (const file of wallpaper.files.filter(
    (candidate) => !isVideoWallpaperFile(candidate),
  )) {
    const width = getWallpaperFileSourceWidth(file);

    if (!width) {
      continue;
    }

    const existing = bestByWidth.get(width);

    if (
      !existing ||
      RESPONSIVE_SOURCE_QUALITY_PRIORITY.indexOf(file.variant) <
        RESPONSIVE_SOURCE_QUALITY_PRIORITY.indexOf(existing.variant)
    ) {
      bestByWidth.set(width, file);
    }
  }

  return [...bestByWidth.entries()]
    .sort(([leftWidth], [rightWidth]) => leftWidth - rightWidth)
    .map(([width, file]) => ({
      src: file.url,
      width,
    }));
}

export function getWallpaperDownloadFile(wallpaper: Pick<Wallpaper, "files">) {
  const includesVideo = wallpaper.files.some((file) =>
    isVideoWallpaperFile(file),
  );

  if (includesVideo) {
    return (
      getWallpaperFileByPriority(
        {
          files: wallpaper.files.filter(isVideoWallpaperFile),
        },
        RECOMMENDED_VIDEO_DOWNLOAD_PRIORITY,
      ) ??
      getWallpaperFileByPriority(wallpaper, RECOMMENDED_VIDEO_DOWNLOAD_PRIORITY)
    );
  }

  return getWallpaperFileByPriority(
    wallpaper,
    RECOMMENDED_IMAGE_DOWNLOAD_PRIORITY,
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

    if (includeVideo) {
      return variant === "original"
        ? isVideoWallpaperFile(file)
        : !isVideoWallpaperFile(file);
    }

    return !isVideoWallpaperFile(file);
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

export function getWallpaperShape(
  wallpaper: Pick<Wallpaper, "width" | "height">,
): MoodShape {
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

export function getWallpaperMeta(
  wallpaper: Pick<Wallpaper, "tags" | "width" | "height">,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const messages = getI18nMessages(locale);
  const primaryTag = translateStaticTerm(
    wallpaper.tags[0] ?? messages.wallpaper.curatedShort,
    locale,
  );
  const resolution =
    wallpaper.width && wallpaper.height
      ? `${Math.max(wallpaper.width, wallpaper.height)}p`
      : messages.wallpaper.hd;

  return `${primaryTag} · ${resolution}`;
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getWallpaperResolutionLabel(
  wallpaper: Pick<Wallpaper, "width" | "height">,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const messages = getI18nMessages(locale);
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

  return messages.wallpaper.hd;
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
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const messages = getI18nMessages(locale);

  return translateStaticTerm(
    wallpaper.aiCategory ??
      wallpaper.aiTags[0] ??
      wallpaper.tags[0] ??
      messages.wallpaper.curatedShort,
    locale,
  );
}

export function getWallpaperDisplayTitle(
  wallpaper: Pick<Wallpaper, "aiTags" | "tags" | "title">,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const messages = getI18nMessages(locale);
  const aiLabel = wallpaper.aiTags
    .filter(Boolean)
    .slice(0, 3)
    .map((term) => translateStaticTerm(term, locale))
    .join(" · ");

  if (aiLabel.trim().length > 0) {
    return aiLabel;
  }

  const tagLabel = wallpaper.tags
    .filter(Boolean)
    .slice(0, 3)
    .map((term) => translateStaticTerm(term, locale))
    .join(" · ");

  if (tagLabel.trim().length > 0) {
    return tagLabel;
  }

  if (looksLikeImportedFilename(wallpaper.title)) {
    return messages.wallpaper.curated;
  }

  return wallpaper.title;
}

function getEditorialDescription(
  wallpaper: Wallpaper,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const messages = getI18nMessages(locale);

  return (
    wallpaper.description?.trim() ||
    wallpaper.aiCaption?.trim() ||
    `${wallpaper.creator?.username ?? "Lumen"} · ${messages.wallpaper.curated}`
  );
}

export function wallpaperToMoodCard(
  wallpaper: Wallpaper,
  index: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): MoodCardData {
  return {
    id: wallpaper.id,
    gradient: getWallpaperGradientKey(wallpaper),
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    coverSources: getWallpaperCoverSources(wallpaper),
    shape: getWallpaperShape(wallpaper),
    number: String(index + 1).padStart(3, "0"),
    name: getWallpaperDisplayTitle(wallpaper, locale),
    meta: getWallpaperMeta(wallpaper, locale),
    href: `/wallpaper/${wallpaper.slug}`,
    videoUrl: wallpaper.videoUrl,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}

export function wallpaperToFilmCell(
  wallpaper: Wallpaper,
  locale: SupportedLocale = DEFAULT_LOCALE,
): FilmCellData {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    href: `/wallpaper/${wallpaper.slug}`,
    label: getWallpaperDisplayTitle(wallpaper, locale),
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    videoUrl: wallpaper.videoUrl ?? undefined,
  };
}

export function wallpaperToEditorialFeature(
  wallpaper: Wallpaper,
  locale: SupportedLocale = DEFAULT_LOCALE,
): EditorialFeature {
  const messages = getI18nMessages(locale);

  return {
    gradient: getWallpaperGradientKey(wallpaper),
    title: getWallpaperDisplayTitle(wallpaper, locale),
    description: getEditorialDescription(wallpaper, locale),
    eyebrow: wallpaper.featured
      ? messages.wallpaper.editorPickThisWeek
      : messages.wallpaper.editorPick,
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "large"),
    coverSources: getWallpaperCoverSources(wallpaper),
    videoUrl: wallpaper.videoUrl,
  };
}

export function wallpaperToEditorialItem(
  wallpaper: Wallpaper,
  index: number,
  locale: SupportedLocale = DEFAULT_LOCALE,
): EditorialItem {
  const messages = getI18nMessages(locale);

  return {
    gradient: getWallpaperGradientKey(wallpaper),
    number: `NO.${String(index + 2).padStart(2, "0")}`,
    title: getWallpaperDisplayTitle(wallpaper, locale),
    meta: `${getPrimaryWallpaperLabel(wallpaper, locale)} · ${getWallpaperResolutionLabel(wallpaper, locale)} · ${formatCompactCount(wallpaper.downloadsCount)} ${messages.wallpaper.downloads}`,
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "medium"),
    coverSources: getWallpaperCoverSources(wallpaper),
    videoUrl: wallpaper.videoUrl,
  };
}

export function wallpaperToDarkroomItem(
  wallpaper: Wallpaper,
  options?: {
    featured?: boolean;
    locale?: SupportedLocale;
  },
): DarkroomItem {
  const locale = options?.locale ?? DEFAULT_LOCALE;
  const messages = getI18nMessages(locale);

  return {
    gradient: getWallpaperGradientKey(wallpaper),
    title: getWallpaperDisplayTitle(wallpaper, locale),
    meta: `${getPrimaryWallpaperLabel(wallpaper, locale)} · ${getWallpaperResolutionLabel(wallpaper, locale)}`,
    href: `/wallpaper/${wallpaper.slug}`,
    previewUrl: getWallpaperPreviewUrl(wallpaper, "large"),
    coverSources: getWallpaperCoverSources(wallpaper),
    videoUrl: wallpaper.videoUrl,
    badge: options?.featured ? messages.wallpaper.bestThisWeek : undefined,
    featured: options?.featured ?? false,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}
