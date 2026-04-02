import Link from "next/link";

import { GRADIENTS } from "@/lib/gradients";
import { cn } from "@/lib/utils";
import type { DarkroomItem } from "@/types/home";

type DarkroomCardProps = {
  item: DarkroomItem;
};

export function DarkroomCard({ item }: DarkroomCardProps) {
  return (
    <Link
      className="group relative block h-full overflow-hidden"
      href={item.href}
    >
      <div
        className="absolute inset-0 transition duration-card ease-out group-hover:scale-[1.05]"
        style={{
          backgroundImage: GRADIENTS[item.gradient],
          filter: "brightness(.72) saturate(.82)",
        }}
      />

      {item.badge ? (
        <span className="absolute left-3 top-3 z-10 bg-gold px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink">
          {item.badge}
        </span>
      ) : null}

      {/* 渐变蒙版 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 transition duration-hover group-hover:opacity-100" />

      {/* 右上角箭头 */}
      <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-paper/20 text-xs text-paper/50 opacity-0 transition duration-hover group-hover:opacity-100 group-hover:border-paper/50 group-hover:text-paper">
        ↗
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-10">
        <p
          className={cn(
            "font-display italic text-paper transition-[letter-spacing] duration-300",
            item.featured
              ? "text-[24px] group-hover:tracking-[0.01em]"
              : "text-[18px] group-hover:tracking-[0.005em]",
          )}
        >
          {item.title}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-paper/60">
          {item.meta}
        </p>
        {item.aiTags && item.aiTags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {item.aiTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="border border-paper/20 px-1.5 py-0.5 text-[7px] uppercase tracking-[0.2em] text-paper/45"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
