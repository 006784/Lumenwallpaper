import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  FilmCellData,
  MoodCardData,
} from "@/types/home";
import type { Wallpaper } from "@/types/wallpaper";

export interface HomePageSnapshot {
  darkroomItems: DarkroomItem[];
  editorialFeature: EditorialFeature;
  editorialItems: EditorialItem[];
  heroFilmRows: FilmCellData[][];
  iosWallpapers: Wallpaper[];
  moodCards: MoodCardData[];
}
