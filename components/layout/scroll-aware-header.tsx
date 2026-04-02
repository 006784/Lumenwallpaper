"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ScrollAwareHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        className,
        "transition-shadow duration-300",
        scrolled
          ? "shadow-[0_2px_32px_rgba(10,8,4,0.13)] border-b-[1.5px] border-ink/20"
          : "shadow-[0_14px_40px_rgba(10,8,4,0.04)]",
      )}
    >
      {children}
    </header>
  );
}
