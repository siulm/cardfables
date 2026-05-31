"use client";

import { useState } from "react";
import type { CardCondition, PokemonType } from "@/lib/types";
import type { CardFilters, CardSort, CardGrouping } from "@/lib/cardsCollection";

const TYPES: PokemonType[] = ["Fire", "Water", "Grass", "Electric", "Dark", "Steel", "Psychic", "Fighting", "Normal", "Dragon", "Fairy"];
const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

interface FilterBarProps {
  filters: CardFilters;
  search: string;
  sort: CardSort;
  grouping: CardGrouping;
  availableSets: string[];
  availableYears: number[];
  availableRarities: string[];
  onFiltersChange: (f: CardFilters) => void;
  onSearchChange: (q: string) => void;
  onSortChange: (s: CardSort) => void;
  onGroupingChange: (g: CardGrouping) => void;
  onClearAll: () => void;
}

function toggleArrayValue<T>(arr: T[] | undefined, value: T): T[] {
  const set = new Set(arr ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
}

function ChipGroup<T extends string | number>(props: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {props.label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {props.options.map((opt) => {
          const active = props.selected.includes(opt);
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => props.onChange(toggleArrayValue(props.selected, opt))}
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors"
              style={{
                background: active ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
                borderColor: active ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
                color: active ? "#D4893A" : "var(--color-text-secondary)",
              }}
            >
              {String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CardCollectionFilters(props: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const filterContent = (
    <div className="p-4">
      <div className="mb-3">
        <input
          type="search"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder="Search name, set, artist…"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
        />
      </div>
      <ChipGroup
        label="Type"
        options={TYPES}
        selected={props.filters.types ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, types: next })}
      />
      <ChipGroup
        label="Set"
        options={props.availableSets}
        selected={props.filters.sets ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, sets: next })}
      />
      <ChipGroup
        label="Year"
        options={props.availableYears}
        selected={props.filters.years ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, years: next })}
      />
      <ChipGroup
        label="Condition"
        options={CONDITIONS}
        selected={props.filters.conditions ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, conditions: next })}
      />
      <ChipGroup
        label="Rarity"
        options={props.availableRarities}
        selected={props.filters.rarities ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, rarities: next })}
      />
      <div className="mb-3">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Status
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => props.onFiltersChange({ ...props.filters, status: "available-only" })}
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: (props.filters.status ?? "available-only") === "available-only" ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
              borderColor: (props.filters.status ?? "available-only") === "available-only" ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
              color: (props.filters.status ?? "available-only") === "available-only" ? "#D4893A" : "var(--color-text-secondary)",
            }}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => props.onFiltersChange({ ...props.filters, status: "include-sold" })}
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: props.filters.status === "include-sold" ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
              borderColor: props.filters.status === "include-sold" ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
              color: props.filters.status === "include-sold" ? "#D4893A" : "var(--color-text-secondary)",
            }}
          >
            Include Sold
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={props.onClearAll}
        className="mt-2 text-xs font-medium text-text-secondary underline hover:text-text-primary"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="sticky top-24 rounded-2xl border border-border bg-surface">
          {filterContent}
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden mb-4 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary"
      >
        Filters & Sort
      </button>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg px-4 py-3">
              <h2 className="font-bold text-text-primary">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-secondary"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
