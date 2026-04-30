"use client";

import { useState } from "react";

import { useDragScroll } from "@/hooks/use-drag-scroll";
import { getLocalizedCategories } from "@/lib/data/home";
import { CategoryBlock } from "@/components/wallpaper/category-block";
import type { SupportedLocale } from "@/types/i18n";

type CategoryStripProps = {
  locale: SupportedLocale;
};

export function CategoryStrip({ locale }: CategoryStripProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(2);
  const ref = useDragScroll<HTMLDivElement>();
  const categories = getLocalizedCategories(locale);

  return (
    <section
      ref={ref}
      className="scrollbar-none cursor-grab overflow-x-auto px-4 py-4 md:px-10"
    >
      <div className="glass-surface flex w-max min-w-full overflow-hidden">
        {categories.map((category, index) => (
          <CategoryBlock
            key={category.label}
            category={category}
            expanded={activeIndex === index}
            onBlur={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        ))}
      </div>
    </section>
  );
}
