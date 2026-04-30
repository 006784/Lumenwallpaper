import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { SupportedLocale } from "@/types/i18n";
import type { Wallpaper } from "@/types/wallpaper";
import Link from "next/link";

type IosSpotlightSectionProps = {
  locale: SupportedLocale;
  wallpapers: Wallpaper[];
};

export function IosSpotlightSection({
  locale,
  wallpapers,
}: IosSpotlightSectionProps) {
  if (wallpapers.length === 0) {
    return null;
  }

  const copy = getHomeUiCopy(locale);
  const [featuredWallpaper, ...restWallpapers] = wallpapers;

  return (
    <section className="px-5 py-12 sm:px-6 md:px-10 md:py-16">
      <Reveal className="mb-8">
        <SectionHeading
          eyebrow={copy.ios.eyebrow}
          hint={
            <span className="text-right leading-5">
              {copy.ios.hintLine1}
              <br />
              {copy.ios.hintLine2}
            </span>
          }
          title={
            <>
              {copy.ios.titleLine1}
              <br />
              <em className="italic not-italic text-red">
                {copy.ios.titleLine2}
              </em>
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          {copy.ios.body}
        </p>
        <div className="mt-6">
          <Link className="section-entry-link" href="/explore?sort=latest">
            {copy.ios.cta}
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal
        className="grid items-start gap-5 lg:grid-cols-[0.72fr_1.28fr]"
        y={24}
        duration={0.7}
      >
        <div className="space-y-5">
          <div className="mx-auto max-w-[280px] sm:max-w-[300px] lg:max-w-[320px]">
            <WallpaperGridCard
              aspectRatio="aspect-[9/16]"
              imageQuality="large"
              wallpaper={featuredWallpaper}
            />
          </div>
          <div className="glass-surface-soft px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
              {copy.ios.noteTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              {copy.ios.noteBody}
            </p>
          </div>
        </div>

        <div className="wallpaper-card-grid">
          {restWallpapers.map((wallpaper) => (
            <WallpaperGridCard
              key={wallpaper.id}
              aspectRatio="aspect-[9/16]"
              imageQuality="large"
              wallpaper={wallpaper}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
