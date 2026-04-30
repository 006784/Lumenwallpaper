export type SupportedLocale = "zh-CN" | "en" | "ja" | "ko";

export interface LocaleOption {
  htmlLang: string;
  label: string;
  locale: SupportedLocale;
  nativeLabel: string;
}

export interface LocalizedSiteMetadata {
  description: string;
  title: string;
}

export interface I18nMessages {
  actions: {
    close: string;
    download: string;
    explore: string;
    retry: string;
    save: string;
    search: string;
    upload: string;
  };
  common: {
    brandDescription: string;
    brandName: string;
    language: string;
  };
  explore: {
    categories: Record<string, { description: string; label: string }>;
    filters: {
      aspect: Record<string, { description?: string; label: string }>;
      media: Record<string, { label: string }>;
      orientation: Record<string, { label: string }>;
      resolution: Record<string, { description: string; label: string }>;
      sort: Record<string, { description: string; label: string }>;
    };
  };
  footer: {
    about: string;
    creator: string;
    explore: string;
  };
  home: {
    darkroom: string;
    featuredWallpapers: string;
    navCreator: string;
    navDarkroom: string;
    navExplore: string;
    navLibrary: string;
  };
  wallpaper: {
    bestThisWeek: string;
    curated: string;
    curatedShort: string;
    downloads: string;
    editorPick: string;
    editorPickThisWeek: string;
    hd: string;
    seoDescriptionFallback: string;
    seoTitleSuffix: string;
    staticWallpaper: string;
    motionWallpaper: string;
  };
}

export interface I18nPayload {
  locale: SupportedLocale;
  messages: I18nMessages;
  supportedLocales: LocaleOption[];
}
