import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { headers } from "next/headers";

import { ObservabilityWidgets } from "@/components/layout/observability-widgets";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import {
  getLocaleFromHeaders,
  getLocalizedSiteMetadata,
  localeToHtmlLang,
} from "@/lib/i18n";
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
    metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
    title: {
      default: metadata.title,
      template: `%s · ${metadata.title}`,
    },
    description: metadata.description,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
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
