import { Suspense } from "react";
import { CARDS, SERIES } from "@/lib/data";
import { CardCollectionGrid } from "@/components/cards/CardCollectionGrid";

export const metadata = {
  title: "Cards for Sale",
  description: "Browse and shop our Pokémon card collection. Message us to buy direct.",
};

export default function CardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="mb-2 font-heading text-4xl font-bold text-gold sm:text-5xl">
          The Collection
        </h1>
        <p className="text-sm text-text-secondary">
          Every card I&apos;ve photographed, ready for a new home. Click any card for
          details &mdash; tap &ldquo;Message me to buy&rdquo; to start a chat.
        </p>
      </header>
      <Suspense fallback={<div className="text-text-secondary text-sm">Loading cards…</div>}>
        <CardCollectionGrid cards={CARDS} series={SERIES} />
      </Suspense>
    </div>
  );
}
