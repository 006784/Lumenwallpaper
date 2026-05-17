import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使用条款 — Lumen",
  description: "Lumen 使用条款：使用本平台前请仔细阅读以下条款。",
};

const sections = [
  {
    title: "服务说明",
    body: "Lumen 是一个壁纸浏览与下载平台，提供高质量壁纸的展示、搜索与下载服务。平台同时为经审核的创作者提供作品上传与展示功能。",
  },
  {
    title: "账户与登录",
    body: "Lumen 采用 Magic Link 无密码登录。您需要提供有效邮箱地址完成注册。您有责任保护您的账户安全，不得将登录链接分享给他人。",
  },
  {
    title: "壁纸使用授权",
    body: "平台上的所有壁纸默认授权用于个人非商业用途，包括设置为设备壁纸。商业使用（包括用于商业项目、印刷品或再分发）需要单独授权，请联系对应创作者。",
  },
  {
    title: "禁止行为",
    body: "您不得：将平台内容用于商业转售；通过技术手段批量下载壁纸；冒充他人身份上传内容；上传含有侵权、色情、仇恨言论或违法内容的素材。",
  },
  {
    title: "创作者内容",
    body: "创作者对其上传的内容保留版权。通过提交作品，创作者授予 Lumen 在平台展示和分发其作品的非独家许可。Lumen 保留在不符合平台规范时下架内容的权利。",
  },
  {
    title: "免责声明",
    body: "Lumen 按「现状」提供服务，不对服务中断、数据丢失或因使用平台内容产生的任何损失承担责任。我们会尽力维持服务稳定，但不提供可用性保证。",
  },
  {
    title: "条款变更",
    body: "我们保留随时修改本条款的权利。重大变更会提前通过邮件通知注册用户。继续使用 Lumen 服务视为接受更新后的条款。",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
        Terms · 条款
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.08] tracking-tight text-ink">
        使用条款
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
