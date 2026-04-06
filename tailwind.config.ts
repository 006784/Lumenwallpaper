import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS-variable driven — light/dark values defined in globals.css
        ink: "rgb(var(--color-ink-rgb) / <alpha-value>)",
        paper: "rgb(var(--color-paper-rgb) / <alpha-value>)",
        paper2: "rgb(var(--color-paper-2-rgb) / <alpha-value>)",
        red: "rgb(var(--color-red-rgb) / <alpha-value>)",
        gold: "rgb(var(--color-gold-rgb) / <alpha-value>)",
        muted: "rgb(var(--color-muted-rgb) / <alpha-value>)",
      },
      fontFamily: {
        body: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "sans-serif"],
      },
      spacing: {
        nav: "56px",
        section: "80px",
        "card-sm": "13px",
      },
      borderWidth: {
        frame: "1.5px",
      },
      transitionDuration: {
        film: "550ms",
        card: "700ms",
        info: "420ms",
        hover: "200ms",
      },
      boxShadow: {
        paper: "0 24px 60px rgba(10, 8, 4, 0.18)",
      },
      backgroundImage: {
        "paper-fade":
          "linear-gradient(180deg, rgba(242,237,228,0.9) 0%, rgba(242,237,228,0.2) 100%)",
        "dark-fade":
          "linear-gradient(180deg, rgba(10,8,4,0) 0%, rgba(10,8,4,0.85) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
