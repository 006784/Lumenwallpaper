import type { Metadata } from "next";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getCachedCreatorByUsername,
  getCachedWallpapersByCreator,
} from "@/lib/public-wallpaper-cache";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type CreatorPageProps = {
  params: {
    username: string;
  };
};

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const creator = await getCachedCreatorByUsername(params.username);
  const description =
    creator?.bio ??
    `查看 @${params.username} 在 Lumen 发布的壁纸作品与个人策展目录。`;

  return {
    title: `@${params.username}`,
    description,
    openGraph: {
      title: `@${params.username}`,
      description,
    },
  };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const creator = await getCachedCreatorByUsername(params.username);
  const wallpapers = await getCachedWallpapersByCreator(params.username);

  return (
    <section className="border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Creator
        </p>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.94] tracking-[-0.05em]">
          @{params.username}
        </h1>

        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          {creator?.bio
            ? creator.bio
            : "这个创作者页已经接上 Supabase 用户与壁纸表。只要上传时绑定了 creator 信息，这里就会自动展示作品。"}
        </p>

        <div className="mt-8 flex flex-wrap gap-8 border-t border-ink/10 pt-8 text-sm text-muted">
          <p>
            <span className="mr-2 uppercase tracking-[0.18em] text-ink">
              作品数
            </span>
            {wallpapers.length}
          </p>
          {creator?.email ? (
            <p>
              <span className="mr-2 uppercase tracking-[0.18em] text-ink">
                邮箱
              </span>
              {creator.email}
            </p>
          ) : null}
        </div>

        {wallpapers.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {wallpapers.map((wallpaper) => (
              <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
            ))}
          </div>
        ) : (
          <div className="mt-10 border-frame border-ink px-6 py-10 text-sm leading-7 text-muted">
            这个创作者暂时还没有公开作品。你可以去 Creator Studio
            上传一张并填写相同的用户名。
          </div>
        )}
      </div>
    </section>
  );
}
