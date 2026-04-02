import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  GradientKey,
  MoodCardData,
  MoodShape,
} from "@/types/home";
import type { Wallpaper, WallpaperFile } from "@/types/wallpaper";

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

const DOWNLOAD_FILE_VARIANT_PRIORITY: Array<WallpaperFile["variant"]> = [
  "original",
  "4k",
  "preview",
  "thumb",
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

export function getPreferredWallpaperFile(
  wallpaper: Pick<Wallpaper, "files">,
) {
  return getWallpaperFileByPriority(wallpaper, PREVIEW_FILE_VARIANT_PRIORITY);
}

export function getWallpaperPreviewUrl(wallpaper: Pick<Wallpaper, "files">) {
  return getPreferredWallpaperFile(wallpaper)?.url;
}

export function getWallpaperDownloadFile(wallpaper: Pick<Wallpaper, "files">) {
  return getWallpaperFileByPriority(wallpaper, DOWNLOAD_FILE_VARIANT_PRIORITY);
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

function getPrimaryWallpaperLabel(
  wallpaper: Pick<Wallpaper, "aiCategory" | "aiTags" | "tags">,
) {
  return wallpaper.aiCategory ?? wallpaper.aiTags[0] ?? wallpaper.tags[0] ?? "精选";
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
    previewUrl: getWallpaperPreviewUrl(wallpaper),
    shape: getWallpaperShape(wallpaper),
    number: String(index + 1).padStart(3, "0"),
    name: wallpaper.title,
    meta: getWallpaperMeta(wallpaper),
    href: `/wallpaper/${wallpaper.slug}`,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}

export function wallpaperToEditorialFeature(
  wallpaper: Wallpaper,
): EditorialFeature {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    title: wallpaper.title,
    description: getEditorialDescription(wallpaper),
    eyebrow: wallpaper.featured ? "编辑推荐 · 本周" : "编辑推荐",
    href: `/wallpaper/${wallpaper.slug}`,
  };
}

export function wallpaperToEditorialItem(
  wallpaper: Wallpaper,
  index: number,
): EditorialItem {
  return {
    gradient: getWallpaperGradientKey(wallpaper),
    number: `NO.${String(index + 2).padStart(2, "0")}`,
    title: wallpaper.title,
    meta: `${getPrimaryWallpaperLabel(wallpaper)} · ${getWallpaperResolutionLabel(wallpaper)} · ${formatCompactCount(wallpaper.downloadsCount)} 次下载`,
    href: `/wallpaper/${wallpaper.slug}`,
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
    title: wallpaper.title,
    meta: `${getPrimaryWallpaperLabel(wallpaper)} · ${getWallpaperResolutionLabel(wallpaper)}`,
    href: `/wallpaper/${wallpaper.slug}`,
    badge: options?.featured ? "本周最佳" : undefined,
    featured: options?.featured ?? false,
    aiTags: wallpaper.aiTags.slice(0, 3),
  };
}
