import type {
  DarkroomItem,
  EditorialFeature,
  EditorialItem,
  MoodCardData,
} from "@/types/home";

export interface HomePageSnapshot {
  darkroomItems: DarkroomItem[];
  editorialFeature: EditorialFeature;
  editorialItems: EditorialItem[];
  moodCards: MoodCardData[];
}
