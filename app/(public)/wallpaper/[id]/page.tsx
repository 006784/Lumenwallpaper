import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import {
  getWallpaperDisplayTitle,
  getWallpaperDownloadFile,
  getWallpaperDownloadOptions,
  getPreferredWallpaperFile,
  getWallpaperGradientKey,
  getWallpaperPreviewUrl,
  getWallpaperCoverSources,
} from "@/lib/wallpaper-presenters";
import { getLocaleFromHeaders, translateStaticTerm } from "@/lib/i18n";
import { getWallpaperPageCopy } from "@/lib/i18n-ui";
import {
  getCachedPublishedWallpapers,
  getCachedWallpaperByIdentifier,
} from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";
import { WallpaperDetailSidebar } from "@/components/wallpaper/wallpaper-detail-sidebar";
import { WallpaperVideoPlayer } from "@/components/wallpaper/wallpaper-video-player";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";

type WallpaperPageProps = {
  params: {
    id: string;
  };
};

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export async function generateStaticParams() {
  try {
    const wallpapers = await getCachedPublishedWallpapers({
      limit: 1000,
      sort: "latest",
    });

    return wallpapers.map((wallpaper) => ({
      id: wallpaper.slug,
    }));
  } catch {
    return [];
  }
}

function normalizeTagValue(value: string) {
  return value.trim().toLowerCase();
}

function wallpaperMatchesRelatedTag(
  wallpaper: {
    aiTags: string[];
    tags: string[];
  },
  relatedTag: string,
) {
  const normalizedRelatedTag = normalizeTagValue(relatedTag);

  return [...wallpaper.tags, ...wallpaper.aiTags].some((tag) => {
    return normalizeTagValue(tag) === normalizedRelatedTag;
  });
}

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
  const locale = getLocaleFromHeaders(headers());
  const copy = getWallpaperPageCopy(locale);
  const wallpaper = await getCachedWallpaperByIdentifier(params.id);

  if (!wallpaper) {
    return {
      title: copy.notFoundTitle,
    };
  }

  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const tagLine = translateStaticTerm(
    wallpaper.tags[0] ??
      wallpaper.aiCategory ??
      (locale === "zh-CN"
        ? "高质感壁纸"
        : locale === "ja"
          ? "高品質な壁紙"
          : locale === "ko"
            ? "고품질 배경화면"
            : "high-quality wallpaper"),
    locale,
  );
  const displayTitle = getWallpaperDisplayTitle(wallpaper, locale);
  const visibleDescription = getVisibleWallpaperDescription(
    wallpaper.description,
  );
  const openGraphImage =
    preferredFile?.url && !preferredFile.url.startsWith("data:")
      ? preferredFile.url
      : undefined;

  const description =
    visibleDescription ?? copy.seoFallback({ tagLine, title: displayTitle });

  return createPublicPageMetadata({
    path: `/wallpaper/${wallpaper.slug}`,
    title: displayTitle,
    description,
    image: openGraphImage,
    type: "article",
  });
}

export default async function WallpaperPage({ params }: WallpaperPageProps) {
  const locale = getLocaleFromHeaders(headers());
  const copy = getWallpaperPageCopy(locale);
  const wallpaper = await getCachedWallpaperByIdentifier(params.id);

  if (!wallpaper) {
    notFound();
  }

  const displayTitle = getWallpaperDisplayTitle(wallpaper, locale);
  const visibleDescription = getVisibleWallpaperDescription(
    wallpaper.description,
  );
  const preferredFile = getPreferredWallpaperFile(wallpaper);
  const posterUrl = getWallpaperPreviewUrl(wallpaper);
  const downloadFile = getWallpaperDownloadFile(wallpaper);
  const downloadOptions = getWallpaperDownloadOptions(wallpaper);

  const relatedTag = wallpaper.tags[0] ?? wallpaper.aiTags[0] ?? null;
  let relatedWallpapers: Awaited<
    ReturnType<typeof getCachedPublishedWallpapers>
  > = [];

  try {
    const relatedPopular = await getCachedPublishedWallpapers({
      sort: "popular",
    });
    const relatedByTag = relatedTag
      ? relatedPopular.filter((candidate) => {
          return wallpaperMatchesRelatedTag(candidate, relatedTag);
        })
      : [];
    const candidatePool =
      relatedByTag.length >= 3 ? relatedByTag : relatedPopular;

    relatedWallpapers = candidatePool
      .filter((candidate) => candidate.id !== wallpaper.id)
      .slice(0, 6);
  } catch {
    relatedWallpapers = [];
  }

  const gradientKey = getWallpaperGradientKey(wallpaper);
  const coverSources = getWallpaperCoverSources(wallpaper);

  return (
    <>
      <section className="glass-panel-grid px-5 pb-8 pt-24 sm:px-6 md:px-10 md:pb-12 md:pt-28">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.14fr_0.86fr] lg:gap-10">
          {wallpaper.videoUrl ? (
            <WallpaperVideoPlayer
              posterUrl={posterUrl}
              title={displayTitle}
              videoUrl={wallpaper.videoUrl}
            />
          ) : (
            <div
              aria-label={displayTitle}
              className="glass-surface relative h-[min(74vh,820px)] min-h-[420px] w-full overflow-hidden p-3 lg:sticky lg:top-24"
              role="img"
            >
              <WallpaperCoverImage
                alt={displayTitle}
                gradient={gradientKey}
                imageClassName="!object-contain rounded-[24px] bg-white/45"
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 50vw"
                sources={coverSources}
                src={posterUrl ?? preferredFile?.url}
              />
            </div>
          )}
          <div className="glass-surface-soft self-start px-5 py-6 md:px-7 md:py-7">
            <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
              {copy.detailEyebrow}
            </p>
            <h1 className="font-body text-[clamp(2.1rem,5vw,3.8rem)] font-semibold leading-[1.02] tracking-normal">
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
              initialLikesCount={wallpaper.likesCount}
              loginHref={`/login?next=/wallpaper/${encodeURIComponent(wallpaper.slug)}`}
              locale={locale}
              previewUrl={posterUrl ?? preferredFile?.url ?? null}
              slug={wallpaper.slug}
              tags={wallpaper.tags}
              title={displayTitle}
              width={wallpaper.width}
            />
          </div>
        </div>
      </section>

      {relatedWallpapers.length > 0 ? (
        <section className="px-5 py-10 sm:px-6 md:px-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-red">
                  {relatedTag
                    ? copy.moreTag(translateStaticTerm(relatedTag, locale))
                    : copy.relatedPopular}
                </p>
                <h2 className="mt-3 font-body text-[clamp(1.7rem,3vw,2.6rem)] font-semibold leading-tight tracking-normal">
                  {copy.relatedHeading}
                </h2>
              </div>
              <a
                className="glass-control shrink-0 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-muted transition hover:text-ink"
                href={
                  relatedTag
                    ? `/explore?tag=${encodeURIComponent(relatedTag)}`
                    : "/explore"
                }
              >
                {copy.all}
              </a>
            </div>
            <div className="wallpaper-card-grid">
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
