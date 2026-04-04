import type { GradientKey } from "@/types/home";
import type { Wallpaper, WallpaperSort } from "@/types/wallpaper";

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
  return (
    EXPLORE_SORT_OPTIONS.find((option) => option.value === value)?.value ??
    DEFAULT_EXPLORE_SORT
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

export function sortWallpapers(
  wallpapers: Wallpaper[],
  sort: WallpaperSort | undefined,
) {
  const nextWallpapers = [...wallpapers];

  if (sort === "popular") {
    return nextWallpapers.sort((left, right) => {
      return (
        right.downloadsCount - left.downloadsCount ||
        right.likesCount - left.likesCount ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt)
      );
    });
  }

  if (sort === "likes") {
    return nextWallpapers.sort((left, right) => {
      return (
        right.likesCount - left.likesCount ||
        right.downloadsCount - left.downloadsCount ||
        Date.parse(right.createdAt) - Date.parse(left.createdAt)
      );
    });
  }

  return nextWallpapers.sort((left, right) => {
    return Date.parse(right.createdAt) - Date.parse(left.createdAt);
  });
}
