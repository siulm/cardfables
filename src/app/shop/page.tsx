"use client";

import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { ShopCard } from "@/components/cards/ShopCard";
import { SHOP, SHOP_CATEGORIES } from "@/lib/data";

export default function ShopPage() {
  const [filter, setFilter] = useState("All");

  const filtered =
    filter === "All" ? SHOP : SHOP.filter((p) => p.cat === filter);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        {"\u{1F6D2}"} The Card Shop
      </h1>
      <p className="mb-8 text-sm text-text-secondary">
        Own the cards from the stories. Every purchase helps keep the fables
        going.
      </p>

      <div className="mb-8">
        <FilterPills
          options={SHOP_CATEGORIES}
          active={filter}
          onChange={setFilter}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <ShopCard key={product.id} product={product} />
        ))}
      </div>

      <p className="mt-12 text-center text-xs text-text-dim">
        As an Amazon Associate I earn from qualifying purchases. Prices
        approximate.
      </p>
    </div>
  );
}
