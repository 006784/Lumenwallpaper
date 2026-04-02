"use client";

import Link from "next/link";
import { useRef } from "react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { searchTags } from "@/lib/data/home";

export function SearchSection() {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleTagClick(tag: string) {
    if (inputRef.current) {
      inputRef.current.value = tag === "全部" ? "" : tag;
    }
  }

  return (
    <section className="border-b-frame border-ink px-4 py-14 md:px-10 md:py-section">
      <Reveal className="flex flex-col gap-8 md:flex-row md:items-start md:gap-16">
        <div className="md:w-[280px] md:shrink-0">
          <SectionHeading
            eyebrow="02 — 发现"
            title={
              <>
                找到你的<em className="not-italic italic text-red">那一帧</em>
              </>
            }
          />
        </div>

        <div className="flex-1">
          <form action="/explore" className="mb-6 flex overflow-hidden border-frame border-ink" method="get">
            <input
              ref={inputRef}
              className="w-full border-0 bg-transparent px-5 py-4 font-display text-[22px] italic outline-none placeholder:text-muted focus:bg-paper/40"
              name="q"
              placeholder="描述你想要的画面…"
              type="text"
            />
            <button
              className="shrink-0 border-l-frame border-ink bg-ink px-6 font-mono text-[14px] tracking-[0.2em] text-paper transition hover:bg-red focus-visible:outline-none focus-visible:bg-red"
              type="submit"
            >
              搜索
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {searchTags.map((tag) => (
              <Link
                key={tag}
                className={cn(
                  "border-frame border-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:bg-ink focus-visible:text-paper",
                  tag === "全部" ? "bg-transparent text-ink" : "bg-transparent text-ink",
                )}
                href={tag === "全部" ? "/explore" : `/explore?q=${encodeURIComponent(tag)}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
