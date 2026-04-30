"use client";

import Link from "next/link";
import { useRef } from "react";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { getLocalizedSearchTags } from "@/lib/data/home";
import { EXPLORE_CATEGORIES, EXPLORE_SORT_OPTIONS } from "@/lib/explore";
import { getExploreCategoryCopy, getExploreOptionCopy } from "@/lib/i18n";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { SupportedLocale } from "@/types/i18n";

type SearchSectionProps = {
  locale: SupportedLocale;
};

export function SearchSection({ locale }: SearchSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = getHomeUiCopy(locale);
  const searchTags = getLocalizedSearchTags(locale);

  function handleTagClick(tag: string) {
    if (inputRef.current) {
      inputRef.current.value = tag === copy.search.allTag ? "" : tag;
    }
  }

  return (
    <section className="px-4 py-14 md:px-10 md:py-20">
      <Reveal className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase text-red">
            {copy.search.eyebrow}
          </p>
          <h2 className="max-w-xl font-body text-[clamp(2rem,5vw,4.4rem)] font-semibold leading-[1.02]">
            {copy.search.title}
          </h2>
          <p className="max-w-lg text-sm leading-7 text-muted md:text-base">
            {copy.search.body}
          </p>
        </div>

        <div className="glass-surface p-3">
          <form
            action="/explore"
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            method="get"
          >
            <label className="sr-only" htmlFor="discovery-search">
              {copy.search.inputLabel}
            </label>
            <input
              ref={inputRef}
              id="discovery-search"
              className="glass-field min-h-[58px] min-w-0 px-4 text-base outline-none transition placeholder:text-muted/70"
              name="q"
              placeholder={copy.search.placeholder}
              type="search"
            />
            <button
              className="glass-primary min-h-[58px] px-6 text-[12px] uppercase"
              type="submit"
            >
              {copy.search.submit}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {searchTags.map((tag) => (
              <Link
                key={tag}
                className={cn(
                  "glass-chip px-3 py-2 text-[11px] uppercase text-muted transition hover:text-ink",
                  tag === "全部"
                    ? "bg-transparent text-ink"
                    : "bg-transparent text-ink",
                )}
                href={
                  tag === copy.search.allTag
                    ? "/explore"
                    : `/explore?q=${encodeURIComponent(tag)}`
                }
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="glass-surface-soft p-4">
              <p className="text-[10px] uppercase text-muted">
                {copy.search.categoryTitle}
              </p>
              <div className="mt-3 grid gap-2">
                {EXPLORE_CATEGORIES.slice(0, 4).map((category) => (
                  <Link
                    key={category.slug}
                    className="flex items-center justify-between text-sm text-ink transition hover:text-red"
                    href={category.href}
                  >
                    {getExploreCategoryCopy(locale, category.slug)?.label ??
                      category.label}
                    <span aria-hidden>+</span>
                  </Link>
                ))}
              </div>
            </div>

            {EXPLORE_SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                className="glass-surface-soft p-4 transition hover:-translate-y-0.5"
                href={`/explore?sort=${option.value}`}
                title={
                  getExploreOptionCopy(locale, "sort", option.value)
                    ?.description ?? option.description
                }
              >
                <span className="text-[10px] uppercase text-muted">
                  {copy.search.sortTitle}
                </span>
                <span className="mt-3 block text-lg font-semibold">
                  {getExploreOptionCopy(locale, "sort", option.value)?.label ??
                    option.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted">
                  {getExploreOptionCopy(locale, "sort", option.value)
                    ?.description ?? option.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
