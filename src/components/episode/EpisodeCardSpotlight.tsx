import Link from "next/link";
import type { CardInfo } from "@/lib/types";
import { SHOP } from "@/lib/data";
import { resolveCardBuyUrl, buyShortLabelFor } from "@/lib/shopMatch";

interface EpisodeCardSpotlightProps {
  cards: CardInfo[];
  seriesColor: string;
}

export function EpisodeCardSpotlight({
  cards,
  seriesColor,
}: EpisodeCardSpotlightProps) {
  if (cards.length === 0) return null;
  const single = cards.length === 1;

  return (
    <section
      className="mt-12 rounded-2xl border border-dashed p-6"
      style={{
        borderColor: `${seriesColor}55`,
        background: `linear-gradient(180deg, ${seriesColor}06, transparent)`,
      }}
    >
      <h2 className="mb-1 text-center font-heading text-lg font-bold text-text-primary">
        Cards from this episode
      </h2>
      <p className="mb-5 text-center text-xs text-text-dim">
        Want the real card? Tap to shop.
      </p>
      <div
        className={`flex gap-4 ${
          single ? "justify-center" : "flex-wrap justify-center"
        }`}
      >
        {cards.map((card, i) => {
          const buy = resolveCardBuyUrl(SHOP, card);
          const w = single ? 200 : 140;
          const h = single ? 280 : 196;
          return (
            <div
              key={i}
              className="hover-lift flex flex-col items-center rounded-xl"
              style={{ width: w, padding: 4 }}
            >
              <div
                className="relative overflow-hidden rounded-xl"
                style={{
                  width: w,
                  height: h,
                  boxShadow: `0 0 0 1px ${seriesColor}22, 0 12px 32px rgba(0,0,0,0.10)`,
                }}
              >
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}55, ${seriesColor}22)`,
                    }}
                  >
                    <span className="text-4xl">{card.emoji}</span>
                  </div>
                )}
              </div>
              <div className="mt-2.5 text-center">
                <div className="text-[13px] font-bold text-text-primary">
                  {card.name}
                </div>
                <div className="text-[11px] text-text-dim">{card.set}</div>
              </div>
              {buy.external ? (
                <a
                  href={buy.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-[#FFFEF7] transition-opacity hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #D4893A, #B86E28)",
                  }}
                >
                  {buyShortLabelFor(buy)}
                </a>
              ) : (
                <Link
                  href={buy.url}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:border-[rgba(212,137,58,0.3)] hover:text-text-primary"
                >
                  {buyShortLabelFor(buy)}
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[10px] text-text-dim">
        {spotlightFooterMicrocopy(cards)}
      </p>
    </section>
  );
}

function spotlightFooterMicrocopy(cards: CardInfo[]): string {
  const dests = new Set(
    cards.map((c) => resolveCardBuyUrl(SHOP, c).destination)
  );
  if (dests.has("amazon") && dests.has("messenger")) {
    return "Some links open Amazon, some open Messenger — ask a parent first!";
  }
  if (dests.has("amazon")) {
    return "Amazon links open in a new tab — ask a parent first!";
  }
  if (dests.has("messenger")) {
    return "Opens Messenger to chat with the seller";
  }
  return "Browse related cards on our shop page";
}
