"use client";

import { useI18n } from "@/hooks/use-i18n";
import type { SupportedLocale } from "@/types/i18n";

type LanguageSwitcherProps = {
  initialLocale: SupportedLocale;
};

export function LanguageSwitcher({ initialLocale }: LanguageSwitcherProps) {
  const { locale, setLocale, supportedLocales } = useI18n({ initialLocale });

  async function handleLocaleChange(nextLocale: SupportedLocale) {
    await setLocale(nextLocale);

    const url = new URL(window.location.href);
    url.searchParams.set("locale", nextLocale);
    window.location.assign(url.toString());
  }

  return (
    <div className="glass-control inline-flex h-10 items-center gap-1 px-2">
      <span className="font-mono text-[10px] uppercase text-muted" aria-hidden>
        Aa
      </span>
      <label className="sr-only" htmlFor="lumen-language-switcher">
        Language
      </label>
      <select
        id="lumen-language-switcher"
        className="bg-transparent px-1 text-[10px] uppercase tracking-[0.12em] text-muted outline-none transition hover:text-ink"
        value={locale}
        onChange={(event) => {
          void handleLocaleChange(event.target.value as SupportedLocale);
        }}
      >
        {supportedLocales.map((option) => (
          <option key={option.locale} value={option.locale}>
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
