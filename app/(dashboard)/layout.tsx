import type { ReactNode } from "react";
import { headers } from "next/headers";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { getLocaleFromHeaders } from "@/lib/i18n";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const locale = getLocaleFromHeaders(headers());

  return (
    <>
      <DashboardHeader />
      <main className="pt-nav">{children}</main>
      <SiteFooter locale={locale} />
    </>
  );
}
