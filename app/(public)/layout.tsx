import type { ReactNode } from "react";
import { headers } from "next/headers";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getLocaleFromHeaders } from "@/lib/i18n";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const locale = getLocaleFromHeaders(headers());

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="pt-nav">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}
