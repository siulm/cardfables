"use client";

import type React from "react";
import type { CardCollectionEntry } from "@/lib/types";
import { CURRENCY } from "@/lib/data";

interface CardCollectionItemProps {
  card: CardCollectionEntry;
  onClick: (card: CardCollectionEntry, event?: React.MouseEvent<HTMLButtonElement>) => void;
  episodeBadge?: { href: string };
}

function formatPrice(n: number): string {
  if (CURRENCY === "USD") return `$${n}`;
  if (CURRENCY === "JPY") return `¥${n.toLocaleString()}`;
  return `${CURRENCY} ${n}`;
}

const RARITY_COLORS: Record<string, string> = {
  SAR: "#D4893A",
  "Full Art": "#9B7AC4",
  Holo: "#8FA8B8",
  Promo: "#22C55E",
  Rare: "#5B9BD5",
};

export function CardCollectionItem({ card, onClick, episodeBadge }: CardCollectionItemProps) {
  const isSold = card.status === "sold";
  const isReserved = card.status === "reserved";
  const showStockBadge = (card.stock ?? 1) > 1;
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#7A6E5E";

  return (
    <button
      type="button"
      onClick={(e) => onClick(card, e)}
      className="hover-lift group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left p-0"
      aria-label={`View details for ${card.name}`}
      style={{ opacity: isSold ? 0.55 : 1, cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden bg-surface-light">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {card.type === "Fire" ? "🔥" :
             card.type === "Water" ? "💧" :
             card.type === "Grass" ? "🌿" :
             card.type === "Electric" ? "⚡" :
             card.type === "Dark" ? "👻" :
             card.type === "Steel" ? "🛡️" :
             card.type === "Psychic" ? "🔮" :
             card.type === "Dragon" ? "🐉" :
             "🎴"}
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isSold && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              SOLD
            </span>
          )}
          {isReserved && (
            <span className="rounded-md bg-yellow-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              RESERVED
            </span>
          )}
          {showStockBadge && !isSold && (
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {card.stock} AVAILABLE
            </span>
          )}
          {episodeBadge && (
            <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold text-white">
              📖 STORY
            </span>
          )}
        </div>

        {/* Rarity tag */}
        <div
          className="absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: rarityColor }}
        >
          {card.rarity}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-bold text-text-primary">{card.name}</h3>
        <p className="truncate text-xs text-text-secondary">
          {card.set} · {card.year}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          {card.originalPrice && card.originalPrice > card.price && (
            <span className="text-xs text-text-dim line-through">
              {formatPrice(card.originalPrice)}
            </span>
          )}
          <span className="text-base font-bold text-gold">
            {formatPrice(card.price)}
          </span>
        </div>
      </div>
    </button>
  );
}
