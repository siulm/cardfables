import { Button } from "@/components/ui/Button";
import type { CardInfo } from "@/lib/types";

interface CardSidebarProps {
  cards: CardInfo[];
  seriesColor: string;
  mode: "junior" | "full";
}

export function CardSidebar({ cards, seriesColor, mode }: CardSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      {/* Card placeholders */}
      <div className="flex flex-col gap-3">
        {cards.map((card, ci) => (
          <div
            key={ci}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
            style={{
              aspectRatio: cards.length > 1 ? "3/2" : "2.5/3.5",
              background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}66, #1a1a2e)`,
              boxShadow: `0 0 40px ${seriesColor}15, 0 16px 48px rgba(0,0,0,0.4)`,
            }}
          >
            <span className={cards.length > 1 ? "text-4xl" : "text-5xl"}>
              {card.emoji}
            </span>
            <span className="mt-1 text-xs font-semibold text-white/65">
              {card.name}
            </span>
            <span className="mt-0.5 text-[11px] text-white/35">
              Your card image here
            </span>
            {cards.length > 1 && (
              <div className="absolute top-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold tracking-wider backdrop-blur-sm">
                CARD {ci + 1} OF {cards.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card info */}
      <div
        className="mt-3.5 rounded-xl border border-border p-4"
        style={{ background: "var(--color-surface-light, #1a1a2e)" }}
      >
        {cards.map((card, ci) => (
          <div key={ci} className={ci < cards.length - 1 ? "mb-3" : ""}>
            <h3 className="mb-0.5 text-[13px] font-bold text-text-primary">
              {card.name}
            </h3>
            <p className="text-xs text-text-dim">
              {card.set} &middot; Art by {card.artist}
            </p>
            {ci < cards.length - 1 && (
              <div className="mt-3 h-px bg-border" />
            )}
          </div>
        ))}

        <Button href="#" className="mt-3.5 w-full">
          Buy {cards.length > 1 ? "These Cards" : "This Card"}
        </Button>
      </div>

      {/* Reading level info */}
      <div
        className="mt-3.5 rounded-xl border p-3.5"
        style={{
          background:
            mode === "junior"
              ? "rgba(34,197,94,0.06)"
              : "rgba(232,101,26,0.06)",
          borderColor:
            mode === "junior"
              ? "rgba(34,197,94,0.12)"
              : "rgba(232,101,26,0.12)",
        }}
      >
        <div
          className="mb-1 text-xs font-bold"
          style={{ color: mode === "junior" ? "#22C55E" : "#E8651A" }}
        >
          {mode === "junior" ? "\u{1F423} Junior Fables" : "\u{1F525} Full Fables"}
        </div>
        <p className="text-xs leading-relaxed text-text-dim">
          {mode === "junior"
            ? "Written for ages 6\u201311. Shorter sentences, simpler words, all the fun. Perfect for reading together!"
            : "Written for ages 12 and up. Richer vocabulary, deeper emotions, dramatic storytelling."}
        </p>
      </div>
    </aside>
  );
}
