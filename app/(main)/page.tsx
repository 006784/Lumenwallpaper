import { CategoryStrip } from "@/components/sections/category-strip";
import { DarkroomSection } from "@/components/sections/darkroom-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { HeroSection } from "@/components/sections/hero-section";
import { IosSpotlightSection } from "@/components/sections/ios-spotlight-section";
import { JoinSection } from "@/components/sections/join-section";
import { MoodBoardSection } from "@/components/sections/mood-board-section";
import { SearchSection } from "@/components/sections/search-section";
import { TickerStrip } from "@/components/sections/ticker-strip";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getHomePageSnapshot } from "@/lib/home";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export default async function HomePage() {
  const snapshot = await getHomePageSnapshot();

  return (
    <>
      <HeroSection filmRows={snapshot.heroFilmRows} />
      <TickerStrip />
      <MoodBoardSection cards={snapshot.moodCards} />
      <IosSpotlightSection wallpapers={snapshot.iosWallpapers} />
      <EditorialSection
        feature={snapshot.editorialFeature}
        items={snapshot.editorialItems}
      />
      <CategoryStrip />
      <SearchSection />
      <DarkroomSection items={snapshot.darkroomItems} />
      <JoinSection />
    </>
  );
}
