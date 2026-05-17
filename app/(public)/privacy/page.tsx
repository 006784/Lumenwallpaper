import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 — Lumen",
  description: "Lumen 隐私政策：我们如何收集、使用和保护您的个人数据。",
};

const sections = [
  {
    title: "我们收集的信息",
    body: "当您使用 Lumen 时，我们会收集您主动提供的信息（如邮箱地址用于 Magic Link 登录），以及访问日志、设备类型等匿名技术数据。我们不收集密码。",
  },
  {
    title: "信息的使用方式",
    body: "您的邮箱仅用于发送登录验证链接，以及在您明确订阅后发送平台更新通知。我们不会将您的个人信息出售给任何第三方。",
  },
  {
    title: "Cookie 与本地存储",
    body: "Lumen 使用 HttpOnly Session Cookie 维持登录状态（默认 180 天）。我们不使用跨站追踪 Cookie 或广告 Cookie。您可以随时通过退出登录清除会话。",
  },
  {
    title: "数据安全",
    body: "所有数据传输均通过 TLS 加密。用户数据存储于 Supabase（PostgreSQL），受行级安全策略（RLS）保护。图片资源存储于 Cloudflare R2，仅通过签名 URL 访问。",
  },
  {
    title: "第三方服务",
    body: "我们使用 Resend 发送邮件、Vercel 提供托管服务、Cloudflare 提供 CDN 加速。这些服务提供商有各自的隐私政策，我们仅在必要范围内共享数据。",
  },
  {
    title: "您的权利",
    body: "您可以随时请求删除账户和相关数据。如需处理，请通过「联系我们」页面发送请求，我们将在 7 个工作日内响应。",
  },
  {
    title: "政策更新",
    body: "如本政策发生重大变更，我们会通过邮件或网站公告提前通知注册用户。继续使用 Lumen 视为接受更新后的政策。",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
        Privacy · 隐私
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.08] tracking-tight text-ink">
        隐私政策
      </h1>

      <p className="mt-4 font-mono text-[11px] text-muted/50">最后更新：2025 年 5 月</p>

      <div className="my-10 h-px bg-ink/8" />

      <div className="space-y-8">
        {sections.map(({ title, body }, i) => (
          <div key={title}>
            <div className="flex items-baseline gap-3">
              <span className="shrink-0 font-mono text-[9px] text-red/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
            </div>
            <p className="mt-2 pl-7 text-[14px] leading-7 text-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
