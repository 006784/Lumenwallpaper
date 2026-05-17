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
  const initials = collection.label
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (previewWallpapers.length === 0) {
    return (
      <div className="relative grid h-full min-h-[260px] overflow-hidden p-3">
        <div className="relative overflow-hidden rounded-[26px] border border-ink/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.54),rgba(23,79,80,0.08)_46%,rgba(255,109,45,0.12))] dark:border-paper/10 dark:bg-[linear-gradient(135deg,rgba(18,32,35,0.92),rgba(7,15,17,0.98)_46%,rgba(35,14,4,0.55))]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(255,109,45,0.85),rgba(23,79,80,0.55),rgba(214,176,106,0.75))]" />
          <div className="absolute inset-y-6 left-5 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <span
                aria-hidden="true"
                className="h-3 w-2 rounded-[3px] border border-ink/15 bg-paper/40 dark:border-paper/15 dark:bg-white/[0.08]"
                key={index}
              />
            ))}
          </div>
          <div className="absolute inset-y-6 right-5 flex flex-col justify-between">
            {Array.from({ length: 6 }).map((_, index) => (
              <span
                aria-hidden="true"
                className="h-3 w-2 rounded-[3px] border border-ink/15 bg-paper/40 dark:border-paper/15 dark:bg-white/[0.08]"
                key={index}
              />
            ))}
          </div>
          <div className="absolute inset-10 rounded-[22px] border border-ink/10 bg-paper/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] dark:border-paper/10 dark:bg-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
            <span className="font-display text-[clamp(3.4rem,7vw,5.5rem)] leading-none text-ink/45">
              {initials}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const [featured, ...rest] = previewWallpapers;

  return (
    <div className="grid h-full min-h-[300px] grid-cols-[1.4fr_1fr] gap-2 p-3">
      {/* 主图 */}
      <div className="relative overflow-hidden rounded-[22px] bg-black shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
        {featured ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
              style={{ backgroundImage: `url("${getWallpaperPreviewUrl(featured, "medium")}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(255,109,45,0.9),rgba(23,79,80,0.5),rgba(214,176,106,0.8))]" />
          </>
        ) : null}
      </div>
      {/* 副图竖列 */}
      <div className="flex flex-col gap-2">
        {rest.slice(0, 3).map((wallpaper, i) => (
          <div
            key={wallpaper.id}
            className={cn(
              "relative flex-1 overflow-hidden bg-black shadow-[0_4px_12px_rgba(0,0,0,0.18)]",
              i === 0 ? "rounded-tr-[22px]" : "",
              i === 2 ? "rounded-br-[22px]" : "",
              i === 1 ? "rounded-[6px]" : "",
            )}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-[1.04]"
              style={{ backgroundImage: `url("${getWallpaperPreviewUrl(wallpaper, "medium")}")` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        ))}
      </div>
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
        "group relative isolate grid overflow-hidden rounded-[22px] border border-ink/8 bg-white/60 shadow-[0_8px_32px_rgba(23,79,80,0.08)] transition duration-card hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(23,79,80,0.12)] dark:border-paper/10 dark:bg-paper/6 dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.24)] md:grid-cols-[0.9fr_1.1fr]",
        featured ? "md:col-span-2" : "",
      )}
      href={collection.href}
    >
      {/* 渐变顶线 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent_4%,rgba(255,109,45,0.85)_30%,rgba(23,79,80,0.5)_62%,rgba(214,176,106,0.75)_80%,transparent_96%)]" />

      <div className="relative flex min-h-[280px] flex-col justify-between gap-6 p-6 md:p-7">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-red ring-1 ring-red/20">
              {collection.count > 0
                ? copy.card.works(collection.count)
                : copy.card.ready}
            </span>
            {isPlanned ? (
              <span className="rounded-full border border-ink/10 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted dark:border-paper/10">
                {copy.card.planned}
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.38em] text-red/70">
            {localized?.subtitle ?? collection.subtitle}
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.6rem)] font-medium leading-[0.96] tracking-tight text-ink">
            {collection.label}
          </h2>
          <p className="mt-1.5 text-[14px] text-muted/70">{collection.nativeName}</p>
          <p className="mt-4 max-w-sm text-[13px] leading-7 text-muted">
            {localized?.description ?? collection.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[collection.source, collection.status].map((item) => (
            <span
              key={item}
              className="rounded-full border border-ink/8 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted/60 dark:border-paper/8"
            >
              {item}
            </span>
          ))}
          <span className="ml-auto text-[11px] text-muted/30 transition group-hover:text-red/50">↗</span>
        </div>
      </div>

      <div className="relative">
        <CollectionPreview collection={collection} />
      </div>
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
              {selected ? (
                <FrameButton href="/ins" variant="outline">
                  {copy.hero.allCollections}
                </FrameButton>
              ) : null}
            </div>
          </div>

          {heroCollection ? (
            <div className="glass-surface overflow-hidden">
              <CollectionPreview collection={heroCollection} />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {wallpapers.map((wallpaper, index) => (
                  <WallpaperGridCard
                    key={wallpaper.id}
                    wallpaper={wallpaper}
                    aspectRatio="aspect-[3/4]"
                    loading={index < 6 ? "eager" : "lazy"}
                  />
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
