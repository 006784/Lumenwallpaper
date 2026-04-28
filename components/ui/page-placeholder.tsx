import { FrameButton } from "@/components/ui/frame-button";

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  primaryHref = "/",
  primaryLabel = "返回首页",
}: PagePlaceholderProps) {
  return (
    <section className="glass-panel-grid px-4 py-24 md:px-10 md:py-32">
      <div className="glass-surface mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
        <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-red">
          {eyebrow}
        </p>
        <h1 className="max-w-3xl font-body text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[1.02]">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-muted md:text-base">
          {description}
        </p>
        <div className="mt-8">
          <FrameButton href={primaryHref}>{primaryLabel}</FrameButton>
        </div>
      </div>
    </section>
  );
}
