import Link from "next/link";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FrameButton } from "@/components/ui/frame-button";
import { getCurrentUser, isAuthConfigured, isEditorUser } from "@/lib/auth";
import { getLocalizedNavLinks } from "@/lib/data/home";
import { getI18nMessages } from "@/lib/i18n";
import type { SupportedLocale } from "@/types/i18n";

type SiteHeaderProps = {
  locale: SupportedLocale;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getI18nMessages(locale);
  const navLinks = getLocalizedNavLinks(locale);

  const currentUser = isAuthConfigured() ? getCurrentUser() : null;
  const isEditor = isEditorUser(currentUser);

  const loginLabel =
    locale === "zh-CN"
      ? "登录"
      : locale === "ja"
        ? "ログイン"
        : locale === "ko"
          ? "로그인"
          : "Log in";

  const libraryLabel =
    locale === "zh-CN"
      ? "我的库"
      : locale === "ja"
        ? "ライブラリ"
        : locale === "ko"
          ? "라이브러리"
          : "Library";

  return (
    <ScrollAwareHeader className="fixed inset-x-0 top-0 z-50 bg-transparent px-3 pt-3">
      <div className="glass-surface-soft mx-auto flex h-[64px] max-w-[1600px] items-center justify-between gap-3 px-4 md:px-6">
        <Link
          className="group inline-flex items-center gap-3 leading-none"
          href="/"
        >
          <span className="font-body text-[24px] font-semibold text-ink md:text-[26px]">
            Lumen
          </span>
          <span className="hidden border-l border-ink/15 pl-3 text-[11px] uppercase text-muted transition group-hover:text-ink lg:inline-flex">
            Wallpaper OS
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => {
            const isIns = link.href === "/ins";
            return isIns ? (
              <Link
                key={link.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-red/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(212,43,43,0.06))] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-red/70 shadow-[4px_6px_14px_rgba(212,43,43,0.07),-4px_-4px_10px_rgba(255,255,255,0.82),inset_1px_1px_1px_rgba(255,255,255,0.92)] transition hover:border-red/35 hover:text-red focus-visible:text-red dark:border-red/25 dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(212,43,43,0.10))] dark:text-red/60 dark:hover:text-red/90"
                href={link.href}
              >
                <span className="text-[7px] opacity-70">✦</span>
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.label}
                className="glass-chip px-4 py-2 text-[11px] uppercase text-muted transition hover:text-ink focus-visible:text-ink"
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser ? (
            <Link
              className="hidden items-center gap-2 rounded-full border border-ink/10 bg-white/50 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-muted transition hover:border-ink/20 hover:text-ink dark:border-paper/12 dark:bg-paper/8 dark:hover:border-paper/20 sm:inline-flex"
              href="/library"
            >
              <svg
                aria-hidden="true"
                className="h-3 w-3 opacity-60"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {libraryLabel}
            </Link>
          ) : (
            <FrameButton
              className="hidden sm:inline-flex"
              href="/login"
              variant="outline"
            >
              {loginLabel}
            </FrameButton>
          )}
          <LanguageSwitcher initialLocale={locale} />
          <ThemeToggle />
          <FrameButton className="px-4 sm:px-5" href="/creator/studio">
            {messages.actions.upload}
          </FrameButton>
          <MobileNav
            currentUsername={currentUser?.username ?? null}
            isEditor={isEditor}
            labels={{
              closeMenu:
                locale === "zh-CN"
                  ? "关闭菜单"
                  : locale === "ja"
                    ? "メニューを閉じる"
                    : locale === "ko"
                      ? "메뉴 닫기"
                      : "Close menu",
              dashboard:
                locale === "zh-CN"
                  ? "管理台"
                  : locale === "ja"
                    ? "管理画面"
                    : locale === "ko"
                      ? "관리 화면"
                      : "Dashboard",
              library:
                locale === "zh-CN"
                  ? "个人库"
                  : locale === "ja"
                    ? "ライブラリ"
                    : locale === "ko"
                      ? "라이브러리"
                      : "Library",
              login:
                locale === "zh-CN"
                  ? "登录 / 注册"
                  : locale === "ja"
                    ? "ログイン / 登録"
                    : locale === "ko"
                      ? "로그인 / 가입"
                      : "Log in / Sign up",
              logout:
                locale === "zh-CN"
                  ? "退出"
                  : locale === "ja"
                    ? "ログアウト"
                    : locale === "ko"
                      ? "로그아웃"
                      : "Log out",
              moderation:
                locale === "zh-CN"
                  ? "审核台"
                  : locale === "ja"
                    ? "審査画面"
                    : locale === "ko"
                      ? "검토 화면"
                      : "Moderation",
              openMenu:
                locale === "zh-CN"
                  ? "打开菜单"
                  : locale === "ja"
                    ? "メニューを開く"
                    : locale === "ko"
                      ? "메뉴 열기"
                      : "Open menu",
            }}
            navLinks={navLinks}
            unreadCount={0}
          />
        </div>
      </div>
    </ScrollAwareHeader>
  );
}
