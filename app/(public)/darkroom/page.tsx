import type { Metadata } from "next";
import { headers } from "next/headers";

import { WallpaperGridCard } from "@/components/wallpaper/wallpaper-grid-card";
import { PUBLIC_PAGE_REVALIDATE_SECONDS } from "@/lib/cache";
import { getLocaleFromHeaders } from "@/lib/i18n";
import { getDarkroomPageCopy } from "@/lib/i18n-ui";
import { getCachedFeaturedWallpapers } from "@/lib/public-wallpaper-cache";
import { createPublicPageMetadata } from "@/lib/site-url";

export const revalidate = PUBLIC_PAGE_REVALIDATE_SECONDS;

export function generateMetadata(): Metadata {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDarkroomPageCopy(locale);

  return createPublicPageMetadata({
    path: "/darkroom",
    title:
      locale === "zh-CN"
        ? "暗室精选"
        : locale === "ja"
          ? "暗室セレクト"
          : locale === "ko"
            ? "다크룸 픽"
            : "Darkroom Picks",
    description: copy.description,
  });
}

export default async function DarkroomPage() {
  const locale = getLocaleFromHeaders(headers());
  const copy = getDarkroomPageCopy(locale);
  const wallpapers = await getCachedFeaturedWallpapers({
    limit: 24,
    sort: "popular",
  }).catch((error) => {
    console.warn("[darkroom] failed to load featured wallpapers", error);
    return [];
  });

  return (
    <>
      {/* ── 页头 ── */}
      <section className="relative overflow-hidden px-4 pb-14 pt-24 md:px-10 md:pt-32">
        {/* 背景纹理 */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_0%,rgba(10,8,4,0.04),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_60%_0%,rgba(255,255,255,0.03),transparent)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            {/* 左：标题区 */}
            <div>
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-red/70" />
                <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
                  Darkroom · 暗室精选
                </p>
              </div>

              <h1 className="mt-5 font-display text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[1.02] tracking-tight text-ink">
                {copy.title}
              </h1>

              <p className="mt-5 max-w-xl text-[14px] leading-7 text-muted">
                {locale === "zh-CN"
                  ? "高反差、低照度、戏剧光影。这里收录情绪密度最高的作品。"
                  : locale === "ja"
                    ? "高コントラスト、低照度、劇的な光と影。最も感情的な密度を持つ作品を集めました。"
                    : locale === "ko"
                      ? "높은 대비, 낮은 조도, 극적인 빛과 그림자. 감정 밀도가 가장 높은 작품들."
                      : "High contrast, low light, dramatic shadows. The most atmospheric works in the collection."}
              </p>
            </div>

            {/* 右：数字指标 */}
            <div className="flex items-center gap-px overflow-hidden rounded-[16px] border border-ink/8 dark:border-paper/10">
              {[
                {
                  value: String(wallpapers.length),
                  label: locale === "zh-CN" ? "件精选" : locale === "ja" ? "セレクト" : locale === "ko" ? "선택됨" : "picks",
                },
                {
                  value: locale === "zh-CN" ? "热度" : locale === "ja" ? "人気順" : locale === "ko" ? "인기순" : "Popular",
                  label: locale === "zh-CN" ? "排序方式" : locale === "ja" ? "並び替え" : locale === "ko" ? "정렬" : "Sort",
                },
                {
                  value: locale === "zh-CN" ? "编辑" : locale === "ja" ? "編集" : locale === "ko" ? "편집자" : "Editor",
                  label: locale === "zh-CN" ? "策展来源" : locale === "ja" ? "キュレーション" : locale === "ko" ? "큐레이션" : "Curated",
                },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/40 px-5 py-4 dark:bg-paper/5">
                  <p className="font-mono text-[20px] font-medium leading-none text-ink">{value}</p>
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.24em] text-muted/60">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="mt-10 h-px bg-[linear-gradient(90deg,rgba(10,8,4,0.12),rgba(10,8,4,0.04)_60%,transparent)] dark:bg-[linear-gradient(90deg,rgba(242,237,228,0.12),rgba(242,237,228,0.04)_60%,transparent)]" />
        </div>
      </section>

      {/* ── 壁纸网格 ── */}
      <section className="px-4 pb-20 md:px-10 md:pb-section">
        <div className="mx-auto max-w-7xl">
          {wallpapers.length > 0 ? (
            <div className="wallpaper-card-grid">
              {wallpapers.map((wallpaper) => (
                <WallpaperGridCard key={wallpaper.id} wallpaper={wallpaper} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 text-[18px] text-muted/40">
                ◐
              </span>
              <p className="text-[14px] text-muted">{copy.empty}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
