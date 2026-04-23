import Link from "next/link";

import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FrameButton } from "@/components/ui/frame-button";
import { navLinks } from "@/lib/data/home";

export function SiteHeader() {
  return (
    <ScrollAwareHeader className="fixed inset-x-0 top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-xl dark:bg-paper/90">
      <div className="mx-auto flex h-nav max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
        <Link
          className="group inline-flex items-center gap-3 leading-none"
          href="/"
        >
          <span className="font-body text-[24px] font-semibold md:text-[26px]">
            Lumen
          </span>
          <span className="hidden border-l border-ink/20 pl-3 text-[11px] uppercase text-muted transition group-hover:text-ink lg:inline-flex">
            Wallpaper OS
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="border border-transparent px-3 py-2 text-[11px] uppercase text-muted transition hover:border-ink/10 hover:bg-paper2/70 hover:text-ink focus-visible:border-ink/20 focus-visible:bg-paper2"
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
