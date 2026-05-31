"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { CardCollectionEntry, Series } from "@/lib/types";
import { CURRENCY } from "@/lib/data";
import { findEpisodeForCard, isComingSoon, formatPrice } from "@/lib/cardsCollection";

interface CardDetailOverlayProps {
  card: CardCollectionEntry;
  series: Series[];
  onClose: () => void;
  // anchor is accepted for compatibility but no longer used (centered modal).
  anchor?: { x: number; y: number; width: number; height: number } | null;
}

function prefilledMessage(card: CardCollectionEntry): string {
  return `Hi! I'm interested in: ${card.name} — ${card.set} (${card.year}) — ${formatPrice(card.price, CURRENCY)}`;
}

const RARITY_COLORS: Record<string, string> = {
  SAR: "#D4893A",
  "Full Art": "#9B7AC4",
  Holo: "#8FA8B8",
  Promo: "#22C55E",
  Rare: "#5B9BD5",
};

export function CardDetailOverlay({ card, series, onClose }: CardDetailOverlayProps) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ep = findEpisodeForCard(series, card);
  const isAvailable = card.status === "available";
  const comingSoon = isComingSoon(card);
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#7A6E5E";

  const handleBuy = async () => {
    try {
      await navigator.clipboard.writeText(prefilledMessage(card));
    } catch {
      // ignore — clipboard might be blocked on some browsers
    }
    const url = `https://m.me/cardfables?ref=${encodeURIComponent(card.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Dimmed backdrop so the card stands out from the grid */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-2xl border border-[rgba(212,137,58,0.35)] bg-surface shadow-2xl sm:flex-row sm:gap-6 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-sm font-bold text-white backdrop-blur-sm hover:bg-black/60"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Image */}
        <div className="p-4 sm:p-0 sm:w-[44%] sm:flex-shrink-0">
          <div className="relative mx-auto aspect-[2.5/3.5] w-full max-w-[340px] overflow-hidden rounded-xl bg-surface-light">
            {card.image ? (
              <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-7xl">🎴</div>
            )}
            <span
              className="absolute top-3 right-3 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ background: rarityColor }}
            >
              {card.rarity}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 px-5 pb-6 sm:px-0 sm:py-1">
          <h2 className="font-heading text-2xl font-bold text-text-primary">{card.name}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {card.set} · {card.year}
            {card.setNumber && ` · ${card.setNumber}`}
          </p>
          <p className="mt-1 text-xs text-text-dim">
            {card.condition}
            {card.artist && ` · Art by ${card.artist}`}
          </p>

          {card.description && (
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.description}</p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            {comingSoon ? (
              <span className="rounded-md bg-surface-light px-3 py-1 text-sm font-bold uppercase tracking-wider text-text-dim">
                Coming Soon
              </span>
            ) : (
              <>
                {card.originalPrice && card.originalPrice > card.price && (
                  <span className="text-sm text-text-dim line-through">
                    {formatPrice(card.originalPrice, CURRENCY)}
                  </span>
                )}
                <span className="font-heading text-3xl font-bold text-gold">
                  {formatPrice(card.price, CURRENCY)}
                </span>
              </>
            )}
          </div>

          {comingSoon ? (
            <div className="mt-4 rounded-xl border border-border bg-surface-light px-5 py-3 text-center text-sm font-bold text-text-dim">
              Coming Soon — not yet for sale
            </div>
          ) : isAvailable ? (
            <>
              <button
                type="button"
                onClick={handleBuy}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-[#FFFEF7]"
                style={{
                  background: "linear-gradient(135deg, #D4893A, #B86E28)",
                  boxShadow: "0 8px 28px rgba(212,137,58,0.25)",
                }}
              >
                Message me to buy ↗
              </button>
              <p className="mt-2 text-center text-[10px] text-text-dim">
                Message copied to clipboard — paste it into Messenger to start the conversation
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-border bg-surface-light px-5 py-3 text-center text-sm font-bold text-text-dim">
              {card.status === "sold" ? "Sold" : card.status === "reserved" ? "Reserved" : "Not available"}
            </div>
          )}

          {ep && (
            <Link
              href={`/series/${ep.series.id}/${ep.episode.slug}`}
              className="mt-3 block text-center text-sm font-medium text-text-secondary underline hover:text-gold"
              onClick={onClose}
            >
              📖 Read the story →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
