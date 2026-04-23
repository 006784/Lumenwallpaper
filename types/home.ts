export type GradientKey =
  | "forest"
  | "lava"
  | "ocean"
  | "void"
  | "dusk"
  | "ice"
  | "ember"
  | "night"
  | "blush"
  | "moss";

export type MoodShape = "portrait" | "landscape" | "square" | "tall";

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export interface HeroStat {
  label: string;
  value: string;
}

export interface WallpaperCoverSource {
  src: string;
  width: number;
}

export interface FilmCellData {
  gradient: GradientKey;
  label: string;
  href?: string;
  /** 动态壁纸视频 URL（可选，留空时显示动态渐变） */
  videoUrl?: string;
  previewUrl?: string;
}

export interface TickerItem {
  text: string;
  tone?: "default" | "gold" | "red";
}

export interface MoodCardData {
  id: string;
  gradient: GradientKey;
  previewUrl?: string;
  coverSources?: WallpaperCoverSource[];
  videoUrl?: string | null;
  shape: MoodShape;
  number: string;
  name: string;
  meta: string;
  href: string;
  aiTags?: string[];
}

export interface EditorialFeature {
  gradient: GradientKey;
  title: string;
  description: string;
  eyebrow: string;
  href: string;
  previewUrl?: string;
  coverSources?: WallpaperCoverSource[];
  videoUrl?: string | null;
}

export interface EditorialItem {
  gradient: GradientKey;
  number: string;
  title: string;
  meta: string;
  href: string;
  previewUrl?: string;
  coverSources?: WallpaperCoverSource[];
  videoUrl?: string | null;
}

export interface CategoryData {
  gradient: GradientKey;
  label: string;
  count: string;
  href: string;
}

export interface DarkroomItem {
  gradient: GradientKey;
  title: string;
  meta: string;
  href: string;
  previewUrl?: string;
  coverSources?: WallpaperCoverSource[];
  videoUrl?: string | null;
  badge?: string;
  featured?: boolean;
  aiTags?: string[];
}
