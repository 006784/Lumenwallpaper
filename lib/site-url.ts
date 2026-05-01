import type { Metadata } from "next";

import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} from "@/lib/i18n";
import type { SupportedLocale } from "@/types/i18n";

const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function getSiteBaseUrl() {
  return (
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.NEXTAUTH_URL) ??
    normalizeSiteUrl(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ) ??
    LOCAL_SITE_URL
  );
}

export function getSiteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(normalizedPath, getSiteBaseUrl()).toString();
}

export function getLocaleUrl(path: string, locale: SupportedLocale) {
  const url = new URL(getSiteUrl(path));

  if (locale !== DEFAULT_LOCALE) {
    url.searchParams.set("locale", locale);
  }

  return url.toString();
}

export function getLanguageAlternates(path: string) {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale === "zh-CN" ? "zh-CN" : locale,
      getLocaleUrl(path, locale),
    ]),
  ) as Record<string, string>;
}

export function getPageAlternates(path: string): NonNullable<
  Metadata["alternates"]
> {
  return {
    canonical: getSiteUrl(path),
    languages: {
      ...getLanguageAlternates(path),
      "x-default": getLocaleUrl(path, DEFAULT_LOCALE),
    },
  };
}

export function createPublicPageMetadata(options: {
  description: string;
  image?: string | null;
  path: string;
  title: string;
  type?: "article" | "website";
}): Metadata {
  const image = options.image || getSiteUrl("/opengraph-image");
  const url = getSiteUrl(options.path);

  return {
    title: options.title,
    description: options.description,
    alternates: getPageAlternates(options.path),
    openGraph: {
      title: options.title,
      description: options.description,
      type: options.type ?? "website",
      url,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image],
    },
  };
}
