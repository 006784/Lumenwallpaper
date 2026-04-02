import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentSession } from "@/lib/auth";
import { GRADIENTS } from "@/lib/gradients";
import {
  getWallpaperDownloadFile,
  getPreferredWallpaperFile,
  getWallpaperGradientKey,
} from "@/lib/wallpaper-presenters";
import { getCachedWallpaperByIdentifier } from "@/lib/public-wallpaper-cache";
import {
  getWallpaperFavoriteState,
} from "@/lib/wallpapers";
import { WallpaperDetailSidebar } from "@/components/wallpaper/wallpaper-detail-sidebar";
import { WallpaperVideoPlayer } from "@/components/wallpaper/wallpaper-video-player";

type WallpaperPageProps = {
  params: {
    id: string;
  };
};

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

  return {
    title: wallpaper.title,
    description:
      wallpaper.description ??
      `${wallpaper.title} · ${tagLine} · 来自 Lumen 的高质感壁纸详情页。`,
    openGraph: {
      title: wallpaper.title,
      description:
        wallpaper.description ??
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
  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const downloadFile = getWallpaperDownloadFile(wallpaper);
  const favoriteState = await getWallpaperFavoriteState(
    wallpaper.slug,
    currentSession?.user.id ?? null,
  );
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
    <section className="border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        {wallpaper.videoUrl ? (
          <WallpaperVideoPlayer title={wallpaper.title} videoUrl={wallpaper.videoUrl} />
        ) : (
          <div
            className="min-h-[420px] border-frame border-ink bg-paper"
            style={artworkStyle}
          />
        )}
        <div>
          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
            Wallpaper Detail
          </p>
          <h1 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.94] tracking-[-0.05em]">
            {wallpaper.title}
          </h1>

          {wallpaper.description ? (
            <p className="mt-6 max-w-xl text-sm leading-7 text-muted md:text-base">
              {wallpaper.description}
            </p>
          ) : null}

          <WallpaperDetailSidebar
            canDownload={Boolean(downloadFile)}
            creatorUsername={wallpaper.creator?.username ?? null}
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
  );
}
