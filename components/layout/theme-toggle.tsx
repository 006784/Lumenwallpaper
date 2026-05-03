"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/components/layout/theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Prevent hydration mismatch — render nothing until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div aria-hidden className="hidden h-9 w-9 sm:block" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      aria-label={isDark ? "切换到日间模式" : "切换到夜间模式"}
      className="glass-control group hidden h-10 w-10 items-center justify-center text-muted/80 transition duration-hover hover:text-ink focus-visible:outline-none sm:flex"
      title={isDark ? "日间模式" : "夜间模式"}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="relative h-4 w-4 rounded-full border border-current/40 transition group-hover:border-current">
        <span
          className={
            isDark
              ? "absolute -right-1 -top-1 h-4 w-4 rounded-full bg-paper transition"
              : "absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current shadow-[0_0_12px_rgba(255,109,45,0.5)] transition"
          }
        />
      </span>
    </button>
  );
}
