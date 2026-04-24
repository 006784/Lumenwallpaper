"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { WallpaperListPageResult } from "@/types/wallpaper";
import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_CATEGORIES,
  EXPLORE_SORT_OPTIONS,
  getExploreCategory,
  getExploreSort,
  isFeaturedFilterEnabled,
  isMotionFilterEnabled,
} from "@/lib/explore";

type ExploreCatalogProps = {
  categorySlug?: string;
};

type ExploreCatalogLoadingProps = {
  categorySlug?: string;
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
) {
  const params = new URLSearchParams();
  params.set("withMeta", "true");
  params.set("page", String(nextValues.page && nextValues.page > 0 ? nextValues.page : 1));

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
  motionOnly,
  page,
  pageSize,
  sort,
  total,
  totalPages,
}: {
  count: number;
  featuredOnly: boolean;
  motionOnly: boolean;
  page: number;
  pageSize: number;
  sort: string;
  total: number;
  totalPages: number;
}) {
  return (
    <div className="grid gap-2 border border-ink/10 bg-paper/70 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-muted sm:max-w-[18rem]">
      <span>
        共 {total} 件 · 第 {page}/{totalPages} 页
      </span>
      <span>
        本页 {count} 件 · 每页 {pageSize} 件
      </span>
      <span>
        排序 {EXPLORE_SORT_OPTIONS.find((item) => item.value === sort)?.label}
      </span>
      <span>{featuredOnly ? "仅看精选" : "全目录"}</span>
      <span>{motionOnly ? "动态壁纸" : "静态与动态混合"}</span>
    </div>
  );
}

function ExploreCardSkeleton() {
  return (
    <div className="overflow-hidden border-frame border-ink bg-paper">
      <div className="aspect-[4/5] animate-pulse border-b-frame border-ink bg-ink/5" />
      <div className="space-y-3 px-3.5 py-3.5 sm:px-4 sm:py-4">
        <div className="h-5 animate-pulse bg-ink/5" />
        <div className="h-3 w-1/2 animate-pulse bg-ink/5" />
        <div className="flex gap-2">
          <span className="h-6 w-16 animate-pulse border border-ink/10 bg-ink/5" />
          <span className="h-6 w-12 animate-pulse border border-ink/10 bg-ink/5" />
        </div>
      </div>
    </div>
  );
}

export function ExploreCatalogLoading({
  categorySlug,
}: ExploreCatalogLoadingProps) {
  const category = getExploreCategory(categorySlug);
  const heading = category ? category.label : "探索整本目录";
  const description = category
    ? category.description
    : "按关键词、标签、分类、动态壁纸和热度筛选壁纸目录。结果优先读取真实数据，并兼容 AI 标签与人工标签。";

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-5 py-8 sm:px-6 md:px-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(245,200,66,0.12),transparent_18%),radial-gradient(circle_at_88%_14%,rgba(212,43,43,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.14),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-red">
          Explore
        </p>
        <div className="flex flex-col gap-5 border-b border-ink/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <h1 className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-tight tracking-normal">
              {heading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <ExploreSummary
            count={0}
            featuredOnly={false}
            motionOnly={false}
            page={1}
            pageSize={24}
            sort={DEFAULT_EXPLORE_SORT}
            total={0}
            totalPages={1}
          />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <ExploreCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExploreCatalog({ categorySlug }: ExploreCatalogProps) {
  const searchParams = useSearchParams();
  const category = getExploreCategory(categorySlug);
  const query = searchParams.get("q")?.trim() || "";
  const tagValue = searchParams.get("tag")?.trim() || "";
  const tag = tagValue && tagValue !== "全部" ? tagValue : undefined;
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
  const [result, setResult] = useState<WallpaperListPageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    fetch(
      buildExploreApiHref(category?.slug, {
        q: query || undefined,
        tag,
        sort,
        featured: featuredOnly,
        motion: motionOnly,
        page,
      }),
      {
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response
            .json()
            .catch(() => null)) as ApiErrorResponse | null;
          throw new Error(payload?.error ?? "探索目录加载失败。");
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
          fetchError instanceof Error
            ? fetchError.message
            : "探索目录加载失败。",
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
  }, [category?.slug, featuredOnly, motionOnly, page, query, retryNonce, sort, tag]);

  const wallpapers = result?.wallpapers ?? [];
  const currentPage = result?.page ?? page;
  const count = result?.count ?? wallpapers.length;
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const hasNextPage = result?.hasNextPage ?? currentPage < totalPages;
  const hasPreviousPage = result?.hasPreviousPage ?? currentPage > 1;
  const pageSize = result?.pageSize ?? 24;
  const heading = category ? category.label : "探索整本目录";
  const description = category
    ? category.description
    : "按关键词、标签、分类、动态壁纸和热度筛选壁纸目录。结果优先读取真实数据，并兼容 AI 标签与人工标签。";

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-5 py-8 sm:px-6 md:px-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(245,200,66,0.12),transparent_18%),radial-gradient(circle_at_88%_14%,rgba(212,43,43,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.14),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-3 text-[10px] uppercase tracking-[0.35em] text-red">
          Explore
        </p>
        <div className="flex flex-col gap-5 border-b border-ink/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <h1 className="font-display text-[clamp(2rem,5vw,3.6rem)] leading-tight tracking-normal">
              {heading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          </div>
          <ExploreSummary
            count={count}
            featuredOnly={featuredOnly}
            motionOnly={motionOnly}
            page={currentPage}
            pageSize={pageSize}
            sort={sort}
            total={total}
            totalPages={totalPages}
          />
        </div>

        <form
          action={category ? `/explore/${category.slug}` : "/explore"}
          className="bg-paper/78 mt-6 grid gap-3 border-frame border-ink p-3 lg:grid-cols-[1.2fr_0.8fr_auto]"
          key={`${category?.slug ?? "all"}:${query}:${tag ?? ""}:${sort}:${featuredOnly}:${motionOnly}`}
          method="get"
        >
          <input
            className="min-w-0 border border-ink/10 bg-transparent px-4 py-3 font-display text-[20px] italic outline-none placeholder:text-muted transition focus:border-ink focus:bg-paper/60"
            defaultValue={query}
            name="q"
            placeholder="搜索标题、描述、AI 标签或创作者…"
            type="text"
          />
          <input
            className="min-w-0 border border-ink/10 bg-transparent px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] outline-none placeholder:text-muted transition focus:border-ink focus:bg-paper/60"
            defaultValue={tag}
            name="tag"
            placeholder="标签，如 自然 / 赛博 / 晨雾"
            type="text"
          />
          <button
            className="border border-ink bg-ink px-5 py-3 font-mono text-[12px] uppercase tracking-[0.22em] text-paper transition hover:bg-red focus-visible:outline-none focus-visible:bg-red"
            type="submit"
          >
            搜索目录
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

        {!tag ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="shrink-0 text-[9px] uppercase tracking-[0.32em] text-muted/50">
              热门标签
            </span>
            {[
              "户外",
              "自然风景",
              "海边",
              "蓝天",
              "夏日",
              "唯美",
              "清新",
              "人像",
              "城市",
              "极简",
              "暗夜",
              "宇宙",
              "霓虹",
              "渐变",
              "像素",
            ].map((topic) => (
              <Link
                key={topic}
                className="border border-ink/10 bg-paper/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-muted transition hover:border-ink hover:text-ink"
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

        <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          <Link
            className={
              category
                ? "border-frame border-ink bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink transition hover:bg-ink hover:text-paper"
                : "border-frame border-ink bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-paper"
            }
            href={buildExploreHref(undefined, {
              q: query || undefined,
              tag,
              sort,
              featured: featuredOnly,
              motion: motionOnly,
            })}
          >
            全部分类
          </Link>
          {EXPLORE_CATEGORIES.map((item) => {
            const isActive = item.slug === category?.slug;

            return (
              <Link
                key={item.slug}
                className={
                  isActive
                    ? "border-frame border-ink bg-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-paper"
                    : "border-frame border-ink bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-ink transition hover:bg-ink hover:text-paper"
                }
                href={buildExploreHref(item.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
          {EXPLORE_SORT_OPTIONS.map((item) => {
            const isActive = item.value === sort;

            return (
              <Link
                key={item.value}
                className={
                  isActive
                    ? "border border-gold/20 bg-gold/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold"
                    : "border border-ink/10 bg-paper/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:border-ink hover:text-ink"
                }
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort: item.value,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title={item.description}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            className={
              motionOnly
                ? "border border-gold/20 bg-gold/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-gold"
                : "border border-ink/10 bg-paper/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:border-ink hover:text-ink"
            }
            href={buildExploreHref(category?.slug, {
              q: query || undefined,
              tag,
              sort,
              featured: featuredOnly,
              motion: !motionOnly,
            })}
          >
            {motionOnly ? "Motion 开启" : "仅看 Motion"}
          </Link>
          <Link
            className={
              featuredOnly
                ? "border border-red/20 bg-red/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-red"
                : "border border-ink/10 bg-paper/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-muted transition hover:border-ink hover:text-ink"
            }
            href={buildExploreHref(category?.slug, {
              q: query || undefined,
              tag,
              sort,
              featured: !featuredOnly,
              motion: motionOnly,
            })}
          >
            {featuredOnly ? "精选开启" : "仅看精选"}
          </Link>
        </div>

        {query || tag || category || featuredOnly || motionOnly ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted/60">
              当前筛选
            </span>
            {query ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(category?.slug, {
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title="清除关键词"
              >
                {query}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {tag ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title="清除标签"
              >
                #{tag}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {category ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(undefined, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: motionOnly,
                })}
                title="清除分类"
              >
                {category.label}
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {featuredOnly ? (
              <Link
                className="inline-flex items-center gap-2 border border-red/20 bg-red/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-red transition hover:bg-red/10"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: false,
                  motion: motionOnly,
                })}
                title="取消精选过滤"
              >
                精选
                <span aria-hidden className="text-[8px] opacity-50">
                  ✕
                </span>
              </Link>
            ) : null}
            {motionOnly ? (
              <Link
                className="inline-flex items-center gap-2 border border-gold/20 bg-gold/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-gold transition hover:bg-gold/10"
                href={buildExploreHref(category?.slug, {
                  q: query || undefined,
                  tag,
                  sort,
                  featured: featuredOnly,
                  motion: false,
                })}
                title="取消动态壁纸过滤"
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
              清空全部
            </Link>
          </div>
        ) : null}

        {error ? (
          <div className="mt-10 flex flex-col items-center gap-6 border-frame border-ink px-6 py-16 text-center">
            <span className="select-none font-mono text-[40px] leading-none text-red/30">
              [!]
            </span>
            <div>
              <p className="font-display text-[22px] italic text-ink/50">
                探索目录暂时失联
              </p>
              <p className="mt-2 max-w-md text-[11px] uppercase tracking-[0.18em] text-muted/70">
                {error}
              </p>
            </div>
            <button
              className="border-frame border-ink px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
              onClick={() => {
                setRetryNonce((value) => value + 1);
              }}
              type="button"
            >
              重新加载
            </button>
          </div>
        ) : isLoading && !result ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <ExploreCardSkeleton key={index} />
            ))}
          </div>
        ) : wallpapers.length > 0 ? (
          <>
            <div
              className={
                isLoading
                  ? "mt-10 grid gap-4 opacity-70 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
                  : "mt-10 grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3"
              }
            >
              {wallpapers.map((wallpaper) => (
                <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-between border-t border-ink/10 pt-8">
                <Link
                  aria-disabled={page <= 1}
                  className={
                    !hasPreviousPage
                      ? "pointer-events-none border border-ink/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/25"
                      : "border-frame border-ink px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
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
                  ← 上一页
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, index) => {
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
                            ? "flex h-9 w-9 items-center justify-center border-frame border-ink bg-ink font-mono text-[10px] text-paper"
                            : "flex h-9 w-9 items-center justify-center border border-ink/10 font-mono text-[10px] text-muted transition hover:border-ink hover:text-ink"
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
                  })}
                </div>

                <Link
                  aria-disabled={!hasNextPage}
                  className={
                    !hasNextPage
                      ? "pointer-events-none border border-ink/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink/25"
                      : "border-frame border-ink px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
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
                  下一页 →
                </Link>
              </div>
            ) : null}
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-6 border-frame border-ink px-6 py-16 text-center">
            <span className="select-none font-mono text-[40px] leading-none text-ink/10">
              [ ]
            </span>
            <div>
              <p className="font-display text-[22px] italic text-ink/40">
                没有命中的作品
              </p>
              <p className="mt-2 max-w-sm text-[11px] uppercase tracking-[0.18em] text-muted/60">
                换一个关键词或清空筛选条件
              </p>
            </div>
            <Link
              className="border-frame border-ink px-5 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-ink transition hover:bg-ink hover:text-paper"
              href={buildExploreHref(undefined, {})}
            >
              清空筛选
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
