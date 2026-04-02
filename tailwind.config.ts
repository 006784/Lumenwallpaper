import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0804",
        paper: "#F2EDE4",
        paper2: "#E8E0D2",
        red: "#D42B2B",
        gold: "#F5C842",
        muted: "#8A8070",
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
