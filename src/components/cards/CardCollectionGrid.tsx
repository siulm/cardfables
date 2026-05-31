"use client";

import { useState, useMemo } from "react";
import { CardCollectionItem } from "./CardCollectionItem";
import { findEpisodeForCard } from "@/lib/cardsCollection";
import type { CardCollectionEntry, Series } from "@/lib/types";

interface CardCollectionGridProps {
  cards: CardCollectionEntry[];
  series: Series[];
}

export function CardCollectionGrid({ cards, series }: CardCollectionGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);

  const visibleCards = useMemo(
    () => cards.filter((c) => c.status !== "hidden"),
    [cards]
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleCards.map((card) => {
          const ep = findEpisodeForCard(series, card);
          return (
            <CardCollectionItem
              key={card.id}
              card={card}
              onClick={setSelectedCard}
              episodeBadge={ep ? { href: `/series/${ep.series.id}/${ep.episode.slug}` } : undefined}
            />
          );
        })}
      </div>
      {/* Detail overlay added in Task 6 */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div className="rounded-2xl bg-bg p-6 text-text-primary">
            Detail view for {selectedCard.name} — coming in Task 6
          </div>
        </div>
      )}
    </>
  );
}
