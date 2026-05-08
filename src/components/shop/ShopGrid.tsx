"use client";

import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { ShopCard } from "@/components/cards/ShopCard";
import type { ShopProduct } from "@/lib/types";

interface ShopGridProps {
  products: ShopProduct[];
  categories: readonly string[];
}

export function ShopGrid({ products, categories }: ShopGridProps) {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? products : products.filter((p) => p.cat === filter);

  return (
    <>
      <div className="mb-8">
        <FilterPills options={categories} active={filter} onChange={setFilter} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ShopCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
