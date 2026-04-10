import Link from "next/link";

import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FrameButton } from "@/components/ui/frame-button";
import { navLinks } from "@/lib/data/home";

export function SiteHeader() {
  return (
    <ScrollAwareHeader className="fixed inset-x-0 top-0 z-50 border-b border-ink/8 bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto flex h-nav max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
        <Link
          className="group inline-flex items-end gap-3 leading-none"
          href="/"
        >
          <span className="font-body text-[28px] font-semibold tracking-[0.08em] md:text-[30px]">
            Lumen
          </span>
          <span className="mb-[5px] hidden font-mono text-[9px] uppercase tracking-[0.28em] text-muted/80 transition group-hover:text-ink lg:inline-flex">
            curated screens
          </span>
          <sup className="mb-[15px] align-super font-body text-[9px] tracking-[0.2em] text-red">
            TM
          </sup>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="relative text-[11px] uppercase tracking-[0.22em] text-muted transition after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-red after:transition-transform after:duration-200 hover:text-ink hover:after:scale-x-100 focus-visible:outline-none focus-visible:text-ink focus-visible:after:scale-x-100"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <FrameButton
            className="hidden sm:inline-flex"
            href="/login"
            variant="outline"
          >
            登录
          </FrameButton>
          <ThemeToggle />
          <FrameButton className="px-3 sm:px-4" href="/creator/studio">
            上传作品
          </FrameButton>
          <MobileNav
            currentUsername={null}
            isEditor={false}
            navLinks={navLinks}
            unreadCount={0}
          />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
