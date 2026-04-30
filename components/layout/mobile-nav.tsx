"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { NavLink } from "@/types/home";

type MobileNavProps = {
  currentUsername: string | null;
  labels?: {
    closeMenu: string;
    dashboard: string;
    library: string;
    login: string;
    logout: string;
    moderation: string;
    openMenu: string;
  };
  isEditor: boolean;
  navLinks: NavLink[];
  unreadCount: number;
};

export function MobileNav({
  currentUsername,
  labels = {
    closeMenu: "关闭菜单",
    dashboard: "管理台",
    library: "个人库",
    login: "登录 / 注册",
    logout: "退出",
    moderation: "审核台",
    openMenu: "打开菜单",
  },
  isEditor,
  navLinks,
  unreadCount,
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // close on route change (simple: listen for click on any link inside overlay)
  function handleLinkClick() {
    setIsOpen(false);
  }

  return (
    <>
      {/* 汉堡按钮 */}
      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? labels.closeMenu : labels.openMenu}
        className="glass-control relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span
          className={cn(
            "block h-px w-5 origin-center bg-ink transition-transform duration-200",
            isOpen && "translate-y-[6px] rotate-45",
          )}
        />
        <span
          className={cn(
            "block h-px w-5 bg-ink transition-opacity duration-200",
            isOpen && "opacity-0",
          )}
        />
        <span
          className={cn(
            "block h-px w-5 origin-center bg-ink transition-transform duration-200",
            isOpen && "-translate-y-[6px] -rotate-45",
          )}
        />
      </button>

      {/* 遮罩 + 菜单 */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          onClick={() => setIsOpen(false)}
        >
          {/* 半透明遮罩 */}
          <div className="absolute inset-0 bg-ink/20 backdrop-blur-md dark:bg-black/45" />

          {/* 菜单主体 */}
          <nav
            className="glass-surface absolute inset-x-3 top-[86px] overflow-hidden px-2 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 主导航 */}
            <div className="px-3 py-3">
              {navLinks.map((link, i) => (
                <Link
                  key={link.label}
                  className={cn(
                    "flex items-center justify-between rounded-2xl px-3 py-4 text-[13px] uppercase tracking-[0.18em] text-ink transition hover:bg-white/45 hover:text-red",
                    i > 0 && "border-t border-ink/5",
                  )}
                  href={link.href}
                  onClick={handleLinkClick}
                >
                  {link.label}
                  <span className="text-ink/25">→</span>
                </Link>
              ))}
            </div>

            {/* 账号区 */}
            <div className="border-t border-white/55 px-3 py-4">
              {currentUsername ? (
                <div className="space-y-3">
                  <Link
                    className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                    href="/library"
                    onClick={handleLinkClick}
                  >
                    <span>
                      {labels.library}
                      {unreadCount > 0 ? (
                        <span className="ml-2 border border-red/20 bg-red/5 px-2 py-0.5 text-[9px] text-red">
                          {unreadCount}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-ink/20">→</span>
                  </Link>
                  <Link
                    className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                    href="/creator/studio/manage"
                    onClick={handleLinkClick}
                  >
                    {labels.dashboard}
                    <span className="text-ink/20">→</span>
                  </Link>
                  {isEditor ? (
                    <Link
                      className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                      href="/creator/studio/moderation"
                      onClick={handleLinkClick}
                    >
                      {labels.moderation}
                      <span className="text-ink/20">→</span>
                    </Link>
                  ) : null}
                  <div className="border-ink/8 flex items-center gap-3 border-t pt-4">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
                      @{currentUsername}
                    </span>
                    <form
                      action="/api/auth/signout"
                      className="ml-auto"
                      method="post"
                    >
                      <button
                        className="glass-control px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:text-ink"
                        type="submit"
                      >
                        {labels.logout}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <Link
                  className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                  href="/login"
                  onClick={handleLinkClick}
                >
                  {labels.login}
                  <span className="text-ink/20">→</span>
                </Link>
              )}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
