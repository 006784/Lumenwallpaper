import Link from "next/link";

import { GRADIENTS } from "@/lib/gradients";
import type { CategoryData } from "@/types/home";

type CategoryBlockProps = {
  category: CategoryData;
  expanded: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function CategoryBlock({
  category,
  expanded,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
}: CategoryBlockProps) {
  return (
    <Link
      className="group relative flex min-w-[110px] shrink-0 overflow-hidden p-0 md:min-w-[140px] [transition:flex_550ms_cubic-bezier(0.4,0,0.2,1)]"
      href={category.href}
      onBlur={onBlur}
      onFocus={onFocus}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        flex: expanded ? 2.2 : 1,
        height: "280px",
      }}
    >
      <div
        className="absolute inset-0 transition duration-card ease-out"
        style={{
          backgroundImage: GRADIENTS[category.gradient],
          filter: expanded
            ? "saturate(1) brightness(.75)"
            : "saturate(.7) brightness(.55)",
          transform: expanded ? "scale(1.08)" : "scale(1.01)",
        }}
      />

      <div className="absolute inset-x-0 top-4 text-center font-mono text-[28px] text-paper/25 transition group-hover:text-paper/60">
        {category.count}
      </div>

      <div className="absolute inset-0 flex items-end px-4 py-4">
        <span
          className="font-mono text-[15px] uppercase text-paper transition-[letter-spacing]"
          style={{
            letterSpacing: expanded ? "0.4em" : "0.24em",
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            transform: "rotate(180deg)",
          }}
        >
          {category.label}
        </span>
      </div>

      <div className="glass-control absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center text-xs opacity-0 transition group-hover:opacity-100">
        ↗
      </div>
    </Link>
  );
}
