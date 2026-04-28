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
      className="glass-control hidden h-10 w-10 items-center justify-center font-mono text-[12px] text-muted/70 transition duration-hover hover:text-ink focus-visible:outline-none sm:flex"
      title={isDark ? "日间模式 ○" : "夜间模式 ●"}
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? "○" : "●"}
    </button>
  );
}
