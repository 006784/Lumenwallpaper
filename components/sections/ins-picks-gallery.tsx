import Link from "next/link";

import {
  InsPicksBatchArchive,
  InsPicksCollectionTools,
} from "@/components/sections/ins-picks-collection-tools";
import { FrameButton } from "@/components/ui/frame-button";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { getInsPicksUiCopy } from "@/lib/i18n-ui";
import { getWallpaperPreviewUrl } from "@/lib/wallpaper-presenters";
import { cn } from "@/lib/utils";
import type { SupportedLocale } from "@/types/i18n";
import type {
  InsPickCollectionSummary,
  InsPicksSnapshot,
} from "@/types/ins-picks";
import type { Wallpaper } from "@/types/wallpaper";

type InsPicksGalleryProps = {
  locale: SupportedLocale;
  mode: "index" | "collection";
  snapshot: InsPicksSnapshot;
};

function getDownloadHref(wallpaper: Wallpaper) {
  return `/api/wallpapers/${encodeURIComponent(wallpaper.slug)}/download`;
}

function CollectionPreview({
  collection,
}: {
  collection: InsPickCollectionSummary;
}) {
  const previewWallpapers = collection.previewWallpapers;

  if (previewWallpapers.length === 0) {
    return (
      <div className="grid h-full min-h-[240px] grid-cols-2 gap-2 p-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "glass-surface-soft relative overflow-hidden",
              index === 0 ? "rounded-tl-[26px]" : "",
              index === 1 ? "rounded-tr-[26px]" : "",
              index === 2 ? "rounded-bl-[26px]" : "",
              index === 3 ? "rounded-br-[26px]" : "",
            )}
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,109,45,0.16),rgba(23,79,80,0.08)_48%,rgba(255,255,255,0.34))]" />
            <div className="absolute inset-x-4 bottom-4 h-px bg-ink/10" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[240px] grid-cols-2 gap-2 p-3">
      {previewWallpapers.map((wallpaper, index) => (
        <div
          key={wallpaper.id}
          className={cn(
            "relative overflow-hidden bg-black",
            index === 0 ? "rounded-tl-[26px]" : "",
            index === 1 ? "rounded-tr-[26px]" : "",
            index === 2 ? "rounded-bl-[26px]" : "",
            index === 3 ? "rounded-br-[26px]" : "",
          )}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-card group-hover:scale-[1.04]"
            style={{
              backgroundImage: `url("${getWallpaperPreviewUrl(wallpaper, "medium")}")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        </div>
      ))}
    </div>
  );
}

function CollectionCard({
  collection,
  copy,
  featured = false,
}: {
  collection: InsPickCollectionSummary;
  copy: ReturnType<typeof getInsPicksUiCopy>;
  featured?: boolean;
}) {
  const isPlanned = collection.status === "planned" && collection.count === 0;
  const localized = copy.collections.details[collection.slug];

  return (
    <Link
      className={cn(
        "glass-surface group grid overflow-hidden transition duration-card hover:-translate-y-1 md:grid-cols-[0.9fr_1.1fr]",
        featured ? "md:col-span-2" : "",
      )}
      href={collection.href}
    >
      <div className="flex min-h-[260px] flex-col justify-between gap-8 p-5 md:p-6">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="glass-chip-active px-3 py-2 font-mono text-[9px] uppercase tracking-[0.24em]">
              {collection.count > 0
                ? copy.card.works(collection.count)
                : copy.card.ready}
            </span>
            {isPlanned ? (
              <span className="glass-chip px-3 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
                {copy.card.planned}
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
            {localized?.subtitle ?? collection.subtitle}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] font-medium leading-[0.95] text-ink">
            {collection.label}
          </h2>
          <p className="mt-2 text-[15px] text-muted">{collection.nativeName}</p>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          {localized?.description ?? collection.description}
        </p>
      </div>
      <CollectionPreview collection={collection} />
    </Link>
  );
}

function EmptyGallery({
  copy,
  snapshot,
}: {
  copy: ReturnType<typeof getInsPicksUiCopy>;
  snapshot: InsPicksSnapshot;
}) {
  return (
    <div className="glass-surface grid gap-8 p-5 md:grid-cols-[0.9fr_1.1fr] md:p-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
          {copy.empty.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.8rem)] font-medium leading-[0.98]">
          {copy.empty.title}
        </h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
          {copy.empty.body}
        </p>
      </div>
      <div className="glass-surface-soft p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
          {copy.empty.tagRecipe}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {snapshot.sourceTags.map((tag) => (
            <span
              key={tag}
              className="glass-chip px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-muted"
            >
              {tag}
            </span>
          ))}
          <span className="glass-chip-active px-3 py-2 text-[10px] uppercase tracking-[0.18em]">
            iu / 张元英 / 林允儿 / 裴珠泫 / 柳智敏 / 裴秀智 / 金智秀
          </span>
        </div>
        <FrameButton className="mt-8" href={snapshot.upload.href}>
          {copy.empty.cta}
        </FrameButton>
      </div>
    </div>
  );
}

export function InsPicksGallery({
  locale,
  mode,
  snapshot,
}: InsPicksGalleryProps) {
  const copy = getInsPicksUiCopy(locale);
  const selected = snapshot.selectedCollection;
  const heroCollection = selected ?? snapshot.collections[0];
  const wallpapers = snapshot.wallpapers;
  const selectedCopy = selected ? copy.collections.details[selected.slug] : null;
  const uploadHref = selected
    ? `/creator/studio?insCollection=${encodeURIComponent(selected.slug)}`
    : "/creator/studio";

  return (
    <>
      <section className="glass-panel-grid relative overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pt-28">
        <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] lg:items-end">
          <div className="space-y-7">
            <div className="glass-chip inline-flex items-center gap-3 px-4 py-2 text-[10px] uppercase text-muted">
              <span className="h-2 w-2 rounded-full bg-red shadow-[0_0_18px_rgba(255,109,45,0.5)]" />
              {copy.hero.badge}
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-red">
                {copy.hero.eyebrow}
              </p>
              <h1 className="mt-5 max-w-[10em] font-display text-[clamp(3rem,7vw,6.4rem)] font-medium leading-[0.94] text-ink">
                {selected ? selected.label : copy.hero.title}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
                {selected
                  ? selectedCopy?.description ?? selected.description
                  : copy.hero.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FrameButton href={uploadHref}>
                {copy.hero.uploadPhotos}
              </FrameButton>
              <FrameButton href={snapshot.upload.createEndpoint} variant="outline">
                {copy.hero.uploadApi}
              </FrameButton>
              <FrameButton
                href={snapshot.upload.collectionsEndpoint}
                variant="outline"
              >
                {copy.hero.collectionsApi}
              </FrameButton>
              <FrameButton href="/api/ins-picks" variant="outline">
                {copy.hero.apiSnapshot}
              </FrameButton>
              {selected ? (
                <FrameButton href="/ins" variant="outline">
                  {copy.hero.allCollections}
                </FrameButton>
              ) : null}
            </div>
            <InsPicksCollectionTools
              collectionsEndpoint={snapshot.upload.collectionsEndpoint}
              copy={copy.tools}
            />
          </div>

          {heroCollection ? (
            <div className="glass-surface overflow-hidden">
              <CollectionPreview collection={heroCollection} />
              <div className="border-t border-ink/10 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
                  {copy.hero.archiveTitle}
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {copy.hero.pipelineBody}
                </p>
                <p className="mt-3 break-all font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  R2: {heroCollection.r2Prefix}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
                {copy.collections.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] font-medium leading-none">
                {mode === "collection"
                  ? copy.collections.relatedTitle
                  : copy.collections.title}
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-muted">
              {copy.collections.body}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.collections.map((collection, index) => (
              <CollectionCard
                key={collection.slug}
                collection={collection}
                copy={copy}
                featured={mode === "index" && index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
                {copy.gallery.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] font-medium leading-none">
                {selected
                  ? copy.gallery.selectedTitle(selected.label)
                  : copy.gallery.latestTitle}
              </h2>
            </div>
            {selected?.latestWallpaper ? (
              <div className="flex flex-wrap gap-2">
                <FrameButton
                  href={getDownloadHref(selected.latestWallpaper)}
                  variant="outline"
                >
                  {copy.gallery.downloadLatest}
                </FrameButton>
                <FrameButton
                  href={`${snapshot.upload.archiveEndpoint}?collection=${encodeURIComponent(selected.slug)}`}
                  variant="outline"
                >
                  {copy.gallery.downloadZip}
                </FrameButton>
              </div>
            ) : null}
          </div>

          {wallpapers.length > 0 ? (
            <>
              {selected ? (
                <InsPicksBatchArchive
                  archiveEndpoint={snapshot.upload.archiveEndpoint}
                  collectionSlug={selected.slug}
                  copy={copy.archive}
                  wallpapers={wallpapers.map((wallpaper) => ({
                    id: wallpaper.id,
                    slug: wallpaper.slug,
                    title: wallpaper.title,
                  }))}
                />
              ) : null}
              <div className="wallpaper-card-grid grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {wallpapers.map((wallpaper) => (
                  <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
                ))}
              </div>
            </>
          ) : (
            <EmptyGallery copy={copy} snapshot={snapshot} />
          )}
        </div>
      </section>
    </>
  );
}
