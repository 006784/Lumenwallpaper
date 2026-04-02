"use client";

import { useDragScroll } from "@/hooks/use-drag-scroll";
import { cn } from "@/lib/utils";

type DraggableStripProps = {
  children: React.ReactNode;
  className?: string;
  trackClassName?: string;
};

export function DraggableStrip({
  children,
  className,
  trackClassName,
}: DraggableStripProps) {
  const ref = useDragScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn(
        "scrollbar-none cursor-grab overflow-x-auto overflow-y-visible",
        className,
      )}
    >
      <div className={trackClassName}>{children}</div>
    </div>
  );
}
