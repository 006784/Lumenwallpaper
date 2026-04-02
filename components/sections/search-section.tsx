"use client";

import { useState } from "react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { searchTags } from "@/lib/data/home";

export function SearchSection() {
  const [activeTag, setActiveTag] = useState("全部");

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
          <form action="/explore" className="mb-6 flex overflow-hidden border-frame border-ink">
            <input
              className="w-full border-0 bg-transparent px-5 py-4 font-display text-[22px] italic outline-none placeholder:text-muted"
              name="q"
              placeholder="描述你想要的画面…"
              type="text"
            />
            <button className="border-l-frame border-ink bg-ink px-6 font-mono text-[14px] tracking-[0.2em] text-paper transition hover:bg-red">
              搜索
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {searchTags.map((tag) => (
              <button
                key={tag}
                className={cn(
                  "border-frame border-ink px-4 py-2 text-[10px] uppercase tracking-[0.2em] transition",
                  activeTag === tag
                    ? "bg-ink text-paper"
                    : "bg-transparent text-ink hover:bg-ink hover:text-paper",
                )}
                onClick={() => setActiveTag(tag)}
                type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
