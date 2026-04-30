import { getLocalizedTickerItems } from "@/lib/data/home";
import type { SupportedLocale } from "@/types/i18n";

const toneMap = {
  default: "text-ink/75",
  gold: "text-gold",
  red: "text-red",
} as const;

type TickerStripProps = {
  locale: SupportedLocale;
};

export function TickerStrip({ locale }: TickerStripProps) {
  const tickerItems = getLocalizedTickerItems(locale);
  const items = [...tickerItems, ...tickerItems];

  return (
    <section className="bg-white/42 group mx-4 overflow-hidden rounded-[999px] shadow-[inset_5px_5px_12px_rgba(40,62,66,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] md:mx-10">
      <div className="ticker-track flex h-[46px] items-center whitespace-nowrap group-hover:[animation-play-state:paused]">
        {items.map((item, index) => (
          <span
            key={`${item.text}-${index}`}
            className={`inline-flex items-center gap-5 px-5 font-mono text-[13px] tracking-[0.22em] ${
              toneMap[item.tone ?? "default"]
            }`}
          >
            {item.text}
            <span className="text-[8px] text-red/45">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
