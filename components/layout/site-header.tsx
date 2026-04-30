import Link from "next/link";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ScrollAwareHeader } from "@/components/layout/scroll-aware-header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { FrameButton } from "@/components/ui/frame-button";
import { getLocalizedNavLinks } from "@/lib/data/home";
import { getI18nMessages } from "@/lib/i18n";
import type { SupportedLocale } from "@/types/i18n";

type SiteHeaderProps = {
  locale: SupportedLocale;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const messages = getI18nMessages(locale);
  const navLinks = getLocalizedNavLinks(locale);
  const loginLabel =
    locale === "zh-CN"
      ? "登录"
      : locale === "ja"
        ? "ログイン"
        : locale === "ko"
          ? "로그인"
          : "Log in";

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
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="glass-chip px-4 py-2 text-[11px] uppercase text-muted transition hover:text-ink focus-visible:text-ink"
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
            {loginLabel}
          </FrameButton>
          <LanguageSwitcher initialLocale={locale} />
          <ThemeToggle />
          <FrameButton className="px-4 sm:px-5" href="/creator/studio">
            {messages.actions.upload}
          </FrameButton>
          <MobileNav
            currentUsername={null}
            isEditor={false}
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
