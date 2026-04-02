import Link from "next/link";
import { redirect } from "next/navigation";

import { DownloadHistoryList } from "@/components/library/download-history-list";
import { NotificationList } from "@/components/library/notification-list";
import { PagePlaceholder } from "@/components/ui/page-placeholder";
import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { getCurrentUser, isAuthConfigured } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getUserLibrarySnapshot } from "@/lib/wallpapers";

type LibraryPageProps = {
  searchParams?: {
    kind?: string;
  };
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  if (!isAuthConfigured()) {
    return (
      <PagePlaceholder
        description="个人库依赖登录态与收藏记录。先补齐 NEXTAUTH_SECRET，再从这里继续。"
        eyebrow="Library"
        title="个人库尚未启用"
      />
    );
  }

  if (!isSupabaseConfigured()) {
    return (
      <PagePlaceholder
        description="收藏夹和下载历史都存放在 Supabase。先补齐本地的 Supabase 环境变量，再打开个人库。"
        eyebrow="Library"
        title="数据环境尚未连接"
      />
    );
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    redirect("/login?next=/library");
  }

  const library = await getUserLibrarySnapshot(currentUser.id);
  const notificationKinds = [...new Set(library.notifications.map((item) => item.kind))];
  const requestedNotificationKind = searchParams?.kind?.trim();
  const notificationKindFilter =
    requestedNotificationKind === "all" ||
    (requestedNotificationKind &&
      notificationKinds.includes(requestedNotificationKind))
      ? requestedNotificationKind
      : "all";
  const filteredNotifications =
    notificationKindFilter === "all"
      ? library.notifications
      : library.notifications.filter(
          (item) => item.kind === notificationKindFilter,
        );

  return (
    <section className="relative overflow-hidden border-b-frame border-ink px-4 py-16 md:px-10 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(245,200,66,0.16),transparent_18%),radial-gradient(circle_at_84%_20%,rgba(212,43,43,0.06),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.16),transparent_42%)]" />

      <div className="relative mx-auto max-w-7xl">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          Library
        </p>
        <h1 className="max-w-4xl font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.94] tracking-[-0.05em]">
          你的收藏与下载记录
        </h1>
        <p className="mt-6 max-w-3xl text-sm leading-7 text-muted md:text-base">
          这里汇总了当前账户收藏过的壁纸和最近的下载轨迹。后续推荐、继续浏览和跨设备同步，都会从这里长出来。
        </p>

        <div className="mt-8 flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.24em] text-muted">
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            @{currentUser.username}
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            收藏 {library.favorites.length}
          </span>
          <span className="border border-ink/10 bg-paper/70 px-3 py-2">
            下载记录 {library.downloadHistory.length}
          </span>
          <span className="border border-gold/20 bg-gold/5 px-3 py-2 text-gold">
            未读通知 {library.unreadNotificationsCount}
          </span>
          <span className="border border-red/20 bg-red/5 px-3 py-2 text-red">
            {library.collection?.name ?? "个人库"}
          </span>
        </div>

        <div className="mt-14 grid gap-14">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-red">
                  通知中心
                </p>
                <h2 className="mt-2 font-display text-[34px] italic leading-none">
                  审核与系统动态
                </h2>
              </div>
              <p className="text-sm text-muted">
                这里会记录审核结果等站内动态，帮助你不用只依赖邮件。
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em]">
              <Link
                className={`border px-3 py-2 transition ${
                  notificationKindFilter === "all"
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/15 bg-paper text-muted hover:bg-ink hover:text-paper"
                }`}
                href="/library"
              >
                全部通知
              </Link>
              {notificationKinds.map((kind) => (
                <Link
                  key={kind}
                  className={`border px-3 py-2 transition ${
                    notificationKindFilter === kind
                      ? "border-ink bg-ink text-paper"
                      : "border-ink/15 bg-paper text-muted hover:bg-ink hover:text-paper"
                  }`}
                  href={`/library?kind=${encodeURIComponent(kind)}`}
                >
                  {kind.replace(/_/g, " ")}
                </Link>
              ))}
            </div>

            {filteredNotifications.length > 0 ? (
              <div className="mt-8">
                <NotificationList items={filteredNotifications} />
              </div>
            ) : (
              <div className="mt-8 border-frame border-ink bg-paper/65 px-6 py-12 text-sm leading-7 text-muted">
                当前筛选条件下还没有通知。等审核结果或系统提醒出现后，这里会自动开始累计。
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-red">
                  收藏夹
                </p>
                <h2 className="mt-2 font-display text-[34px] italic leading-none">
                  你想留下来的画面
                </h2>
              </div>
              <p className="text-sm text-muted">
                已同步到默认收藏夹，后续可以扩展为多收藏夹。
              </p>
            </div>

            {library.favorites.length > 0 ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {library.favorites.map((wallpaper) => (
                  <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
                ))}
              </div>
            ) : (
              <div className="mt-8 border-frame border-ink bg-paper/65 px-6 py-12 text-sm leading-7 text-muted">
                你还没有收藏任何壁纸。去任意详情页点一下“加入收藏”，这里就会立刻出现。
              </div>
            )}
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.32em] text-red">
                  下载历史
                </p>
                <h2 className="mt-2 font-display text-[34px] italic leading-none">
                  你最近带走的作品
                </h2>
              </div>
              <p className="text-sm text-muted">
                当前展示最近 24 条记录，方便你回看与继续下载。
              </p>
            </div>

            {library.downloadHistory.length > 0 ? (
              <div className="mt-8">
                <DownloadHistoryList items={library.downloadHistory} />
              </div>
            ) : (
              <div className="mt-8 border-frame border-ink bg-paper/65 px-6 py-12 text-sm leading-7 text-muted">
                还没有下载记录。等你第一次下载原图之后，这里会自动开始累计。
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
