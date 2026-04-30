import Link from "next/link";

import { getLocalizedFooterColumns } from "@/lib/data/home";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { SupportedLocale } from "@/types/i18n";

type SiteFooterProps = {
  locale: SupportedLocale;
};

export function SiteFooter({ locale }: SiteFooterProps) {
  const footerColumns = getLocalizedFooterColumns(locale);
  const copy = getHomeUiCopy(locale);

  return (
    <footer className="px-4 py-6 md:px-8">
      <div className="glass-surface grid gap-10 px-5 py-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-8">
        <div className="md:pr-10">
          <p className="font-body text-[36px] font-semibold leading-none tracking-[0.08em] md:text-[40px]">
            Lumen
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
            {copy.footer.taglineLine1}
            <br />
            {copy.footer.taglineLine2}
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h2 className="mb-5 text-[10px] uppercase tracking-[0.35em] text-red">
              {column.title}
            </h2>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    className="text-sm text-muted transition hover:text-ink"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-2 py-5 text-[10px] uppercase tracking-[0.2em] text-muted md:flex-row md:items-center md:justify-between md:px-3">
        <span>© 2026 Lumen™</span>
        <span className="inline-flex items-center gap-2">
          <span className="text-[8px] text-red">✦</span>
          {copy.footer.madeWith}
        </span>
      </div>
    </footer>
  );
}
