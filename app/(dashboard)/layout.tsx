import type { ReactNode } from "react";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <DashboardHeader />
      <main className="pt-nav">{children}</main>
      <SiteFooter />
    </>
  );
}
