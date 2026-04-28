import { Reveal } from "@/components/ui/reveal";

export function JoinSection() {
  return (
    <section className="px-4 py-12 md:px-10 md:py-16">
      <Reveal className="glass-surface overflow-hidden md:grid md:grid-cols-[1fr_1fr]">
      <div className="flex flex-col justify-between gap-8 px-5 py-12 md:px-10 md:py-16">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-red">
            <span className="live-dot inline-block h-[7px] w-[7px] rounded-full bg-red" />
            创作者计划
          </p>
          <h2 className="font-body text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.02]">
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
              <p className="font-mono text-[38px] leading-none">
                {value}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="group relative flex min-h-[280px] flex-col items-center justify-center gap-5 overflow-hidden bg-white/38 px-8 py-12 transition">
        <div className="pointer-events-none absolute bottom-[-20px] font-mono text-[140px] text-ink/5 md:text-[180px]">
          UPLOAD
        </div>
        <div className="glass-primary flex h-20 w-20 items-center justify-center text-[36px] transition group-hover:rotate-45">
          +
        </div>
        <p className="font-mono text-[20px] tracking-[0.28em] text-muted transition group-hover:text-ink">
          拖拽上传你的作品
        </p>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
          JPG · PNG · WEBP · 最大 50MB
        </p>
      </div>
      </Reveal>
    </section>
  );
}
