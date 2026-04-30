"use client";

import { useCallback, useMemo, useState } from "react";

import {
  DEFAULT_LOCALE,
  getI18nMessages,
  localeToHtmlLang,
  LOCALE_OPTIONS,
  normalizeLocale,
} from "@/lib/i18n";
import type { I18nMessages, SupportedLocale } from "@/types/i18n";

type UseI18nOptions = {
  initialLocale?: SupportedLocale | string | null;
};

export function useI18n(options?: UseI18nOptions) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    return normalizeLocale(options?.initialLocale) ?? DEFAULT_LOCALE;
  });

  const messages = useMemo<I18nMessages>(() => {
    return getI18nMessages(locale);
  }, [locale]);

  const setLocale = useCallback(async (nextLocale: SupportedLocale) => {
    setLocaleState(nextLocale);

    if (typeof document !== "undefined") {
      document.documentElement.lang = localeToHtmlLang(nextLocale);
    }

    await fetch("/api/i18n", {
      body: JSON.stringify({ locale: nextLocale }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }).catch(() => {
      // The UI can still switch immediately; persistence is best effort.
    });
  }, []);

  return {
    locale,
    messages,
    setLocale,
    supportedLocales: LOCALE_OPTIONS,
  };
}
