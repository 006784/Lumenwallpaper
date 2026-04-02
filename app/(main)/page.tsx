import { CategoryStrip } from "@/components/sections/category-strip";
import { DarkroomSection } from "@/components/sections/darkroom-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { HeroSection } from "@/components/sections/hero-section";
import { JoinSection } from "@/components/sections/join-section";
import { MoodBoardSection } from "@/components/sections/mood-board-section";
import { SearchSection } from "@/components/sections/search-section";
import { TickerStrip } from "@/components/sections/ticker-strip";
import { moodCards } from "@/lib/data/home";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import { wallpaperToMoodCard } from "@/lib/wallpaper-presenters";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export default async function HomePage() {
  const wallpapers = await getCachedPublishedWallpapers({
    limit: 10,
  });
  const cards =
    wallpapers.length > 0
      ? wallpapers.map((wallpaper, index) => wallpaperToMoodCard(wallpaper, index))
      : moodCards;

  return (
    <>
      <HeroSection />
      <TickerStrip />
      <MoodBoardSection cards={cards} />
      <EditorialSection />
      <CategoryStrip />
      <SearchSection />
      <DarkroomSection />
      <JoinSection />
    </>
  );
}
