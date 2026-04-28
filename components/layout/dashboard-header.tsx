import Link from "next/link";

import { MobileNav } from "@/components/layout/mobile-nav";
import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FrameButton } from "@/components/ui/frame-button";
import { getCurrentUser, isEditorUser } from "@/lib/auth";
import { navLinks } from "@/lib/data/home";
import { getUnreadNotificationsCount } from "@/lib/wallpapers";

export async function DashboardHeader() {
  const currentUser = getCurrentUser();
  const isEditor = isEditorUser(currentUser);
  const unreadNotificationsCount = currentUser
    ? await getUnreadNotificationsCount(currentUser.id).catch(() => 0)
    : 0;

  return (
    <ScrollAwareHeader className="fixed inset-x-0 top-0 z-50 bg-transparent px-3 pt-3">
      <div className="glass-surface-soft mx-auto flex h-[64px] max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">
        <Link
          className="group inline-flex items-end gap-3 leading-none"
          href="/"
        >
          <span className="font-body text-[26px] font-semibold text-ink md:text-[28px]">
            Lumen
          </span>
          <span className="mb-[5px] hidden font-mono text-[9px] uppercase tracking-[0.28em] text-muted/80 transition group-hover:text-ink lg:inline-flex">
            curated screens
          </span>
          <sup className="mb-[15px] align-super font-body text-[9px] tracking-[0.2em] text-red">
            TM
          </sup>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="glass-chip px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-muted transition hover:text-ink focus-visible:outline-none focus-visible:text-ink"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <>
              <Link
                className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink focus-visible:outline-none focus-visible:text-ink lg:inline-flex"
                href="/library"
              >
                个人库
                {unreadNotificationsCount > 0 ? (
                  <span className="glass-chip-active px-2 py-1 text-[9px] tracking-[0.18em]">
                    {unreadNotificationsCount}
                  </span>
                ) : null}
              </Link>
              <Link
                className="hidden text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink focus-visible:outline-none focus-visible:text-ink xl:inline-flex"
                href="/creator/studio/manage"
              >
                管理台
              </Link>
              {isEditor ? (
                <Link
                  className="hidden text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink focus-visible:outline-none focus-visible:text-ink xl:inline-flex"
                  href="/creator/studio/moderation"
                >
                  审核台
                </Link>
              ) : null}
              <Link
                className="hidden text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink sm:inline-flex"
                href={`/creator/${currentUser.username}`}
              >
                @{currentUser.username}
              </Link>
              <form action="/api/auth/signout" method="post">
                <button
                  className="glass-control hidden px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-ink transition duration-hover focus-visible:outline-none sm:inline-flex"
                  type="submit"
                >
                  退出
                </button>
              </form>
            </>
          ) : (
            <FrameButton
              className="hidden sm:inline-flex"
              href="/login"
              variant="outline"
            >
              登录
            </FrameButton>
          )}
          <ThemeToggle />
          <FrameButton className="px-3 sm:px-4" href="/creator/studio">
            上传作品
          </FrameButton>
          <MobileNav
            currentUsername={currentUser?.username ?? null}
            isEditor={isEditor}
            navLinks={navLinks}
            unreadCount={unreadNotificationsCount}
          />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
