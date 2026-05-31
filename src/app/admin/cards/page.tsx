"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../context";
import type { CardCollectionEntry, CardStatus } from "@/lib/types";
import type { RefreshPriceResult } from "@/app/api/cards/refresh-prices/route";

const STATUS_COLORS: Record<CardStatus, { bg: string; fg: string }> = {
  available: { bg: "rgba(34,197,94,0.10)", fg: "#16A34A" },
  sold: { bg: "rgba(74,64,53,0.10)", fg: "#7A6E5E" },
  reserved: { bg: "rgba(234,179,8,0.12)", fg: "#A16207" },
  hidden: { bg: "rgba(74,64,53,0.04)", fg: "#9B8F7E" },
};

function getPriceAgeLabel(cards: CardCollectionEntry[]): {
  label: string;
  overdue: boolean;
} {
  const dates = cards
    .map((c) => c.priceCheckedAt)
    .filter((d): d is string => !!d)
    .sort()
    .reverse();

  if (dates.length === 0) {
    return { label: "Prices never reviewed", overdue: true };
  }

  const newest = new Date(dates[0]);
  const now = new Date();
  const diffMs = now.getTime() - newest.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return { label: "Prices reviewed today", overdue: false };
  }
  if (days === 1) {
    return { label: "Prices last reviewed 1 day ago", overdue: false };
  }
  return {
    label: `Prices last reviewed ${days} days ago`,
    overdue: days > 14,
  };
}

function pctChange(prev: number | null, next: number | null): string {
  if (prev == null || next == null || prev === 0) return "—";
  const pct = ((next - prev) / prev) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export default function AdminCardsPage() {
  const { authenticated } = useAdmin();
  const [cards, setCards] = useState<CardCollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CardStatus | "all">("all");

  // Review Prices state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewResults, setReviewResults] = useState<RefreshPriceResult[] | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/cards")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .finally(() => setLoading(false));
  }, [authenticated]);

  if (!authenticated) return null;
  if (loading) return <div className="p-6 text-text-secondary">Loading cards…</div>;

  const filtered = cards.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (c.name + " " + c.set).toLowerCase().includes(q);
    }
    return true;
  });

  const updateCard = async (id: string, updates: Partial<CardCollectionEntry>) => {
    const res = await fetch(`/api/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      alert("Failed to update");
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleConfirmRefresh = async () => {
    setShowConfirmModal(false);
    setRefreshing(true);
    setRefreshError(null);
    setReviewResults(null);

    try {
      const res = await fetch("/api/cards/refresh-prices", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRefreshError((data as { error?: string }).error ?? "Request failed");
        return;
      }
      const data = (await res.json()) as { results: RefreshPriceResult[] };
      setReviewResults(data.results);
      // Refresh local cards list so age label updates
      const updated = await fetch("/api/cards").then((r) => r.json());
      setCards(updated.cards ?? cards);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefreshing(false);
    }
  };

  const { label: priceAgeLabel, overdue: priceOverdue } = getPriceAgeLabel(cards);

  return (
    <div className="p-6">
      {/* Confirm modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="mb-3 font-heading text-lg font-bold text-text-primary">
              Refresh price suggestions?
            </h2>
            <p className="mb-5 text-sm text-text-secondary">
              Fetch current market prices for all {cards.length} cards from the
              Pokémon TCG API? This won&apos;t change your set prices — it refreshes
              suggestions for review.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefresh}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-bold text-white"
              >
                Fetch prices
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Cards</h1>
          <p className="text-sm text-text-secondary">
            {filtered.length} of {cards.length} cards
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Price age label */}
          <span
            className={[
              "text-xs font-medium",
              priceOverdue ? "font-bold text-amber-600" : "text-text-secondary",
            ].join(" ")}
          >
            {priceAgeLabel}
          </span>

          {/* Review Prices button */}
          <button
            type="button"
            disabled={refreshing}
            onClick={() => setShowConfirmModal(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary disabled:opacity-50"
          >
            {refreshing ? "Fetching…" : "Review Prices"}
          </button>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CardStatus | "all")}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
            <option value="hidden">Hidden</option>
          </select>
          <a
            href="/admin/cards/new"
            className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-white"
          >
            + Add Card
          </a>
        </div>
      </header>

      {/* Error banner */}
      {refreshError && (
        <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Price refresh failed: {refreshError}
        </div>
      )}

      {/* Review table */}
      {reviewResults && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="font-heading text-base font-bold text-text-primary">
              Price Review
            </h2>
            <p className="text-xs text-text-secondary">
              Your prices are unchanged. Review suggestions and edit any you want to
              update.
            </p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-surface-light text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-3 py-2 text-left">Card</th>
                <th className="px-3 py-2 text-right">Your Price</th>
                <th className="px-3 py-2 text-right">Prev. Suggestion</th>
                <th className="px-3 py-2 text-right">New Suggestion</th>
                <th className="px-3 py-2 text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {reviewResults.map((r) => {
                const change = pctChange(r.previousSuggestion, r.newSuggestion);
                const changePositive =
                  r.previousSuggestion != null &&
                  r.newSuggestion != null &&
                  r.newSuggestion > r.previousSuggestion;
                const changeNegative =
                  r.previousSuggestion != null &&
                  r.newSuggestion != null &&
                  r.newSuggestion < r.previousSuggestion;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-text-primary">
                      {r.name}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-gold">
                      ${r.price}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {r.previousSuggestion != null ? `$${r.previousSuggestion}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-text-primary">
                      {r.newSuggestion != null ? `$${r.newSuggestion}` : "—"}
                    </td>
                    <td
                      className={[
                        "px-3 py-2 text-right text-xs font-bold",
                        changePositive ? "text-green-600" : "",
                        changeNegative ? "text-red-600" : "",
                        !changePositive && !changeNegative ? "text-text-secondary" : "",
                      ].join(" ")}
                    >
                      {change}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2 text-xs text-text-secondary">
            {reviewResults.filter((r) => r.newSuggestion != null).length} of{" "}
            {reviewResults.length} cards matched in the Pokémon TCG API
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-light text-xs uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Image</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Set · Year</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Cond.</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const sc = STATUS_COLORS[c.status];
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    {c.image ? (
                      <img src={c.image} alt="" className="h-12 w-9 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-9 items-center justify-center rounded bg-surface-light text-xs">🎴</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-text-primary">{c.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.set} · {c.year}</td>
                  <td className="px-3 py-2 font-bold text-gold">${c.price}{c.originalPrice ? <span className="ml-1 text-xs text-text-dim line-through">${c.originalPrice}</span> : null}</td>
                  <td className="px-3 py-2">{c.condition}</td>
                  <td className="px-3 py-2">
                    <select
                      value={c.status}
                      onChange={(e) => updateCard(c.id, { status: e.target.value as CardStatus })}
                      className="rounded px-1.5 py-0.5 text-xs font-bold uppercase"
                      style={{ background: sc.bg, color: sc.fg }}
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{c.stock ?? 1}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                      className="mr-2 text-xs font-medium text-text-secondary underline"
                    >
                      {editingId === c.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCard(c.id)}
                      className="text-xs font-medium text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-secondary">
          No cards match the filter.
        </div>
      )}
    </div>
  );
}
