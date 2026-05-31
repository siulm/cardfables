"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardCollectionItem } from "./CardCollectionItem";
import { CardCollectionFilters } from "./CardCollectionFilters";
import { CardDetailOverlay } from "./CardDetailOverlay";
import {
  filterCards,
  searchCards,
  sortCards,
  groupCards,
  findEpisodeForCard,
  type CardFilters,
  type CardSort,
  type CardGrouping,
} from "@/lib/cardsCollection";
import type { CardCollectionEntry, Series, PokemonType, CardCondition } from "@/lib/types";

interface CardCollectionGridProps {
  cards: CardCollectionEntry[];
  series: Series[];
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseNumberList(value: string | null): number[] {
  return parseList(value).map(Number).filter((n) => !Number.isNaN(n));
}

export function CardCollectionGrid({ cards, series }: CardCollectionGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleCardClick = (card: CardCollectionEntry, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setAnchor({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    } else {
      setAnchor(null);
    }
    setSelectedCard(card);
  };

  // Parse state from URL — status defaults to "available-only" so sold cards are hidden by default
  const filters: CardFilters = useMemo(
    () => ({
      types: parseList(searchParams.get("type")) as PokemonType[],
      sets: parseList(searchParams.get("set")),
      years: parseNumberList(searchParams.get("year")),
      conditions: parseList(searchParams.get("cond")) as CardCondition[],
      rarities: parseList(searchParams.get("rarity")),
      status: searchParams.get("status") === "include-sold" ? "include-sold" : "available-only",
    }),
    [searchParams]
  );
  const search = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as CardSort) ?? "recently-added";
  const grouping = (searchParams.get("group") as CardGrouping) ?? "none";

  const updateUrl = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      const qs = params.toString();
      router.replace(qs ? `/cards?${qs}` : "/cards", { scroll: false });
    },
    [router, searchParams]
  );

  const onFiltersChange = (next: CardFilters) => {
    updateUrl((params) => {
      const setOrDel = (key: string, val: string) => {
        if (val) params.set(key, val);
        else params.delete(key);
      };
      setOrDel("type", (next.types ?? []).join(","));
      setOrDel("set", (next.sets ?? []).join(","));
      setOrDel("year", (next.years ?? []).join(","));
      setOrDel("cond", (next.conditions ?? []).join(","));
      setOrDel("rarity", (next.rarities ?? []).join(","));
      if (next.status === "include-sold") params.set("status", "include-sold");
      else params.delete("status");
    });
  };
  const onSearchChange = (q: string) =>
    updateUrl((p) => (q ? p.set("q", q) : p.delete("q")));
  const onSortChange = (s: CardSort) =>
    updateUrl((p) => (s === "recently-added" ? p.delete("sort") : p.set("sort", s)));
  const onGroupingChange = (g: CardGrouping) =>
    updateUrl((p) => (g === "none" ? p.delete("group") : p.set("group", g)));
  const onClearAll = () => router.replace("/cards", { scroll: false });

  // Compute available filter options from data
  const availableSets = useMemo(
    () => [...new Set(cards.map((c) => c.set))].filter(Boolean).sort(),
    [cards]
  );
  const availableYears = useMemo(
    () => [...new Set(cards.map((c) => c.year))].sort((a, b) => b - a),
    [cards]
  );
  const availableRarities = useMemo(
    () => [...new Set(cards.map((c) => c.rarity))].filter(Boolean).sort(),
    [cards]
  );

  // Apply pipeline: filter → search → sort → group
  const groups = useMemo(() => {
    const filtered = filterCards(cards, filters);
    const searched = searchCards(filtered, search);
    const sorted = sortCards(searched, sort);
    return groupCards(sorted, grouping);
  }, [cards, filters, search, sort, grouping]);

  const totalVisible = groups.reduce((sum, g) => sum + g.cards.length, 0);
  const soldCount = cards.filter((c) => c.status === "sold").length;
  const availableCount = cards.filter((c) => c.status === "available").length;

  return (
    <div className="flex gap-6">
      <CardCollectionFilters
        filters={filters}
        search={search}
        sort={sort}
        grouping={grouping}
        availableSets={availableSets}
        availableYears={availableYears}
        availableRarities={availableRarities}
        onFiltersChange={onFiltersChange}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onGroupingChange={onGroupingChange}
        onClearAll={onClearAll}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {totalVisible} of {availableCount} available
            {soldCount > 0 && <> · {soldCount} sold</>}
          </p>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as CardSort)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
              aria-label="Sort cards"
            >
              <option value="recently-added">Recently added</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rarity-desc">Rarity: rare first</option>
            </select>
            <select
              value={grouping}
              onChange={(e) => onGroupingChange(e.target.value as CardGrouping)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
              aria-label="Group cards"
            >
              <option value="none">No grouping</option>
              <option value="by-year">Group by year</option>
              <option value="by-set">Group by set</option>
            </select>
          </div>
        </div>

        {groups.map((group) => (
          <section key={group.key || "all"} className="mb-8">
            {group.key && (
              <h2 className="mb-4 font-heading text-xl font-bold text-text-primary">
                {group.label} <span className="text-sm font-normal text-text-dim">({group.cards.length} cards)</span>
              </h2>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {group.cards.map((card) => {
                const ep = findEpisodeForCard(series, card);
                return (
                  <CardCollectionItem
                    key={card.id}
                    card={card}
                    onClick={(c, e) => handleCardClick(c, e)}
                    episodeBadge={ep ? { href: `/series/${ep.series.id}/${ep.episode.slug}` } : undefined}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {totalVisible === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-text-secondary">No cards match these filters.</p>
            <button
              type="button"
              onClick={onClearAll}
              className="mt-3 text-sm font-medium text-gold underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {selectedCard && (
        <CardDetailOverlay
          card={selectedCard}
          series={series}
          onClose={() => {
            setSelectedCard(null);
            setAnchor(null);
          }}
          anchor={anchor}
        />
      )}
    </div>
  );
}
