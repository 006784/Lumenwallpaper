import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/explore", "/darkroom", "/wallpaper/", "/creator/"],
      disallow: ["/api/", "/library", "/creator/studio", "/login", "/verify"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
