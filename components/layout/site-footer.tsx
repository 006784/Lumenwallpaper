import Link from "next/link";

import { footerColumns } from "@/lib/data/home";

export function SiteFooter() {
  return (
    <footer className="border-t-frame border-ink bg-paper">
      <div className="grid gap-10 px-4 py-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-10">
        <div className="md:pr-10">
          <p className="font-body text-[36px] font-semibold uppercase leading-none tracking-[0.24em] md:text-[40px]">
            Lumen
          </p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
            每一帧都值得被看见。
            <br />
            壁纸不是装饰，是态度。
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

      <div className="flex flex-col gap-2 border-t border-ink/10 px-4 py-5 text-[10px] uppercase tracking-[0.2em] text-muted md:flex-row md:items-center md:justify-between md:px-10">
        <span>© 2026 Lumen™</span>
        <span className="inline-flex items-center gap-2">
          <span className="text-[8px] text-red">✦</span>
          Made with obsession
        </span>
      </div>
    </footer>
  );
}
