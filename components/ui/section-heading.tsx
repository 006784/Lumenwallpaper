type SectionHeadingProps = {
  eyebrow: string;
  hint?: React.ReactNode;
  title: React.ReactNode;
};

export function SectionHeading({ eyebrow, hint, title }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-4 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-muted">
          <span className="h-px w-6 bg-current opacity-40" />
          {eyebrow}
        </p>
        <div className="font-display text-[clamp(2.25rem,5vw,4rem)] leading-none tracking-[-0.04em]">
          {title}
        </div>
      </div>
      {hint ? (
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted">
          {hint}
        </div>
      ) : null}
    </div>
  );
}
