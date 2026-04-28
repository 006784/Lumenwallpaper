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
          ? "shadow-[0_18px_48px_rgba(37,58,62,0.14)]"
          : "shadow-none",
      )}
    >
      {children}
    </header>
  );
}
