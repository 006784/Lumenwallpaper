type SectionHeadingProps = {
  eyebrow: string;
  hint?: React.ReactNode;
  title: React.ReactNode;
};

export function SectionHeading({ eyebrow, hint, title }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-3 inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.3em] text-muted sm:mb-4 sm:text-[10px] sm:tracking-[0.35em]">
          <span className="h-px w-6 bg-current opacity-40" />
          {eyebrow}
        </p>
        <div className="font-display text-[clamp(1.95rem,8vw,4rem)] leading-[0.96] tracking-[-0.05em]">
          {title}
        </div>
      </div>
      {hint ? (
        <div className="max-w-[18rem] text-[10px] uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.2em] lg:text-right">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
