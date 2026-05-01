import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { headers } from "next/headers";

import { ObservabilityWidgets } from "@/components/layout/observability-widgets";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import {
  getLocaleFromHeaders,
  getLocalizedSiteMetadata,
  localeToHtmlLang,
} from "@/lib/i18n";
import { getPageAlternates, getSiteUrl } from "@/lib/site-url";
import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  THEME_INIT_SCRIPT,
} from "@/lib/theme";
import "@/styles/globals.css";

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const metadata = getLocalizedSiteMetadata(locale);

  return {
    metadataBase: new URL(getSiteUrl("/")),
    title: {
      default: metadata.title,
      template: `%s · ${metadata.title}`,
    },
    description: metadata.description,
    applicationName: "Lumen",
    alternates: getPageAlternates("/"),
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: "/icon.svg",
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "website",
      url: getSiteUrl("/"),
      images: [{ url: getSiteUrl("/opengraph-image") }],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [getSiteUrl("/opengraph-image")],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { color: THEME_COLOR_LIGHT, media: "(prefers-color-scheme: light)" },
    { color: THEME_COLOR_DARK, media: "(prefers-color-scheme: dark)" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = getLocaleFromHeaders(headers());

  return (
    <html
      suppressHydrationWarning
      className={GeistMono.variable}
      lang={localeToHtmlLang(locale)}
    >
      <head>
        {/* Anti-flash: apply theme class synchronously before first paint */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="bg-paper font-body text-ink antialiased">
        <ThemeProvider>
          <SmoothScrollProvider>
            <div className="relative min-h-screen overflow-x-hidden">
              {children}
              <ObservabilityWidgets />
            </div>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
