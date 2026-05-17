import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 Lumen",
  description: "Lumen 是一个专注于胶卷美学的壁纸创作平台，连接摄影师与热爱美的人。",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">
      {/* 眉题 */}
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
        About · 关于
      </p>

      <h1 className="mt-4 font-display text-[clamp(2.4rem,6vw,4rem)] font-medium leading-[1.05] tracking-tight text-ink">
        Lumen
      </h1>

      <p className="mt-6 text-[15px] leading-8 text-muted">
        Lumen 是一个以胶卷美学为核心的壁纸平台。我们相信，一张好的壁纸不仅是背景，更是情绪的延伸——它应该有颗粒感、有光影、有故事。
      </p>

      {/* 分割线 */}
      <div className="my-12 h-px bg-ink/8" />

      <div className="space-y-10">
        {[
          {
            n: "01",
            title: "我们做什么",
            body: "精选来自全球摄影师、插画师与 AI 创作者的壁纸作品，以胶卷扫描、暗室冲印、电影调色为核心审美标准，为每一块屏幕寻找最合适的画面。",
          },
          {
            n: "02",
            title: "创作者社区",
            body: "Lumen 是开放的。摄影师可以提交作品，通过审核后进入公开壁纸库。INS 专区专门收录以 IU、周子瑜等为主题的明星摄影，形成独特的创作社群。",
          },
          {
            n: "03",
            title: "我们的承诺",
            body: "所有壁纸均经过版权确认或原创授权。我们不以牺牲画质换取流量，每张图都提供接近原尺寸的高清下载，支持 4K 分辨率屏幕。",
          },
        ].map(({ n, title, body }) => (
          <div key={n} className="flex gap-6">
            <span className="mt-1 shrink-0 font-mono text-[11px] text-red/40">{n}</span>
            <div>
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-2 text-[14px] leading-7 text-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-[18px] border border-ink/8 bg-white/50 px-6 py-5 dark:border-paper/10 dark:bg-paper/5">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted/60">构建于</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {["Next.js 14", "Tailwind CSS", "Supabase", "Cloudflare R2", "Vercel"].map((tech) => (
            <span key={tech} className="font-mono text-[12px] text-ink/50">{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
