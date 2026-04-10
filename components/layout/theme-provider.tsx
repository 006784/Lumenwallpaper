"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
}>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

function resolveTheme(t: Theme): "light" | "dark" {
  if (t === "dark") return "dark";
  if (t === "light") return "light";
  if (typeof window !== "undefined") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  function applyTheme(t: Theme) {
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("lumen-theme", t);
    applyTheme(t);
  }

  useEffect(() => {
    const stored = (localStorage.getItem("lumen-theme") as Theme | null) ?? "system";
    setThemeState(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const current = (localStorage.getItem("lumen-theme") as Theme | null) ?? "system";
      if (current === "system") applyTheme("system");
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onSystemChange);
      return () => mq.removeEventListener("change", onSystemChange);
    }

    mq.addListener(onSystemChange);
    return () => mq.removeListener(onSystemChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
