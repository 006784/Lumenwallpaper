import { headers } from "next/headers";

import { CategoryStrip } from "@/components/sections/category-strip";
import { DarkroomSection } from "@/components/sections/darkroom-section";
import { EditorialSection } from "@/components/sections/editorial-section";
import { HeroSection } from "@/components/sections/hero-section";
import { IosSpotlightSection } from "@/components/sections/ios-spotlight-section";
import { JoinSection } from "@/components/sections/join-section";
import { MoodBoardSection } from "@/components/sections/mood-board-section";
import { SearchSection } from "@/components/sections/search-section";
import { TickerStrip } from "@/components/sections/ticker-strip";
import { getHomePageSnapshot } from "@/lib/home";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import {
  wallpaperToEditorialFeature,
  wallpaperToEditorialItem,
} from "@/lib/wallpaper-presenters";

// 每次请求重新渲染，保证壁纸随机变化；壁纸数据本身由 unstable_cache 缓存
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = getLocaleFromHeaders(headers());

  const [snapshot, pool] = await Promise.all([
    getHomePageSnapshot(locale),
    getCachedPublishedWallpapers({ limit: 96, sort: "latest" }),
  ]);

  // 从缓存池随机挑选 editorial 内容
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const editorialFeature = shuffled[0]
    ? wallpaperToEditorialFeature(shuffled[0], locale)
    : snapshot.editorialFeature;
  const editorialItems = shuffled.slice(1, 7).length > 0
    ? shuffled.slice(1, 7).map((w, i) => wallpaperToEditorialItem(w, i, locale))
    : snapshot.editorialItems;

  return (
    <>
      <HeroSection filmRows={snapshot.heroFilmRows} locale={locale} />
      <TickerStrip locale={locale} />
      <MoodBoardSection cards={snapshot.moodCards} locale={locale} />
      <IosSpotlightSection
        locale={locale}
        wallpapers={snapshot.iosWallpapers}
      />
      <EditorialSection
        feature={editorialFeature}
        items={editorialItems}
        locale={locale}
      />
      <CategoryStrip locale={locale} />
      <SearchSection locale={locale} />
      <DarkroomSection items={snapshot.darkroomItems} locale={locale} />
      <JoinSection locale={locale} />
    </>
  );
}
