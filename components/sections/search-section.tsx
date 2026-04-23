"use client";

import Link from "next/link";
import { useRef } from "react";

import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import { searchTags } from "@/lib/data/home";
import { EXPLORE_CATEGORIES, EXPLORE_SORT_OPTIONS } from "@/lib/explore";

export function SearchSection() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleTagClick(tag: string) {
    if (inputRef.current) {
      inputRef.current.value = tag === "全部" ? "" : tag;
    }
  }

  return (
    <section className="border-b border-ink/10 px-4 py-14 md:px-10 md:py-20">
      <Reveal className="mx-auto grid max-w-[1500px] gap-8 lg:grid-cols-[0.76fr_1.24fr]">
        <div className="space-y-5">
          <p className="text-[11px] uppercase text-red">Discovery console</p>
          <h2 className="max-w-xl font-body text-[clamp(2rem,5vw,4.4rem)] font-semibold leading-[1.02]">
            把“随便看看”变成可控筛选。
          </h2>
          <p className="max-w-lg text-sm leading-7 text-muted md:text-base">
            关键词、分类、排序和精选状态都已经接到探索页。先从这里输入意图，再进入完整目录继续缩小范围。
          </p>
        </div>

        <div className="bg-paper/78 border border-ink p-3 shadow-[10px_10px_0_0_rgba(10,8,4,0.06)] dark:bg-paper2 dark:shadow-none">
          <form
            action="/explore"
            className="grid gap-3 md:grid-cols-[1fr_auto]"
            method="get"
          >
            <label className="sr-only" htmlFor="discovery-search">
              描述你想要的画面
            </label>
            <input
              ref={inputRef}
              id="discovery-search"
              className="min-h-[58px] min-w-0 border border-ink/10 bg-paper px-4 text-base outline-none transition placeholder:text-muted/70 focus:border-ink dark:bg-paper/5"
              name="q"
              placeholder="例如：安静的森林、深色办公桌面、蓝色极简..."
              type="search"
            />
            <button
              className="min-h-[58px] border border-ink bg-ink px-6 text-[12px] uppercase text-paper transition hover:bg-red focus-visible:bg-red"
              type="submit"
            >
              搜索目录
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {searchTags.map((tag) => (
              <Link
                key={tag}
                className={cn(
                  "border border-ink/20 px-3 py-2 text-[11px] uppercase text-muted transition hover:border-ink hover:bg-ink hover:text-paper focus-visible:bg-ink focus-visible:text-paper",
                  tag === "全部"
                    ? "bg-transparent text-ink"
                    : "bg-transparent text-ink",
                )}
                href={
                  tag === "全部"
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
            <div className="border border-ink/10 bg-paper/60 p-4 dark:bg-paper/5">
              <p className="text-[10px] uppercase text-muted">分类</p>
              <div className="mt-3 grid gap-2">
                {EXPLORE_CATEGORIES.slice(0, 4).map((category) => (
                  <Link
                    key={category.slug}
                    className="flex items-center justify-between text-sm text-ink transition hover:text-red"
                    href={category.href}
                  >
                    {category.label}
                    <span aria-hidden>+</span>
                  </Link>
                ))}
              </div>
            </div>

            {EXPLORE_SORT_OPTIONS.map((option) => (
              <Link
                key={option.value}
                className="border border-ink/10 bg-paper/60 p-4 transition hover:border-ink hover:bg-ink hover:text-paper dark:bg-paper/5"
                href={`/explore?sort=${option.value}`}
                title={option.description}
              >
                <span className="text-[10px] uppercase text-muted">排序</span>
                <span className="mt-3 block text-lg font-semibold">
                  {option.label}
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted">
                  {option.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
