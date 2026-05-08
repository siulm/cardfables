"use client";

import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { SeriesCard } from "@/components/cards/SeriesCard";
import type { Series } from "@/lib/types";

interface BrowseGridProps {
  series: Series[];
  browseTypes: readonly string[];
}

export function BrowseGrid({ series, browseTypes }: BrowseGridProps) {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? series : series.filter((s) => s.type === filter);

  return (
    <>
      <div className="mb-8">
        <FilterPills options={browseTypes} active={filter} onChange={setFilter} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </>
  );
}
