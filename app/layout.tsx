import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { ObservabilityWidgets } from "@/components/layout/observability-widgets";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SmoothScrollProvider } from "@/components/layout/smooth-scroll-provider";
import "@/styles/globals.css";

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
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      lang="zh-CN"
    >
      <body className="bg-paper font-body text-ink antialiased">
        <SmoothScrollProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <SiteHeader />
            <main className="pt-nav">{children}</main>
            <SiteFooter />
            <ObservabilityWidgets />
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
