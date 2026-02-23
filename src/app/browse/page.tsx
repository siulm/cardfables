"use client";

import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { SeriesCard } from "@/components/cards/SeriesCard";
import { SERIES, BROWSE_TYPES } from "@/lib/data";

export default function BrowsePage() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? SERIES : SERIES.filter((s) => s.type === filter);
  const totalEps = SERIES.reduce((sum, s) => sum + s.epCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        Browse All Series
      </h1>
      <p className="mb-8 text-sm text-text-secondary">
        {SERIES.length} series &middot; {totalEps} episode
        {totalEps !== 1 ? "s" : ""} and counting
      </p>

      <div className="mb-8">
        <FilterPills
          options={BROWSE_TYPES}
          active={filter}
          onChange={setFilter}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  );
}
