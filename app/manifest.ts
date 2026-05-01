import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT } from "@/lib/theme";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lumen",
    short_name: "Lumen",
    description:
      "Film-inspired wallpaper discovery, curation, and download for desktop and mobile screens.",
    start_url: getSiteUrl("/"),
    scope: getSiteUrl("/"),
    display: "standalone",
    background_color: THEME_COLOR_LIGHT,
    theme_color: THEME_COLOR_DARK,
    categories: ["photo", "personalization", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/svg+xml",
      },
    ],
  };
}
