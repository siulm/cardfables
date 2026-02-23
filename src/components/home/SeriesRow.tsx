"use client";

import { SeriesCard } from "@/components/cards/SeriesCard";
import type { Series } from "@/lib/types";

interface SeriesRowProps {
  title: string;
  emoji: string;
  series: Series[];
}

export function SeriesRow({ title, emoji, series }: SeriesRowProps) {
  return (
    <section className="py-6">
      <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-text-primary">
        <span>{emoji}</span> {title}
      </h2>
      <div className="hrow">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </section>
  );
}
