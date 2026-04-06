"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { NavLink } from "@/types/home";

type MobileNavProps = {
  currentUsername: string | null;
  isEditor: boolean;
  navLinks: NavLink[];
  unreadCount: number;
};

export function MobileNav({
  currentUsername,
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
        aria-label={isOpen ? "关闭菜单" : "打开菜单"}
        className="relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
        type="button"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span
          className={cn(
            "block h-px w-5 bg-ink transition-transform duration-200 origin-center",
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
            "block h-px w-5 bg-ink transition-transform duration-200 origin-center",
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
          <div className="absolute inset-0 bg-ink/30 dark:bg-black/55 backdrop-blur-sm" />

          {/* 菜单主体 */}
          <nav
            className="absolute inset-x-0 top-nav border-b border-ink bg-paper shadow-[0_12px_40px_rgba(10,8,4,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 主导航 */}
            <div className="border-b border-ink/10 px-5 py-4">
              {navLinks.map((link, i) => (
                <Link
                  key={link.label}
                  className={cn(
                    "flex items-center justify-between py-4 text-[13px] uppercase tracking-[0.22em] text-ink transition hover:text-red",
                    i > 0 && "border-t border-ink/8",
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
            <div className="px-5 py-4">
              {currentUsername ? (
                <div className="space-y-3">
                  <Link
                    className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                    href="/library"
                    onClick={handleLinkClick}
                  >
                    <span>
                      个人库
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
                    管理台
                    <span className="text-ink/20">→</span>
                  </Link>
                  {isEditor ? (
                    <Link
                      className="flex items-center justify-between py-3 text-[11px] uppercase tracking-[0.22em] text-muted hover:text-ink"
                      href="/creator/studio/moderation"
                      onClick={handleLinkClick}
                    >
                      审核台
                      <span className="text-ink/20">→</span>
                    </Link>
                  ) : null}
                  <div className="flex items-center gap-3 border-t border-ink/8 pt-4">
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted">
                      @{currentUsername}
                    </span>
                    <form action="/api/auth/signout" className="ml-auto" method="post">
                      <button
                        className="border border-ink/20 px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-muted transition hover:border-ink hover:text-ink"
                        type="submit"
                      >
                        退出
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
                  登录 / 注册
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
