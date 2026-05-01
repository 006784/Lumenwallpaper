import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/darkroom", "/wallpaper/", "/creator/"],
      disallow: ["/api/", "/library", "/creator/studio", "/login", "/verify"],
    },
    sitemap: getSiteUrl("/sitemap.xml"),
  };
}
