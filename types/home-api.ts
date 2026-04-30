import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  FilmCellData,
  MoodCardData,
} from "@/types/home";
import type { SupportedLocale } from "@/types/i18n";
import type { Wallpaper } from "@/types/wallpaper";

export interface HomePageSnapshot {
  darkroomItems: DarkroomItem[];
  editorialFeature: EditorialFeature;
  editorialItems: EditorialItem[];
  heroFilmRows: FilmCellData[][];
  iosWallpapers: Wallpaper[];
  locale: SupportedLocale;
  moodCards: MoodCardData[];
}
