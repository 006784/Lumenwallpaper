import type { GradientKey } from "@/types/home";
import type {
  Wallpaper,
  WallpaperAspectFilter,
  WallpaperFile,
  WallpaperMediaFilter,
  WallpaperOrientationFilter,
  WallpaperResolutionFilter,
  WallpaperSort,
} from "@/types/wallpaper";

export const DEFAULT_EXPLORE_SORT: WallpaperSort = "latest";

export type ExploreCategory = {
  description: string;
  gradient: GradientKey;
  href: string;
  label: string;
  matchValues: string[];
  slug: string;
};

export const EXPLORE_SORT_OPTIONS: Array<{
  description: string;
  label: string;
  value: WallpaperSort;
}> = [
  {
    value: "latest",
    label: "最新",
    description: "优先显示最近发布的作品",
  },
  {
    value: "popular",
    label: "下载热度",
    description: "按下载数排序",
  },
  {
    value: "likes",
    label: "收藏热度",
    description: "按收藏数排序",
  },
];

export const EXPLORE_RESOLUTION_OPTIONS: Array<{
  description: string;
  label: string;
  value: WallpaperResolutionFilter;
}> = [
  {
    value: "1080p",
    label: "1080P+",
    description: "至少满足 Full HD 级别",
  },
  {
    value: "2k",
    label: "2K+",
    description: "适合 1440P 屏幕",
  },
  {
    value: "4k",
    label: "4K+",
    description: "适合 4K 桌面或高密度屏幕",
  },
  {
    value: "5k",
    label: "5K+",
    description: "更高分辨率素材",
  },
  {
    value: "8k",
    label: "8K+",
    description: "超高分辨率素材",
  },
];

export const EXPLORE_ORIENTATION_OPTIONS: Array<{
  label: string;
  value: WallpaperOrientationFilter;
}> = [
  { value: "landscape", label: "横屏" },
  { value: "portrait", label: "竖屏" },
  { value: "square", label: "方图" },
];

export const EXPLORE_ASPECT_OPTIONS: Array<{
  description: string;
  label: string;
  value: WallpaperAspectFilter;
}> = [
  {
    value: "desktop",
    label: "桌面",
    description: "16:9、16:10、21:9 等横向桌面比例",
  },
  {
    value: "phone",
    label: "手机",
    description: "9:16、9:19.5、3:4 等竖向手机比例",
  },
  {
    value: "tablet",
    label: "平板",
    description: "4:3、3:4、接近方形的阅读设备比例",
  },
  {
    value: "ultrawide",
    label: "带鱼屏",
    description: "21:9 及以上的超宽桌面比例",
  },
  {
    value: "square",
    label: "方图",
    description: "接近 1:1 的头像、封面和社媒比例",
  },
];

export const EXPLORE_MEDIA_OPTIONS: Array<{
  label: string;
  value: WallpaperMediaFilter;
}> = [
  { value: "all", label: "全部" },
  { value: "static", label: "静态" },
  { value: "motion", label: "动态" },
];

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    slug: "nature",
    label: "自然风光",
    description: "山谷、森林、湖海与雾气，适合安静又有呼吸感的桌面。",
    gradient: "forest",
    href: "/explore/nature",
    matchValues: ["nature", "自然", "森林", "山谷", "海洋", "湖泊", "晨雾"],
  },
  {
    slug: "space",
    label: "宇宙星系",
    description: "星云、银河与深空影像，适合更沉浸的暗调桌面。",
    gradient: "void",
    href: "/explore/space",
    matchValues: ["space", "宇宙", "星系", "银河", "星云", "深空"],
  },
  {
    slug: "abstract",
    label: "抽象艺术",
    description: "流动渐变、材质肌理与极具图形感的实验画面。",
    gradient: "dusk",
    href: "/explore/abstract",
    matchValues: ["abstract", "抽象", "渐变", "材质", "实验", "纹理"],
  },
  {
    slug: "minimal",
    label: "极简主义",
    description: "低信息密度、高留白的干净构图，适合作为工作桌面背景。",
    gradient: "ice",
    href: "/explore/minimal",
    matchValues: ["minimal", "极简", "留白", "干净", "纯色"],
  },
  {
    slug: "city",
    label: "城市夜景",
    description: "摩天楼、霓虹街区和午夜高架，让桌面更有速度感。",
    gradient: "night",
    href: "/explore/city",
    matchValues: ["city", "城市", "夜景", "霓虹", "街区", "赛博"],
  },
  {
    slug: "illustration",
    label: "插画二次元",
    description: "插画、角色与二次元构图，适合更鲜明的个人风格。",
    gradient: "blush",
    href: "/explore/illustration",
    matchValues: ["illustration", "anime", "插画", "二次元", "角色", "动漫"],
  },
  {
    slug: "dark",
    label: "暗色系",
    description: "低亮度、重氛围、电影感更强的深色壁纸集合。",
    gradient: "ember",
    href: "/explore/dark",
    matchValues: ["dark", "暗色", "暗夜", "夜色", "深色", "电影感"],
  },
];

export function getExploreCategory(slug: string | undefined) {
  if (!slug) {
    return null;
  }

  return (
    EXPLORE_CATEGORIES.find(
      (category) => category.slug === slug.trim().toLowerCase(),
    ) ?? null
  );
}

export function getExploreSort(value: string | undefined): WallpaperSort {
  const normalizedValue = normalizeValue(value);

  if (["hot", "download", "downloads", "trending"].includes(normalizedValue)) {
    return "popular";
  }

  if (["favorite", "favorites", "liked"].includes(normalizedValue)) {
    return "likes";
  }

  return (
    EXPLORE_SORT_OPTIONS.find((option) => option.value === normalizedValue)
      ?.value ?? DEFAULT_EXPLORE_SORT
  );
}

export function isFeaturedFilterEnabled(value: string | undefined) {
  return value === "true" || value === "1";
}

export function isMotionFilterEnabled(value: string | undefined) {
  return value === "true" || value === "1";
}

function normalizeValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function getWallpaperDimensions(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
) {
  const candidates = [
    {
      width: wallpaper.width,
      height: wallpaper.height,
    },
    ...wallpaper.files.map((file) => ({
      width: file.width,
      height: file.height,
    })),
  ]
    .filter((item): item is { width: number; height: number } =>
      Boolean(item.width && item.height && item.width > 0 && item.height > 0),
    )
    .sort((left, right) => {
      return right.width * right.height - left.width * left.height;
    });

  return candidates[0] ?? null;
}

function getWallpaperAspectRatio(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
) {
  const dimensions = getWallpaperDimensions(wallpaper);

  if (!dimensions) {
    return null;
  }

  return dimensions.width / dimensions.height;
}

function getWallpaperLongAndShortEdges(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
) {
  const dimensions = getWallpaperDimensions(wallpaper);

  if (!dimensions) {
    return null;
  }

  return {
    longEdge: Math.max(dimensions.width, dimensions.height),
    shortEdge: Math.min(dimensions.width, dimensions.height),
    ...dimensions,
  };
}

export function matchesExploreCategory(
  wallpaper: Pick<Wallpaper, "aiCaption" | "aiCategory" | "aiTags" | "tags">,
  categorySlug: string | undefined,
) {
  const category = getExploreCategory(categorySlug);

  if (!category) {
    return true;
  }

  const values = [
    ...wallpaper.tags,
    ...wallpaper.aiTags,
    wallpaper.aiCategory ?? "",
    wallpaper.aiCaption ?? "",
  ]
    .map(normalizeValue)
    .filter(Boolean);

  return category.matchValues.some((matchValue) => {
    const normalizedMatch = normalizeValue(matchValue);

    return values.some(
      (value) =>
        value === normalizedMatch ||
        value.includes(normalizedMatch) ||
        normalizedMatch.includes(value),
    );
  });
}

function matchesTextValue(
  wallpaper: Pick<
    Wallpaper,
    "aiCaption" | "aiCategory" | "aiTags" | "description" | "tags" | "title"
  >,
  query: string | undefined,
) {
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) {
    return true;
  }

  return [
    wallpaper.title,
    wallpaper.description ?? "",
    wallpaper.aiCaption ?? "",
    wallpaper.aiCategory ?? "",
    ...wallpaper.tags,
    ...wallpaper.aiTags,
  ].some((value) => normalizeValue(value).includes(normalizedQuery));
}

export function matchesWallpaperStyle(
  wallpaper: Pick<
    Wallpaper,
    "aiCaption" | "aiCategory" | "aiTags" | "description" | "tags" | "title"
  >,
  style: string | undefined,
) {
  if (!style) {
    return true;
  }

  const category = getExploreCategory(style);

  if (category) {
    return matchesExploreCategory(wallpaper, category.slug);
  }

  return matchesTextValue(wallpaper, style);
}

export function matchesWallpaperOrientation(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
  orientation: WallpaperOrientationFilter | undefined,
) {
  if (!orientation) {
    return true;
  }

  const ratio = getWallpaperAspectRatio(wallpaper);

  if (!ratio) {
    return false;
  }

  if (orientation === "square") {
    return ratio >= 0.9 && ratio <= 1.1;
  }

  if (orientation === "landscape") {
    return ratio > 1.1;
  }

  return ratio < 0.9;
}

export function matchesWallpaperAspect(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
  aspect: WallpaperAspectFilter | undefined,
) {
  if (!aspect) {
    return true;
  }

  const ratio = getWallpaperAspectRatio(wallpaper);

  if (!ratio) {
    return false;
  }

  if (aspect === "square") {
    return ratio >= 0.9 && ratio <= 1.1;
  }

  if (aspect === "phone") {
    return ratio >= 0.42 && ratio <= 0.8;
  }

  if (aspect === "tablet") {
    return ratio >= 0.7 && ratio <= 1.45;
  }

  if (aspect === "ultrawide") {
    return ratio >= 2;
  }

  return ratio >= 1.25 && ratio < 2.4;
}

export function matchesWallpaperResolution(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
  resolution: WallpaperResolutionFilter | undefined,
) {
  if (!resolution) {
    return true;
  }

  const edges = getWallpaperLongAndShortEdges(wallpaper);

  if (!edges) {
    return false;
  }

  if (resolution === "8k") {
    return edges.longEdge >= 7680 || edges.shortEdge >= 4320;
  }

  if (resolution === "5k") {
    return edges.longEdge >= 5120 || edges.shortEdge >= 2880;
  }

  if (resolution === "4k") {
    return edges.longEdge >= 3840 || edges.shortEdge >= 2160;
  }

  if (resolution === "2k") {
    return edges.longEdge >= 2560 || edges.shortEdge >= 1440;
  }

  return edges.longEdge >= 1920 || edges.shortEdge >= 1080;
}

export function matchesWallpaperMinimumDimensions(
  wallpaper: Pick<Wallpaper, "files" | "height" | "width">,
  options: {
    minHeight?: number;
    minWidth?: number;
  },
) {
  if (!options.minWidth && !options.minHeight) {
    return true;
  }

  const dimensions = getWallpaperDimensions(wallpaper);

  if (!dimensions) {
    return false;
  }

  return (
    dimensions.width >= (options.minWidth ?? 0) &&
    dimensions.height >= (options.minHeight ?? 0)
  );
}

type RgbColor = {
  blue: number;
  green: number;
  red: number;
};

function parseHexColor(value: string): RgbColor | null {
  const normalized = value.trim().replace(/^#/, "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return null;
  }

  return {
    blue: Number.parseInt(normalized.slice(4, 6), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    red: Number.parseInt(normalized.slice(0, 2), 16),
  };
}

function rgbToHsl({ blue, green, red }: RgbColor) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return {
      hue: 0,
      lightness,
      saturation: 0,
    };
  }

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return {
    hue: hue * 60,
    lightness,
    saturation,
  };
}

type WallpaperColorFamily =
  | "black"
  | "blue"
  | "brown"
  | "cyan"
  | "gray"
  | "green"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "white"
  | "yellow";

const COLOR_FAMILY_ALIASES: Record<string, WallpaperColorFamily> = {
  black: "black",
  dark: "black",
  深色: "black",
  黑: "black",
  黑色: "black",
  blue: "blue",
  蓝: "blue",
  蓝色: "blue",
  brown: "brown",
  咖啡: "brown",
  棕色: "brown",
  cyan: "cyan",
  青色: "cyan",
  gray: "gray",
  grey: "gray",
  灰: "gray",
  灰色: "gray",
  green: "green",
  绿色: "green",
  绿: "green",
  light: "white",
  bright: "white",
  white: "white",
  白: "white",
  白色: "white",
  orange: "orange",
  橙色: "orange",
  橙: "orange",
  pink: "pink",
  粉: "pink",
  粉色: "pink",
  purple: "purple",
  紫: "purple",
  紫色: "purple",
  red: "red",
  红: "red",
  红色: "red",
  yellow: "yellow",
  黄: "yellow",
  黄色: "yellow",
};

function getColorFamilyFromRgb(rgb: RgbColor): WallpaperColorFamily {
  const hsl = rgbToHsl(rgb);

  if (hsl.lightness <= 0.18) {
    return "black";
  }

  if (hsl.lightness >= 0.88 && hsl.saturation <= 0.28) {
    return "white";
  }

  if (hsl.saturation <= 0.14) {
    return "gray";
  }

  if (hsl.hue < 14 || hsl.hue >= 346) {
    return "red";
  }

  if (hsl.hue < 36) {
    return hsl.lightness < 0.42 ? "brown" : "orange";
  }

  if (hsl.hue < 64) {
    return "yellow";
  }

  if (hsl.hue < 165) {
    return "green";
  }

  if (hsl.hue < 195) {
    return "cyan";
  }

  if (hsl.hue < 255) {
    return "blue";
  }

  if (hsl.hue < 305) {
    return "purple";
  }

  if (hsl.hue < 346) {
    return "pink";
  }

  return "red";
}

function getRgbDistance(left: RgbColor, right: RgbColor) {
  return Math.sqrt(
    (left.red - right.red) ** 2 +
      (left.green - right.green) ** 2 +
      (left.blue - right.blue) ** 2,
  );
}

export function matchesWallpaperColor(
  wallpaper: Pick<
    Wallpaper,
    | "aiCaption"
    | "aiCategory"
    | "aiTags"
    | "colors"
    | "description"
    | "tags"
    | "title"
  >,
  color: string | undefined,
) {
  const normalizedColor = normalizeValue(color).replace(/^#/, "");

  if (!normalizedColor) {
    return true;
  }

  const queryRgb = parseHexColor(normalizedColor);
  const queryFamily = queryRgb
    ? getColorFamilyFromRgb(queryRgb)
    : (COLOR_FAMILY_ALIASES[normalizedColor] ?? null);
  const palette = wallpaper.colors
    .map((value) => parseHexColor(value))
    .filter((value): value is RgbColor => value !== null);

  if (
    queryRgb &&
    palette.some((value) => getRgbDistance(value, queryRgb) <= 96)
  ) {
    return true;
  }

  if (
    queryFamily &&
    palette.some((value) => getColorFamilyFromRgb(value) === queryFamily)
  ) {
    return true;
  }

  return matchesTextValue(wallpaper, color);
}

export function matchesWallpaperMedia(
  wallpaper: Pick<Wallpaper, "videoUrl">,
  options: {
    media?: WallpaperMediaFilter;
    motion?: boolean;
  },
) {
  const media =
    options.media && options.media !== "all"
      ? options.media
      : options.motion === undefined
        ? "all"
        : options.motion
          ? "motion"
          : "static";

  if (media === "all") {
    return true;
  }

  return media === "motion" ? Boolean(wallpaper.videoUrl) : !wallpaper.videoUrl;
}

function isVideoWallpaperFile(
  file: Pick<WallpaperFile, "format" | "storagePath" | "url">,
) {
  return (
    file.format?.startsWith("video/") ||
    /\.(mp4|webm|mov)$/i.test(file.url) ||
    /\.(mp4|webm|mov)$/i.test(file.storagePath)
  );
}

function getMediaReadinessScore(
  wallpaper: Pick<Wallpaper, "files" | "height" | "videoUrl" | "width">,
) {
  const imageFiles = wallpaper.files.filter(
    (file) => !isVideoWallpaperFile(file),
  );
  const variants = new Set(imageFiles.map((file) => file.variant));
  const hasTopLevelDimensions = Boolean(wallpaper.width && wallpaper.height);
  const hasImageDimensions = imageFiles.some(
    (file) => file.width && file.height,
  );
  const everyImageFileHasDimensions =
    imageFiles.length > 0 &&
    imageFiles.every((file) => file.width && file.height);

  if (wallpaper.videoUrl) {
    return (
      20 +
      (imageFiles.length > 0 ? 30 : 0) +
      (variants.has("preview") ? 18 : 0) +
      (variants.has("thumb") ? 12 : 0) +
      (hasTopLevelDimensions || hasImageDimensions ? 12 : 0)
    );
  }

  return (
    (imageFiles.length > 0 ? 20 : 0) +
    (variants.has("preview") ? 24 : 0) +
    (variants.has("thumb") ? 18 : 0) +
    (variants.has("4k") ? 12 : 0) +
    (variants.has("original") ? 8 : 0) +
    (hasTopLevelDimensions ? 10 : 0) +
    (hasImageDimensions ? 6 : 0) +
    (everyImageFileHasDimensions ? 4 : 0)
  );
}

function compareMediaReadiness(left: Wallpaper, right: Wallpaper) {
  return getMediaReadinessScore(right) - getMediaReadinessScore(left);
}

export function sortWallpapers(
  wallpapers: Wallpaper[],
  sort: WallpaperSort | undefined,
) {
  const nextWallpapers = [...wallpapers];

  if (sort === "popular") {
    return nextWallpapers.sort((left, right) => {
      return (
        compareMediaReadiness(left, right) ||
        right.downloadsCount - left.downloadsCount ||
        right.likesCount - left.likesCount ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt)
      );
    });
  }

  if (sort === "likes") {
    return nextWallpapers.sort((left, right) => {
      return (
        compareMediaReadiness(left, right) ||
        right.likesCount - left.likesCount ||
        right.downloadsCount - left.downloadsCount ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt)
      );
    });
  }

  return nextWallpapers.sort((left, right) => {
    return (
      compareMediaReadiness(left, right) ||
      Date.parse(right.createdAt) - Date.parse(left.createdAt)
    );
  });
}
