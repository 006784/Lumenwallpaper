import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { ObservabilityWidgets } from "@/components/layout/observability-widgets";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "@/styles/globals.css";

// Inline script: apply .dark class before first paint to prevent flash
const themeScript = `(function(){try{var t=localStorage.getItem('lumen-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})();`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "Lumen",
    template: "%s · Lumen",
  },
  description:
    "Lumen 是一个以胶卷美学与高端杂志排版为语言的壁纸发现与分享平台。",
  openGraph: {
    title: "Lumen",
    description:
      "Lumen 是一个以胶卷美学与高端杂志排版为语言的壁纸发现与分享平台。",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumen",
    description:
      "Lumen 是一个以胶卷美学与高端杂志排版为语言的壁纸发现与分享平台。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="zh-CN"
    >
      <head>
        {/* Anti-flash: apply theme class synchronously before first paint */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-paper font-body text-ink antialiased">
        <ThemeProvider>
          <SmoothScrollProvider>
            <div className="relative min-h-screen overflow-x-hidden">
              <SiteHeader />
              <main className="pt-nav">{children}</main>
              <SiteFooter />
              <ObservabilityWidgets />
            </div>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
