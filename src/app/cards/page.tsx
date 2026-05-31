import { Suspense } from "react";
import { CARDS, SERIES } from "@/lib/data";
import { CardCollectionGrid } from "@/components/cards/CardCollectionGrid";

export const metadata = {
  title: "Cards for Sale",
  description: "Browse and shop our Pokémon card collection. Message us to buy direct.",
};

export default function CardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
          All Cards
        </h1>
        <p className="text-sm text-text-secondary">
          Browse the full collection. Click any card for details. Tap "Message me to buy" to start a chat.
        </p>
      </header>
      <Suspense fallback={<div className="text-text-secondary text-sm">Loading cards…</div>}>
        <CardCollectionGrid cards={CARDS} series={SERIES} />
      </Suspense>
    </div>
  );
}
