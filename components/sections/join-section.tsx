import { Reveal } from "@/components/ui/reveal";

export function JoinSection() {
  return (
    <section className="border-b-frame border-ink">
      <Reveal className="md:grid md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col justify-between gap-8 border-b-frame border-ink px-4 py-12 md:border-b-0 md:border-r-frame md:px-10 md:py-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-red">
            <span className="live-dot inline-block h-[7px] w-[7px] rounded-full bg-red" />
            创作者计划
          </p>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] tracking-[-0.04em]">
            分享你
            <br />
            镜头里的<em className="not-italic italic text-red">世界</em>
          </h2>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          上传你的摄影、插画或 AI 作品。每次下载，你都获得收益分成。加入
          3,200 位创作者。
        </p>

        <div className="flex flex-wrap gap-8">
          {[
            ["3.2K", "活跃创作者"],
            ["48K", "收录作品"],
            ["70%", "收益分成"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-mono text-[38px] leading-none tracking-[-0.05em]">
                {value}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="group relative flex min-h-[280px] flex-col items-center justify-center gap-5 overflow-hidden bg-ink px-8 py-12 transition hover:bg-[#1a1612]">
        <div className="pointer-events-none absolute bottom-[-20px] font-mono text-[140px] tracking-[-0.08em] text-paper/5 md:text-[180px]">
          UPLOAD
        </div>
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-paper/20 text-[36px] text-paper/35 transition group-hover:rotate-45 group-hover:border-gold group-hover:text-gold">
          +
        </div>
        <p className="font-mono text-[20px] tracking-[0.35em] text-paper/45 transition group-hover:text-paper">
          拖拽上传你的作品
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-paper/25">
          JPG · PNG · WEBP · 最大 50MB
        </p>
      </div>
      </Reveal>
    </section>
  );
}
