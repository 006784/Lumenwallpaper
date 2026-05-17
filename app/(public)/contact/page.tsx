import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们 — Lumen",
  description: "联系 Lumen 团队：商务合作、创作者申请、问题反馈。",
};

const channels = [
  {
    n: "01",
    title: "创作者合作",
    desc: "摄影师、插画师或 AI 创作者，希望在 Lumen 展示作品或建立深度合作。",
    contact: "creator@lumen.photo",
    tag: "creator",
  },
  {
    n: "02",
    title: "商务与授权",
    desc: "商业使用授权、品牌合作、媒体报道或其他商业事宜。",
    contact: "business@lumen.photo",
    tag: "business",
  },
  {
    n: "03",
    title: "问题反馈",
    desc: "发现 bug、内容问题、下载异常，或对平台体验有改进建议。",
    contact: "support@lumen.photo",
    tag: "support",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 md:py-32">
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-red/70">
        Contact · 联系
      </p>

      <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.2rem)] font-medium leading-[1.08] tracking-tight text-ink">
        联系我们
      </h1>

      <p className="mt-5 text-[15px] leading-7 text-muted">
        根据您的需求选择对应的联系方式，我们通常在 1–3 个工作日内回复。
      </p>

      <div className="my-10 h-px bg-ink/8" />

      <div className="space-y-4">
        {channels.map(({ n, title, desc, contact }) => (
          <div
            key={n}
            className="group rounded-[18px] border border-ink/8 bg-white/50 p-5 transition hover:border-ink/14 hover:bg-white/70 dark:border-paper/10 dark:bg-paper/5 dark:hover:border-paper/16 dark:hover:bg-paper/8"
          >
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-red/40">{n}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{desc}</p>
                <a
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] text-ink/60 underline decoration-ink/20 underline-offset-4 transition hover:text-red hover:decoration-red/40"
                  href={`mailto:${contact}`}
                >
                  {contact}
                  <span className="text-[10px] opacity-50 transition group-hover:opacity-100">↗</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-[18px] border border-ink/8 bg-white/30 px-6 py-5 dark:border-paper/10 dark:bg-paper/4">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted/50">响应时效</p>
        <div className="mt-4 space-y-2">
          {[
            ["创作者 & 商务", "1–3 个工作日"],
            ["问题反馈", "3–5 个工作日"],
            ["紧急内容下架", "24 小时内"],
          ].map(([label, time]) => (
            <div key={label} className="flex items-center justify-between text-[13px]">
              <span className="text-muted">{label}</span>
              <span className="font-mono text-[11px] text-ink/60">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
