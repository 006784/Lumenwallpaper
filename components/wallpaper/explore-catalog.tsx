"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { MotionPreviewLayer } from "@/components/wallpaper/motion-preview-layer";
import { WallpaperCoverImage } from "@/components/wallpaper/wallpaper-cover-image";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { Wallpaper, WallpaperListPageResult } from "@/types/wallpaper";
import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_CATEGORIES,
  EXPLORE_SORT_OPTIONS,
  getExploreCategory,
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";
import { getExploreCategoryCopy, getExploreOptionCopy } from "@/lib/i18n";
import { getExploreUiCopy } from "@/lib/i18n-ui";
import { cn } from "@/lib/utils";
import {
  getWallpaperCoverSources,
  getWallpaperDisplayTitle,
  getWallpaperMeta,
  getWallpaperPreviewUrl,
} from "@/lib/wallpaper-presenters";
import type { SupportedLocale } from "@/types/i18n";

type ExploreCatalogProps = {
  categorySlug?: string;
  initialResult?: WallpaperListPageResult;
  locale: SupportedLocale;
};

type ExploreCatalogLoadingProps = {
  categorySlug?: string;
  locale: SupportedLocale;
};

function buildExploreHref(
  categorySlug: string | undefined,
  nextValues: {
    featured?: boolean;
    motion?: boolean;
    page?: number;
    q?: string;
    sort?: string;
    tag?: string;
  },
) {
  const params = new URLSearchParams();

  if (nextValues.q) {
    params.set("q", nextValues.q);
  }

  if (nextValues.tag) {
    params.set("tag", nextValues.tag);
  }

  if (nextValues.sort && nextValues.sort !== DEFAULT_EXPLORE_SORT) {
    params.set("sort", nextValues.sort);
  }

  if (nextValues.featured) {
    params.set("featured", "true");
  }

  if (nextValues.motion) {
    params.set("motion", "true");
  }

  if (nextValues.page && nextValues.page > 1) {
    params.set("page", String(nextValues.page));
  }

  const pathname = categorySlug ? `/explore/${categorySlug}` : "/explore";
  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

function buildExploreApiHref(
  categorySlug: string | undefined,
  nextValues: {
    featured?: boolean;
    motion?: boolean;
    page?: number;
    q?: string;
    sort?: string;
    tag?: string;
  },
  locale: SupportedLocale,
) {
  const params = new URLSearchParams();
  params.set("withMeta", "true");
  params.set("locale", locale);
  params.set(
    "page",
    String(nextValues.page && nextValues.page > 0 ? nextValues.page : 1),
  );

  if (nextValues.q) {
    params.set("q", nextValues.q);
  }

  if (nextValues.tag) {
    params.set("tag", nextValues.tag);
  }

  if (categorySlug) {
    params.set("category", categorySlug);
  }

  if (nextValues.sort && nextValues.sort !== DEFAULT_EXPLORE_SORT) {
    params.set("sort", nextValues.sort);
  }

  if (nextValues.featured) {
    params.set("featured", "true");
  }

  if (nextValues.motion) {
    params.set("motion", "true");
  }

  return `/api/wallpapers?${params.toString()}`;
}

function ExploreSummary({
  count,
  featuredOnly,
  locale,
  motionOnly,
  page,
  pageSize,
  sort,
  total,
  totalPages,
}: {
  count: number;
  featuredOnly: boolean;
  locale: SupportedLocale;
  motionOnly: boolean;
  page: number;
  pageSize: number;
  sort: string;
  total: number;
  totalPages: number;
}) {
  const copy = getExploreUiCopy(locale);
  const sortLabel =
    getExploreOptionCopy(locale, "sort", sort)?.label ??
    EXPLORE_SORT_OPTIONS.find((item) => item.value === sort)?.label;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[9px] uppercase tracking-[0.22em] text-muted/70">
      {[
        copy.pageCount({ page, total, totalPages }),
        copy.pageSize({ count, pageSize }),
        `${copy.sortLabel} ${sortLabel}`,
        featuredOnly ? copy.featuredOff : copy.allFilters,
        motionOnly ? copy.motionOnly : null,
      ]
        .filter(Boolean)
        .map((item, i) => (
          <span key={i} className="flex items-center gap-4">
            {i > 0 && <span className="h-px w-3 bg-ink/15 dark:bg-paper/15" />}
            {item}
          </span>
        ))}
    </div>
  );
}

function ExploreCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-ink/6 bg-white/50 dark:border-paper/8 dark:bg-paper/5">
      <div className="aspect-[4/5] animate-pulse bg-gradient-to-br from-ink/4 via-ink/6 to-ink/4 dark:from-paper/4 dark:via-paper/6 dark:to-paper/4" />
      <div className="space-y-2.5 px-3.5 py-3.5">
        <div className="h-3 w-3/4 animate-pulse rounded-full bg-ink/6 dark:bg-paper/6" />
        <div className="flex gap-2">
          <span className="h-5 w-14 animate-pulse rounded-full bg-ink/5 dark:bg-paper/5" />
          <span className="h-5 w-10 animate-pulse rounded-full bg-ink/5 dark:bg-paper/5" />
        </div>
      </div>
    </div>
  );
}

function MotionSpotlight({
  locale,
  wallpapers,
}: {
  locale: SupportedLocale;
  wallpapers: Wallpaper[];
}) {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const featured = wallpapers.find((wallpaper) => wallpaper.videoUrl);
  const title = featured ? getWallpaperDisplayTitle(featured) : "Motion";
  const previewUrl = featured ? getWallpaperPreviewUrl(featured, "large") : null;
  const coverSources = featured ? getWallpaperCoverSources(featured) : undefined;

  return (
    <div className="glass-surface-soft mt-6 overflow-hidden p-2.5 md:p-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.28fr)_minmax(280px,0.72fr)]">
        <Link
          className="group relative min-h-[390px] overflow-hidden rounded-[24px] bg-ink text-paper md:min-h-[500px]"
          href={featured ? `/wallpaper/${featured.slug}` : "/explore?motion=true"}
          onBlur={() => setActivePreviewId(null)}
          onFocus={() => {
            if (featured) {
              setActivePreviewId(featured.id);
            }
          }}
          onMouseEnter={() => {
            if (featured) {
              setActivePreviewId(featured.id);
            }
          }}
          onMouseLeave={() => setActivePreviewId(null)}
        >
          {featured && previewUrl ? (
            <>
              <WallpaperCoverImage
                alt={title}
                sources={coverSources}
                gradient="night"
                imageClassName="brightness-[.96] contrast-[1.02] saturate-[1.08]"
                sizes="(max-width: 1024px) 100vw, 62vw"
                src={previewUrl}
              />
              {featured.videoUrl ? (
                <MotionPreviewLayer
                  className="transition-transform duration-card group-hover:scale-[1.035]"
                  isActive={activePreviewId === featured.id}
                  videoUrl={featured.videoUrl}
                />
              ) : null}
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(190,74,54,0.28),transparent_32%),linear-gradient(135deg,#102728,#101514_52%,#2c2119)]" />
          )}

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,111,77,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.64))]" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-paper/20 bg-black/20 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-paper/76 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-red shadow-[0_0_12px_rgba(190,74,54,0.95)]" />
            Motion
          </div>
          <div className="absolute right-4 top-4 rounded-full border border-paper/18 bg-black/18 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-paper/60 backdrop-blur-md">
            {String(wallpapers.length).padStart(2, "0")} loops
          </div>

          <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-24 md:px-7 md:pb-6">
            <p className="text-[10px] uppercase tracking-[0.34em] text-paper/48">
              {locale === "zh-CN"
                ? "动态专区"
                : locale === "ja"
                  ? "モーション"
                  : locale === "ko"
                    ? "모션"
                    : "Motion gallery"}
            </p>
            <h2 className="mt-2 max-w-2xl font-body text-[clamp(2rem,5vw,4.4rem)] font-semibold leading-[0.98] tracking-normal text-paper">
              {title}
            </h2>
            {featured ? (
              <p className="mt-3 max-w-xl text-sm leading-6 text-paper/58">
                {getWallpaperMeta(featured)}
              </p>
            ) : null}
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {wallpapers.slice(1, 5).map((wallpaper) => {
            const hasVideo = Boolean(wallpaper.videoUrl);

            return (
              <Link
                key={wallpaper.id}
                className="group grid min-h-[112px] grid-cols-[78px_1fr] gap-3 overflow-hidden rounded-[18px] border border-ink/8 bg-white/54 p-2 shadow-[0_12px_28px_rgba(37,58,62,0.08)] backdrop-blur transition duration-card hover:-translate-y-0.5 hover:bg-white/70 dark:border-paper/10 dark:bg-paper/7 dark:shadow-[0_16px_34px_rgba(0,0,0,0.22)] dark:hover:bg-paper/10"
                href={`/wallpaper/${wallpaper.slug}`}
                onBlur={() => setActivePreviewId(null)}
                onFocus={() => setActivePreviewId(wallpaper.id)}
                onMouseEnter={() => setActivePreviewId(wallpaper.id)}
                onMouseLeave={() => setActivePreviewId(null)}
              >
                <div className="relative overflow-hidden rounded-[14px] bg-ink">
                  <WallpaperCoverImage
                    alt={getWallpaperDisplayTitle(wallpaper)}
                    sources={getWallpaperCoverSources(wallpaper)}
                    gradient="night"
                    imageClassName="brightness-[.95] contrast-[1.02] saturate-[1.06]"
                    sizes="96px"
                    src={getWallpaperPreviewUrl(wallpaper, "medium")}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,111,77,0.24),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.14))]" />
                  {wallpaper.videoUrl ? (
                    <MotionPreviewLayer
                      isActive={activePreviewId === wallpaper.id}
                      videoUrl={wallpaper.videoUrl}
                    />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col justify-between py-1 pr-1">
                  <div>
                    <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-muted">
                      {getWallpaperMeta(wallpaper)}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.18em] text-muted/70">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          hasVideo ? "bg-red/70" : "bg-ink/20",
                        )}
                      />
                      {hasVideo ? "Live loop" : "Cover"}
                    </span>
                    <span className="text-[13px] text-muted transition group-hover:text-red">
                      ↗
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ExploreCatalogLoading({
  categorySlug,
  locale,
}: ExploreCatalogLoadingProps) {
  const category = getExploreCategory(categorySlug);
  const copy = getExploreUiCopy(locale);
  const heading = category
    ? (getExploreCategoryCopy(locale, category.slug)?.label ?? category.label)
    : copy.allDirectory;
  const description = category
    ? (getExploreCategoryCopy(locale, category.slug)?.description ??
      category.description)
    : copy.defaultDescription;

  return (
    <section className="glass-panel-grid relative overflow-hidden px-5 pb-8 pt-24 sm:px-6 md:px-10 md:pb-12 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-red">
          Explore
        </p>
        <div className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <h1 className="font-body text-[clamp(2rem,5vw,3.6rem)] font-semibold leading-tight tracking-normal">
              {heading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <ExploreSummary
            count={0}
            featuredOnly={false}
            locale={locale}
            motionOnly={false}
            page={1}
            pageSize={24}
            sort={DEFAULT_EXPLORE_SORT}
            total={0}
            totalPages={1}
          />
        </div>

        <div className="wallpaper-card-grid mt-8">
          {Array.from({ length: 6 }, (_, index) => (
            <ExploreCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExploreCatalog({
  categorySlug,
  initialResult,
  locale,
}: ExploreCatalogProps) {
  const searchParams = useSearchParams();
  const category = getExploreCategory(categorySlug);
  const copy = getExploreUiCopy(locale);
  const query = searchParams.get("q")?.trim() || "";
  const tagValue = searchParams.get("tag")?.trim() || "";
  const tag = tagValue && tagValue !== copy.allTag ? tagValue : undefined;
  const sort = getExploreSort(searchParams.get("sort") ?? undefined);
  const featuredOnly = isFeaturedFilterEnabled(
    searchParams.get("featured") ?? undefined,
  );
  const motionOnly = isMotionFilterEnabled(
    searchParams.get("motion") ?? undefined,
  );
  const page = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const [result, setResult] = useState<WallpaperListPageResult | null>(
    initialResult ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialResult);
  const [retryNonce, setRetryNonce] = useState(0);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      if (initialResult) return;
    }

    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetch(
      buildExploreApiHref(
        category?.slug,
        {
          q: query || undefined,
          tag,
          sort,
          featured: featuredOnly,
          motion: motionOnly,
          page,
        },
        locale,
      ),
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as ApiErrorResponse | null;
          throw new Error(payload?.error ?? copy.loadingError);
        }

        const payload =
          (await response.json()) as ApiSuccessResponse<WallpaperListPageResult>;
        setResult(payload.data);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error ? fetchError.message : copy.loadingError,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    category?.slug,
    copy.loadingError,
    featuredOnly,
    initialResult,
    locale,
    motionOnly,
    page,
    query,
    retryNonce,
    sort,
    tag,
  ]);

  const wallpapers = result?.wallpapers ?? [];
  const currentPage = result?.page ?? page;
  const count = result?.count ?? wallpapers.length;
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const hasNextPage = result?.hasNextPage ?? currentPage < totalPages;
  const hasPreviousPage = result?.hasPreviousPage ?? currentPage > 1;
  const pageSize = result?.pageSize ?? 24;
  const heading = category
    ? (getExploreCategoryCopy(locale, category.slug)?.label ?? category.label)
    : copy.allDirectory;
  const description = category
    ? (getExploreCategoryCopy(locale, category.slug)?.description ??
      category.description)
    : copy.defaultDescription;

  return (
    <section className="glass-panel-grid relative overflow-hidden px-5 pb-10 pt-24 sm:px-6 md:px-10 md:pb-14 md:pt-28">
      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="mb-3 text-[9px] uppercase tracking-[0.4em] text-red/80">
              Explore
            </p>
            <h1 className="font-body text-[clamp(2rem,5vw,3.8rem)] font-semibold leading-[1.05] tracking-tight text-ink">
              {heading}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-muted">
              {description}
            </p>
          </div>
          <div className="shrink-0 pb-1">
            <ExploreSummary
              count={count}
              featuredOnly={featuredOnly}
              locale={locale}
              motionOnly={motionOnly}
              page={currentPage}
              pageSize={pageSize}
              sort={sort}
              total={total}
              totalPages={totalPages}
            />
          </div>
        </div>

        <form
          action={category ? `/explore/${category.slug}` : "/explore"}
          className="grid overflow-hidden rounded-[16px] border border-ink/8 bg-white/62 shadow-[0_4px_24px_rgba(23,79,80,0.06)] backdrop-blur-sm dark:border-paper/10 dark:bg-paper/6 lg:grid-cols-[1fr_0.6fr_auto]"
          key={`${category?.slug ?? "all"}:${query}:${tag ?? ""}:${sort}:${featuredOnly}:${motionOnly}`}
          method="get"
        >
          <input
            className="min-w-0 bg-transparent px-5 py-3.5 text-[15px] text-ink outline-none placeholder:text-muted/60"
            defaultValue={query}
            name="q"
            placeholder={copy.searchPlaceholder}
            type="text"
          />
          <input
            className="min-w-0 border-l border-ink/8 bg-transparent px-4 py-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink outline-none placeholder:text-muted/55 dark:border-paper/10"
            defaultValue={tag}
            name="tag"
            placeholder={copy.tagPlaceholder}
            type="text"
          />
          <button
            className="m-1.5 rounded-[10px] bg-ink px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-paper transition hover:opacity-90 focus-visible:outline-none dark:bg-paper dark:text-ink"
            type="submit"
          >
            {copy.searchSubmit}
          </button>
          {featuredOnly ? (
            <input name="featured" type="hidden" value="true" />
          ) : null}
          {motionOnly ? (
            <input name="motion" type="hidden" value="true" />
          ) : null}
          {sort !== DEFAULT_EXPLORE_SORT ? (
            <input name="sort" type="hidden" value={sort} />
          ) : null}
        </form>

        {motionOnly && wallpapers.length > 0 ? (
          <MotionSpotlight locale={locale} wallpapers={wallpapers} />
        ) : null}

        {!tag ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[9px] uppercase tracking-[0.32em] text-muted/50">
              {copy.popularTags}
            </span>
            {copy.topicTags.map((topic) => (
              <Link
                key={topic}
                className="glass-chip px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:text-ink"
                href={buildExploreHref(category?.slug, {
                  tag: topic,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
              >
                {topic}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="scrollbar-none -mx-5 mt-5 flex max-w-[100vw] gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:max-w-none md:flex-wrap md:overflow-visible md:px-0">
          <Link
            className={
              category
                ? "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink transition hover:text-red"
                : "glass-chip-active shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
            }
            href={buildExploreHref(undefined, {
              q: query || undefined,
              tag,
              sort,
              featured: featuredOnly,
              motion: motionOnly,
            })}
          >
            {copy.allCategories}
          </Link>
          {EXPLORE_CATEGORIES.map((item) => {
            const isActive = item.slug === category?.slug;

            return (
              <Link
                key={item.slug}
                className={
                  isActive
                    ? "glass-chip-active shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                    : "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-red focus-visible:text-red focus-visible:outline-none"
                }
                href={buildExploreHref(item.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
              >
                {getExploreCategoryCopy(locale, item.slug)?.label ?? item.label}
              </Link>
            );
          })}
        </div>

        <div className="scrollbar-none -mx-5 mt-4 flex max-w-[100vw] gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:max-w-none md:flex-wrap md:overflow-visible md:px-0">
          {EXPLORE_SORT_OPTIONS.map((item) => {
            const isActive = item.value === sort;

            return (
              <Link
                key={item.value}
                className={
                  isActive
                    ? "glass-chip-active shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                    : "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-red focus-visible:text-red focus-visible:outline-none"
                }
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort: item.value,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title={
                  getExploreOptionCopy(locale, "sort", item.value)
                    ?.description ?? item.description
                }
              >
                {getExploreOptionCopy(locale, "sort", item.value)?.label ??
                  item.label}
              </Link>
            );
          })}
          <Link
            className={
              motionOnly
                ? "glass-chip-active shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                : "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-ink"
            }
            href={buildExploreHref(category?.slug, {
              q: query || undefined,
              tag,
              sort,
              featured: featuredOnly,
              motion: !motionOnly,
            })}
          >
            {motionOnly ? copy.motionOn : copy.motionOff}
          </Link>
          <Link
            className={
              featuredOnly
                ? "glass-chip-active shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em]"
                : "glass-chip shrink-0 whitespace-nowrap px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:text-ink"
            }
            href={buildExploreHref(category?.slug, {
              q: query || undefined,
              tag,
              sort,
              featured: !featuredOnly,
              motion: motionOnly,
            })}
          >
            {featuredOnly ? copy.featuredOn : copy.featuredOff}
          </Link>
        </div>

        {query || tag || category || featuredOnly || motionOnly ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted/60">
              {copy.currentFilters}
            </span>
            {query ? (
              <Link
                className="glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:text-red"
                href={buildExploreHref(category?.slug, {
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title={copy.clearKeyword}
              >
                {query}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {tag ? (
              <Link
                className="glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:text-red"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title={copy.clearTag}
              >
                #{tag}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {category ? (
              <Link
                className="glass-chip inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:text-red"
                href={buildExploreHref(undefined, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title={copy.clearCategory}
              >
                {category.label}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {featuredOnly ? (
              <Link
                className="glass-chip-active inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: false,
                  motion: motionOnly,
                })}
                title={copy.clearFeatured}
              >
                {copy.featuredOff}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {motionOnly ? (
              <Link
                className="glass-chip-active inline-flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: false,
                })}
                title={copy.motionOnly}
              >
                Motion
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            <Link
              className="ml-1 text-[9px] uppercase tracking-[0.24em] text-muted/50 underline underline-offset-4 transition hover:text-red"
              href={buildExploreHref(undefined, {})}
            >
              {copy.clearAll}
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="glass-surface mt-10 flex flex-col items-center gap-6 px-6 py-16 text-center">
            <span className="select-none font-mono text-[40px] leading-none text-red/30">
              [!]
            </span>
            <div>
              <p className="font-display text-[22px] italic text-ink/50">
                {copy.errorTitle}
              </p>
              <p className="mt-2 max-w-md text-[11px] uppercase tracking-[0.18em] text-muted/70">
                {error}
              </p>
            </div>
            <button
              className="glass-control px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition"
              onClick={() => {
                setRetryNonce((value) => value + 1);
              }}
              type="button"
            >
              {locale === "zh-CN"
                ? "重新加载"
                : locale === "ja"
                  ? "再読み込み"
                  : locale === "ko"
                    ? "다시 불러오기"
                    : "Reload"}
            </button>
          </div>
        ) : isLoading && !result ? (
          <div className="wallpaper-card-grid mt-10">
            {Array.from({ length: 6 }, (_, index) => (
              <ExploreCardSkeleton key={index} />
            ))}
          </div>
        ) : wallpapers.length > 0 ? (
          <>
            <div
              className={
                isLoading
                  ? "wallpaper-card-grid mt-10 opacity-70 transition-opacity"
                  : "wallpaper-card-grid mt-10 transition-opacity"
              }
            >
              {wallpapers.map((wallpaper, index) => (
                <WallpaperGridCard
                  key={wallpaper.id}
                  aspectRatio={motionOnly ? "aspect-[9/16]" : undefined}
                  imageQuality={motionOnly ? "medium" : "default"}
                  loading={index < 12 ? "eager" : "lazy"}
                  wallpaper={wallpaper}
                />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-14 flex items-center justify-center gap-1.5 border-t border-ink/6 pt-10 dark:border-paper/8">
                <Link
                  aria-disabled={!hasPreviousPage}
                  className={
                    !hasPreviousPage
                      ? "flex h-9 items-center gap-1.5 rounded-full px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/20 dark:text-paper/20"
                      : "flex h-9 items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition hover:border-red/20 hover:text-red dark:border-paper/10 dark:bg-paper/6"
                  }
                  href={buildExploreHref(category?.slug, {
                    q: query || undefined,
                    tag,
                    sort,
                    featured: featuredOnly,
                    motion: motionOnly,
                    page: currentPage - 1,
                  })}
                >
                  ← {copy.previousPage}
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(totalPages, 7) },
                    (_, index) => {
                      const pageNum =
                        totalPages <= 7
                          ? index + 1
                          : currentPage <= 4
                            ? index + 1
                            : currentPage >= totalPages - 3
                              ? totalPages - 6 + index
                              : currentPage - 3 + index;

                      if (pageNum < 1 || pageNum > totalPages) {
                        return null;
                      }

                      return (
                        <Link
                          key={pageNum}
                          className={
                            pageNum === currentPage
                              ? "flex h-9 w-9 items-center justify-center rounded-full bg-ink font-mono text-[11px] text-paper dark:bg-paper dark:text-ink"
                              : "flex h-9 w-9 items-center justify-center rounded-full border border-ink/8 bg-white/55 font-mono text-[11px] text-muted transition hover:border-red/20 hover:text-red dark:border-paper/10 dark:bg-paper/5 focus-visible:outline-none"
                          }
                          href={buildExploreHref(category?.slug, {
                            q: query || undefined,
                            tag,
                            sort,
                            featured: featuredOnly,
                            motion: motionOnly,
                            page: pageNum,
                          })}
                        >
                          {pageNum}
                        </Link>
                      );
                    },
                  )}
                </div>

                <Link
                  aria-disabled={!hasNextPage}
                  className={
                    !hasNextPage
                      ? "flex h-9 items-center gap-1.5 rounded-full px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-ink/20 dark:text-paper/20"
                      : "flex h-9 items-center gap-1.5 rounded-full border border-ink/10 bg-white/60 px-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition hover:border-red/20 hover:text-red dark:border-paper/10 dark:bg-paper/6"
                  }
                  href={buildExploreHref(category?.slug, {
                    q: query || undefined,
                    tag,
                    sort,
                    featured: featuredOnly,
                    motion: motionOnly,
                    page: currentPage + 1,
                  })}
                >
                  {copy.nextPage} →
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="glass-surface mt-10 flex flex-col items-center gap-8 px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-ink/8 bg-ink/4 dark:border-paper/8 dark:bg-paper/4">
              <span className="select-none font-mono text-[22px] leading-none text-ink/20 dark:text-paper/20">
                ∅
              </span>
            </div>
            <div className="max-w-xs space-y-2">
              <p className="font-body text-[18px] font-medium text-ink/55 dark:text-paper/55">
                {copy.emptyTitle}
              </p>
              <p className="text-[12px] leading-6 text-muted/70">
                {copy.emptyBody}
              </p>
            </div>
            <Link
              className="glass-control px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:text-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30"
              href={buildExploreHref(undefined, {})}
            >
              {copy.clearAll}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
