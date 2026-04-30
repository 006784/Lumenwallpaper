import { Reveal } from "@/components/ui/reveal";
import { getHomeUiCopy } from "@/lib/i18n-ui";
import type { SupportedLocale } from "@/types/i18n";

type JoinSectionProps = {
  locale: SupportedLocale;
};

export function JoinSection({ locale }: JoinSectionProps) {
  const copy = getHomeUiCopy(locale);

  return (
    <section className="px-4 py-12 md:px-10 md:py-16">
      <Reveal className="glass-surface overflow-hidden md:grid md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-between gap-8 px-5 py-12 md:px-10 md:py-16">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-red">
              <span className="live-dot inline-block h-[7px] w-[7px] rounded-full bg-red" />
              {copy.join.eyebrow}
            </p>
            <h2 className="font-body text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.02]">
              {copy.join.titleLine1}
              <br />
              {copy.join.titleLine2}
              <em className="italic not-italic text-red">
                {copy.join.titleAccent}
              </em>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-muted">
            {copy.join.body}
          </p>

          <div className="flex flex-wrap gap-8">
            {[
              ["3.2K", copy.join.metricCreators],
              ["48K", copy.join.metricWorks],
              ["70%", copy.join.metricRevenue],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-mono text-[38px] leading-none">{value}</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.3em] text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/38 group relative flex min-h-[280px] flex-col items-center justify-center gap-5 overflow-hidden px-8 py-12 transition">
          <div className="pointer-events-none absolute bottom-[-20px] font-mono text-[140px] text-ink/5 md:text-[180px]">
            UPLOAD
          </div>
          <div className="glass-primary flex h-20 w-20 items-center justify-center text-[36px] transition group-hover:rotate-45">
            +
          </div>
          <p className="font-mono text-[20px] tracking-[0.28em] text-muted transition group-hover:text-ink">
            {copy.join.drag}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
            {copy.join.limit}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
