import { tickerItems } from "@/lib/data/home";

const toneMap = {
  default: "text-ink/75",
  gold: "text-gold",
  red: "text-red",
} as const;

export function TickerStrip() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <section className="group mx-4 overflow-hidden rounded-[999px] bg-white/42 shadow-[inset_5px_5px_12px_rgba(40,62,66,0.08),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] md:mx-10">
      <div className="ticker-track group-hover:[animation-play-state:paused] flex h-[46px] items-center whitespace-nowrap">
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
