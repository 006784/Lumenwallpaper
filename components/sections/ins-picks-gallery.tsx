import Link from "next/link";

import { FrameButton } from "@/components/ui/frame-button";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { getWallpaperPreviewUrl } from "@/lib/wallpaper-presenters";
import { cn } from "@/lib/utils";
import type {
  InsPickCollectionSummary,
  InsPicksSnapshot,
} from "@/types/ins-picks";
import type { Wallpaper } from "@/types/wallpaper";

type InsPicksGalleryProps = {
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
  featured = false,
}: {
  collection: InsPickCollectionSummary;
  featured?: boolean;
}) {
  const isPlanned = collection.status === "planned" && collection.count === 0;

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
              {collection.count > 0 ? `${collection.count} works` : "Ready"}
            </span>
            {isPlanned ? (
              <span className="glass-chip px-3 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
                Planned
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
            {collection.subtitle}
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] font-medium leading-[0.95] text-ink">
            {collection.label}
          </h2>
          <p className="mt-2 text-[15px] text-muted">{collection.nativeName}</p>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          {collection.description}
        </p>
      </div>
      <CollectionPreview collection={collection} />
    </Link>
  );
}

function EmptyGallery({ snapshot }: { snapshot: InsPicksSnapshot }) {
  return (
    <div className="glass-surface grid gap-8 p-5 md:grid-cols-[0.9fr_1.1fr] md:p-8">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-red">
          Upload pipeline
        </p>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.8rem)] font-medium leading-[0.98]">
          Waiting for the first INS import.
        </h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
          Keep using the existing upload studio. Confirm rights, upload the file,
          then add the source tag and the person tag. This zone will classify the
          work automatically after it is published.
        </p>
      </div>
      <div className="glass-surface-soft p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
          Tag recipe
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
            iu / 张元英 / 林允儿
          </span>
        </div>
        <FrameButton className="mt-8" href={snapshot.upload.href}>
          Upload in Studio
        </FrameButton>
      </div>
    </div>
  );
}

export function InsPicksGallery({ mode, snapshot }: InsPicksGalleryProps) {
  const selected = snapshot.selectedCollection;
  const heroCollection = selected ?? snapshot.collections[0];
  const wallpapers = snapshot.wallpapers;

  return (
    <>
      <section className="glass-panel-grid relative overflow-hidden px-4 pb-10 pt-24 sm:px-6 lg:px-10 lg:pt-28">
        <div className="mx-auto grid max-w-[1600px] gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.58fr)] lg:items-end">
          <div className="space-y-7">
            <div className="glass-chip inline-flex items-center gap-3 px-4 py-2 text-[10px] uppercase text-muted">
              <span className="h-2 w-2 rounded-full bg-red shadow-[0_0_18px_rgba(255,109,45,0.5)]" />
              Creator source zone
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-red">
                INS Picks
              </p>
              <h1 className="mt-5 max-w-[10em] font-display text-[clamp(3rem,7vw,6.4rem)] font-medium leading-[0.94] text-ink">
                {selected ? selected.label : "Instagram muse archive"}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted md:text-lg">
                {selected
                  ? selected.description
                  : "A dedicated area for celebrity Instagram-style photo sets. IU, Lim Yoona, Jang Wonyoung, and future domestic collections all share the same upload, moderation, and wallpaper download pipeline."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FrameButton href="/creator/studio">Upload photos</FrameButton>
              <FrameButton href="/api/ins-picks" variant="outline">
                API snapshot
              </FrameButton>
              {selected ? (
                <FrameButton href="/ins" variant="outline">
                  All collections
                </FrameButton>
              ) : null}
            </div>
          </div>

          {heroCollection ? (
            <div className="glass-surface overflow-hidden">
              <CollectionPreview collection={heroCollection} />
              <div className="border-t border-ink/10 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted">
                  Unified pipeline
                </p>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Upload through Studio, publish as wallpaper, download through
                  the existing wallpaper download endpoint.
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
                Collections
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] font-medium leading-none">
                {mode === "collection" ? "Related sets" : "Artist sets"}
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-muted">
              Add new names by extending the collection definitions and tagging
              uploads with source + person tags.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {snapshot.collections.map((collection, index) => (
              <CollectionCard
                key={collection.slug}
                collection={collection}
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
                Gallery
              </p>
              <h2 className="mt-3 font-display text-[clamp(2rem,5vw,3.6rem)] font-medium leading-none">
                {selected ? `${selected.label} wallpapers` : "Latest INS picks"}
              </h2>
            </div>
            {selected?.latestWallpaper ? (
              <FrameButton
                href={getDownloadHref(selected.latestWallpaper)}
                variant="outline"
              >
                Download latest
              </FrameButton>
            ) : null}
          </div>

          {wallpapers.length > 0 ? (
            <div className="wallpaper-card-grid grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {wallpapers.map((wallpaper) => (
                <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
              ))}
            </div>
          ) : (
            <EmptyGallery snapshot={snapshot} />
          )}
        </div>
      </section>
    </>
  );
}
