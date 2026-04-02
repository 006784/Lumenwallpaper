import { tickerItems } from "@/lib/data/home";

const toneMap = {
  default: "text-paper/80",
  gold: "text-gold",
  red: "text-[#ff4444]",
} as const;

export function TickerStrip() {
  const items = [...tickerItems, ...tickerItems];

  return (
    <section className="group overflow-hidden border-b-frame border-ink bg-ink">
      <div className="ticker-track group-hover:[animation-play-state:paused] flex h-[46px] items-center whitespace-nowrap">
        {items.map((item, index) => (
          <span
            key={`${item.text}-${index}`}
            className={`inline-flex items-center gap-5 px-5 font-mono text-[13px] tracking-[0.22em] ${
              toneMap[item.tone ?? "default"]
            }`}
          >
            {item.text}
            <span className="text-[8px] text-paper/25">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}
