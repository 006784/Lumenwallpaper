import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperDisplayTitle,
  getWallpaperDownloadFile,
  getWallpaperDownloadOptions,
  getPreferredWallpaperFile,
  getWallpaperGradientKey,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import { getCachedPublishedWallpapers, getCachedWallpaperByIdentifier } from "@/lib/public-wallpaper-cache";
import {
  getWallpaperFavoriteState,
} from "@/lib/wallpapers";
import { WallpaperDetailSidebar } from "@/components/wallpaper/wallpaper-detail-sidebar";
import { WallpaperVideoPlayer } from "@/components/wallpaper/wallpaper-video-player";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";

type WallpaperPageProps = {
  params: {
    id: string;
  };
};

function getVisibleWallpaperDescription(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (
    !normalized ||
    (normalized.includes("Cloudflare R2") &&
      normalized.includes("手动导入") &&
      normalized.includes("原图"))
  ) {
    return null;
  }

  return normalized;
}

export async function generateMetadata({
  params,
}: WallpaperPageProps): Promise<Metadata> {
  const wallpaper = await getCachedWallpaperByIdentifier(params.id);

  if (!wallpaper) {
    return {
      title: "壁纸未找到",
    };
  }

  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const tagLine = wallpaper.tags[0] ?? wallpaper.aiCategory ?? "高质感壁纸";
  const visibleDescription = getVisibleWallpaperDescription(wallpaper.description);

  return {
    title: wallpaper.title,
    description:
      visibleDescription ??
      `${wallpaper.title} · ${tagLine} · 来自 Lumen 的高质感壁纸详情页。`,
    openGraph: {
      title: wallpaper.title,
      description:
        visibleDescription ??
        `${wallpaper.title} · ${tagLine} · 来自 Lumen 的高质感壁纸详情页。`,
      images: preferredFile?.url ? [{ url: preferredFile.url }] : undefined,
    },
  };
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  const wallpaper = await getCachedWallpaperByIdentifier(params.id);

  if (!wallpaper) {
    notFound();
  }

  const currentSession = getCurrentSession();
  const displayTitle = getWallpaperDisplayTitle(wallpaper);
  const visibleDescription = getVisibleWallpaperDescription(wallpaper.description);
  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const posterUrl = getWallpaperPreviewUrl(wallpaper);
  const downloadFile = getWallpaperDownloadFile(wallpaper);
  const downloadOptions = getWallpaperDownloadOptions(wallpaper);
  const favoriteState = await getWallpaperFavoriteState(
    wallpaper.slug,
    currentSession?.user.id ?? null,
  );

  const relatedTag = wallpaper.tags[0] ?? wallpaper.aiTags[0] ?? null;
  const [relatedByTag, relatedPopular] = await Promise.all([
    relatedTag
      ? getCachedPublishedWallpapers({ tag: relatedTag, sort: "popular", limit: 7 })
      : Promise.resolve([]),
    getCachedPublishedWallpapers({ sort: "popular", limit: 7 }),
  ]);
  const candidatePool = relatedByTag.length >= 3 ? relatedByTag : relatedPopular;
  const relatedWallpapers = candidatePool
    .filter((w) => w.id !== wallpaper.id)
    .slice(0, 6);
  const artworkStyle = preferredFile
    ? {
        backgroundImage: `url("${preferredFile.url}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        backgroundImage: GRADIENTS[getWallpaperGradientKey(wallpaper)],
      };

  return (
    <>
      <section className="border-b-frame border-ink px-5 py-14 sm:px-6 md:px-10 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          {wallpaper.videoUrl ? (
            <WallpaperVideoPlayer
              posterUrl={posterUrl}
              title={displayTitle}
              videoUrl={wallpaper.videoUrl}
            />
          ) : (
            <div
              aria-label={displayTitle}
              className="aspect-[3/4] w-full border-frame border-ink bg-paper sm:aspect-[4/5]"
              role="img"
              style={artworkStyle}
            />
          )}
          <div>
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
              Wallpaper Detail
            </p>
            <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.94] tracking-[-0.05em]">
              {displayTitle}
            </h1>

            {visibleDescription ? (
              <p className="mt-6 max-w-xl text-sm leading-7 text-muted md:text-base">
                {visibleDescription}
              </p>
            ) : null}

            <WallpaperDetailSidebar
              aiCaption={wallpaper.aiCaption}
              aiTags={wallpaper.aiTags}
              canDownload={downloadOptions.length > 0 && Boolean(downloadFile)}
              colors={wallpaper.colors}
              creatorUsername={wallpaper.creator?.username ?? null}
              downloadOptions={downloadOptions}
              height={wallpaper.height}
              identifier={wallpaper.slug}
              initialDownloadsCount={wallpaper.downloadsCount}
              initialIsFavorited={favoriteState.isFavorited}
              initialLikesCount={favoriteState.likesCount}
              isSignedIn={Boolean(currentSession)}
              loginHref={`/login?next=/wallpaper/${encodeURIComponent(wallpaper.slug)}`}
              slug={wallpaper.slug}
              tags={wallpaper.tags}
              width={wallpaper.width}
            />
          </div>
        </div>
      </section>

      {relatedWallpapers.length > 0 ? (
        <section className="border-b-frame border-ink bg-paper/45 px-5 py-12 sm:px-6 md:px-10 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-red">
                  {relatedTag ? `更多 #${relatedTag}` : "热门推荐"}
                </p>
                <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,3rem)] leading-[0.96] tracking-[-0.05em]">
                  你可能也喜欢
                </h2>
              </div>
              <a
                className="shrink-0 text-[10px] uppercase tracking-[0.28em] text-muted underline-offset-4 transition hover:text-ink hover:underline"
                href={relatedTag ? `/explore?tag=${encodeURIComponent(relatedTag)}` : "/explore"}
              >
                查看全部 ↗
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relatedWallpapers.map((w) => (
                <WallpaperGridCard key={w.id} wallpaper={w} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
