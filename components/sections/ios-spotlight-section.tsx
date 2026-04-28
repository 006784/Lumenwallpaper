import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import type { Wallpaper } from "@/types/wallpaper";
import Link from "next/link";

type IosSpotlightSectionProps = {
  wallpapers: Wallpaper[];
};

export function IosSpotlightSection({
  wallpapers,
}: IosSpotlightSectionProps) {
  if (wallpapers.length === 0) {
    return null;
  }

  const [featuredWallpaper, ...restWallpapers] = wallpapers;

  return (
    <section className="px-5 py-14 sm:px-6 md:px-10 md:py-section">
      <Reveal className="mb-10">
        <SectionHeading
          eyebrow="02 — iOS 专区"
          hint={
            <span className="leading-5 text-right">
              竖屏优先
              <br />
              锁屏与主屏更顺手
            </span>
          }
          title={
            <>
              为 <em className="not-italic italic text-red">iPhone</em> 准备的
              <br />
              竖版精选
            </>
          }
        />
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          优先挑选更适合锁屏与主屏排版的竖版作品，这一组也会使用更高分辨率封面，避免手机专区的卡片发虚。
        </p>
        <div className="mt-6">
          <Link className="section-entry-link" href="/explore?sort=latest">
            进入 iOS 专区
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </Reveal>

      <Reveal className="grid gap-5 lg:grid-cols-[1.02fr_0.98fr] xl:grid-cols-[1.08fr_0.92fr]" y={24} duration={0.7}>
        <div className="space-y-5">
          <WallpaperGridCard
            aspectRatio="aspect-[9/18]"
            imageQuality="large"
            wallpaper={featuredWallpaper}
          />
          <div className="glass-surface-soft px-5 py-5">
            <p className="text-[10px] uppercase tracking-[0.32em] text-muted">
              iOS Curation Note
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              这里更关注时间组件、通知栏和主体留白的平衡，让壁纸在 iPhone 上更顺手，也更适合直接保存使用。
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {restWallpapers.map((wallpaper) => (
            <WallpaperGridCard
              key={wallpaper.id}
              aspectRatio="aspect-[9/18]"
              imageQuality="large"
              wallpaper={wallpaper}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}
