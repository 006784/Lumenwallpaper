import Link from "next/link";

import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { FrameButton } from "@/components/ui/frame-button";
import { getCurrentUser, isEditorUser } from "@/lib/auth";
import { navLinks } from "@/lib/data/home";
import { getUnreadNotificationsCount } from "@/lib/wallpapers";

export async function SiteHeader() {
  const currentUser = getCurrentUser();
  const isEditor = isEditorUser(currentUser);
  const unreadNotificationsCount = currentUser
    ? await getUnreadNotificationsCount(currentUser.id).catch(() => 0)
    : 0;

  return (
    <ScrollAwareHeader className="fixed inset-x-0 top-0 z-50 border-b border-ink/8 bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto flex h-nav max-w-[1600px] items-center justify-between gap-3 px-4 md:px-8">
        <Link
          className="group inline-flex items-end gap-3 leading-none"
          href="/"
        >
          <span className="font-body text-[28px] font-semibold uppercase tracking-[0.24em] md:text-[30px]">
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
          {currentUser ? (
            <>
              <Link
                className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted transition hover:text-ink focus-visible:outline-none focus-visible:text-ink lg:inline-flex"
                href="/library"
              >
                个人库
                {unreadNotificationsCount > 0 ? (
                  <span className="border border-red/20 bg-red/5 px-2 py-1 text-[9px] tracking-[0.18em] text-red">
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
                  className="hidden border-[1.5px] border-ink bg-transparent px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-ink transition duration-hover hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:bg-ink focus-visible:text-paper sm:inline-flex"
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
          <FrameButton className="px-3 sm:px-4" href="/creator/studio">
            上传作品
          </FrameButton>
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
