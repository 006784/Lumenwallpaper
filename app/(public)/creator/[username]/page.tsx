import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import Link from "next/link";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { Reveal } from "@/components/ui/reveal";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getCachedCreatorPageSnapshot,
  getCachedPublishedWallpapers,
} from "@/lib/public-wallpaper-cache";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

type CreatorPageProps = {
  params: {
    username: string;
  };
};

export async function generateMetadata({
  params,
}: CreatorPageProps): Promise<Metadata> {
  const snapshot = await getCachedCreatorPageSnapshot(params.username);
  if (!snapshot) {
    return { title: `@${params.username}` };
  }
  const { creator, stats } = snapshot;
  const description =
    creator.bio ??
    `查看 @${creator.username} 在 Lumen 发布的 ${stats.totalWallpapers} 件壁纸作品。`;

  return {
    title: `@${creator.username}`,
    description,
    openGraph: {
      title: `@${creator.username} — Lumen`,
      description,
      ...(creator.avatarUrl ? { images: [creator.avatarUrl] } : {}),
    },
  };
}

export async function generateStaticParams() {
  try {
    const wallpapers = await getCachedPublishedWallpapers({
      limit: 1000,
      sort: "latest",
    });
    const usernames = Array.from(
      new Set(
        wallpapers
          .map((wallpaper) => wallpaper.creator?.username)
          .filter((value): value is string => Boolean(value)),
      ),
    );

    return usernames.map((username) => ({
      username,
    }));
  } catch {
    return [];
  }
}

// ─── 统计格 ───────────────────────────────────────────────────────────────────

function StatCell({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="px-6 py-5 first:pl-0">
      <p className="font-mono text-[28px] leading-none text-ink">
        {value}
      </p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted">
        {label}
      </p>
    </div>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────

export default async function CreatorPage({ params }: CreatorPageProps) {
  const snapshot = await getCachedCreatorPageSnapshot(params.username);
  if (!snapshot) notFound();

  const { creator, stats, wallpapers } = snapshot;

  const joinYear = new Date(creator.createdAt).getFullYear();

  return (
    <>
      {/* ── 创作者头部（暗色） ── */}
      <section className="glass-panel-grid px-4 pb-12 pt-24 md:px-10 md:pt-28">
        <div className="glass-surface mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
          <Reveal y={16} duration={0.5}>
            {/* 面包屑 */}
            <div className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-muted">
              <Link
                className="transition hover:text-ink"
                href="/explore"
              >
                探索
              </Link>
              <span>/</span>
              <span className="text-red">创作者</span>
            </div>

            {/* 眉标 */}
            <p className="mb-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-red">
              <span className="live-dot inline-block h-[7px] w-[7px] rounded-full bg-red" />
              创作者
            </p>

            {/* 头像 + 名字 */}
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:gap-10">
              {/* 头像 */}
              <div className="glass-control relative h-20 w-20 shrink-0 overflow-hidden md:h-24 md:w-24">
                {creator.avatarUrl ? (
                  <Image
                    src={creator.avatarUrl}
                    alt={creator.username}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-white/45 font-body text-[36px] font-semibold text-ink/50">
                    {creator.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* 名字 + bio */}
              <div className="flex-1">
                <h1 className="font-body text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[1.02] text-ink">
                  @{creator.username}
                </h1>
                {creator.bio ? (
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                    {creator.bio}
                  </p>
                ) : null}
                <p className="mt-3 text-[10px] uppercase tracking-[0.28em] text-muted">
                  自 {joinYear} 年加入
                </p>
              </div>
            </div>

            {/* 统计横条 */}
            <div className="mt-10 flex flex-wrap pt-2">
              <StatCell value={formatCount(stats.totalWallpapers)} label="作品数" />
              <StatCell value={formatCount(stats.totalDownloads)} label="总下载" />
              <StatCell value={formatCount(stats.totalLikes)} label="获赞" />
              <StatCell value={stats.featuredWallpapers} label="精选入库" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 作品网格 ── */}
      <section className="px-4 py-14 md:px-10 md:py-section">
        <div className="mx-auto max-w-6xl">
          <Reveal y={12} duration={0.5}>
            <div className="mb-8 flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted">
                {stats.totalWallpapers} 件作品
              </p>
              {stats.latestPublishedAt ? (
                <p className="text-[10px] uppercase tracking-[0.28em] text-muted/60">
                  最近更新{" "}
                  {new Date(stats.latestPublishedAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "short",
                  })}
                </p>
              ) : null}
            </div>
          </Reveal>

          {wallpapers.length > 0 ? (
            <Reveal stagger y={20} duration={0.6}>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {wallpapers.map((wallpaper) => (
                  <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
                ))}
              </div>
            </Reveal>
          ) : (
            <Reveal y={12} duration={0.5}>
              <div className="glass-surface-soft px-8 py-16 text-center">
                <p className="font-body text-[22px] font-semibold text-muted">
                  暂无公开作品
                </p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.28em] text-muted/60">
                  这位创作者还没有发布任何壁纸
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
