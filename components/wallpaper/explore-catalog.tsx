import Link from "next/link";

import {
  DEFAULT_EXPLORE_SORT,
  EXPLORE_CATEGORIES,
  EXPLORE_SORT_OPTIONS,
  getExploreCategory,
  getExploreSort,
  isFeaturedFilterEnabled,
} from "@/lib/explore";
import { getCachedPublishedWallpapers } from "@/lib/public-wallpaper-cache";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";

type ExploreCatalogProps = {
  categorySlug?: string;
  searchParams?: {
    featured?: string;
    q?: string;
    sort?: string;
    tag?: string;
  };
};

function buildExploreHref(
  categorySlug: string | undefined,
  nextValues: {
    featured?: boolean;
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

  const pathname = categorySlug ? `/explore/${categorySlug}` : "/explore";
  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}

export async function ExploreCatalog({
  categorySlug,
  searchParams,
}: ExploreCatalogProps) {
  const category = getExploreCategory(categorySlug);
  const query = searchParams?.q?.trim() || "";
  const tag =
    searchParams?.tag && searchParams.tag !== "全部"
      ? searchParams.tag.trim()
      : undefined;
  const sort = getExploreSort(searchParams?.sort);
  const featuredOnly = isFeaturedFilterEnabled(searchParams?.featured);
  const wallpapers = await getCachedPublishedWallpapers({
    limit: 72,
    search: query || undefined,
    tag,
    category: category?.slug,
    featured: featuredOnly ? true : undefined,
    sort,
  });

  const heading = category ? category.label : "探索整本目录";
  const description = category
    ? category.description
    : "按关键词、标签、分类和热度筛选壁纸目录。结果优先读取真实数据，并兼容 AI 标签与人工标签。";

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(245,200,66,0.12),transparent_18%),radial-gradient(circle_at_88%_14%,rgba(212,43,43,0.08),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.14),transparent_40%)]" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Explore
        </p>
        <div className="flex flex-col gap-6 border-b border-ink/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-4xl">
            <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.94] tracking-[-0.05em]">
              {heading}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
              {description}
            </p>
          </div>
          <div className="grid min-w-[220px] gap-2 border border-ink/10 bg-paper/70 px-4 py-4 text-[10px] uppercase tracking-[0.2em] text-muted">
            <span>结果 {wallpapers.length}</span>
            <span>
              排序{" "}
              {EXPLORE_SORT_OPTIONS.find((item) => item.value === sort)?.label}
            </span>
            <span>{featuredOnly ? "仅看精选" : "全目录"}</span>
          </div>
        </div>

        <form
          action={category ? `/explore/${category.slug}` : "/explore"}
          className="bg-paper/78 mt-10 grid gap-4 border-frame border-ink p-4 md:grid-cols-[1.2fr_0.8fr_auto]"
          method="get"
        >
          <input
            className="min-w-0 border border-ink/10 bg-transparent px-5 py-4 font-display text-[22px] italic outline-none placeholder:text-muted transition focus:border-ink focus:bg-paper/60"
            defaultValue={query}
            name="q"
            placeholder="搜索标题、描述、AI 标签或创作者…"
            type="text"
          />
          <input
            className="min-w-0 border border-ink/10 bg-transparent px-5 py-4 font-mono text-[11px] uppercase tracking-[0.2em] outline-none placeholder:text-muted transition focus:border-ink focus:bg-paper/60"
            defaultValue={tag}
            name="tag"
            placeholder="标签，如 自然 / 赛博 / 晨雾"
            type="text"
          />
          <button
            className="border border-ink bg-ink px-6 py-4 font-mono text-[12px] uppercase tracking-[0.22em] text-paper transition hover:bg-red focus-visible:outline-none focus-visible:bg-red"
            type="submit"
          >
            搜索目录
          </button>
          {featuredOnly ? (
            <input name="featured" type="hidden" value="true" />
          ) : null}
          {sort !== DEFAULT_EXPLORE_SORT ? (
            <input name="sort" type="hidden" value={sort} />
          ) : null}
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
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
                })}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
                })}
                title={item.description}
              >
                {item.label}
              </Link>
            );
          })}
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
            })}
          >
            {featuredOnly ? "精选开启" : "仅看精选"}
          </Link>
        </div>

        {(query || tag || category || featuredOnly) ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted/60">当前筛选</span>
            {query ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(category?.slug, { tag, sort, featured: featuredOnly })}
                title="清除关键词"
              >
                {query}
                <span aria-hidden className="text-[8px] opacity-50">✕</span>
              </Link>
            ) : null}
            {tag ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(category?.slug, { q: query || undefined, sort, featured: featuredOnly })}
                title="清除标签"
              >
                #{tag}
                <span aria-hidden className="text-[8px] opacity-50">✕</span>
              </Link>
            ) : null}
            {category ? (
              <Link
                className="inline-flex items-center gap-2 border border-ink/20 bg-paper/60 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-ink transition hover:border-red hover:text-red"
                href={buildExploreHref(undefined, { q: query || undefined, tag, sort, featured: featuredOnly })}
                title="清除分类"
              >
                {category.label}
                <span aria-hidden className="text-[8px] opacity-50">✕</span>
              </Link>
            ) : null}
            {featuredOnly ? (
              <Link
                className="inline-flex items-center gap-2 border border-red/20 bg-red/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-red transition hover:bg-red/10"
                href={buildExploreHref(category?.slug, { q: query || undefined, tag, sort, featured: false })}
                title="取消精选过滤"
              >
                精选
                <span aria-hidden className="text-[8px] opacity-50">✕</span>
              </Link>
            ) : null}
            {(query || tag || category || featuredOnly) ? (
              <Link
                className="ml-1 text-[9px] uppercase tracking-[0.24em] text-muted/50 underline underline-offset-4 transition hover:text-red"
                href={buildExploreHref(undefined, {})}
              >
                清空全部
              </Link>
            ) : null}
          </div>
        ) : null}

        {wallpapers.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {wallpapers.map((wallpaper) => (
              <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-6 border-frame border-ink px-6 py-16 text-center">
            <span className="font-mono text-[40px] leading-none text-ink/10 select-none">[ ]</span>
            <div>
              <p className="font-display text-[22px] italic text-ink/40">没有命中的作品</p>
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
