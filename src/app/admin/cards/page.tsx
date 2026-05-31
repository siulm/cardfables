"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../context";
import type { CardCollectionEntry, CardStatus } from "@/lib/types";

const STATUS_COLORS: Record<CardStatus, { bg: string; fg: string }> = {
  available: { bg: "rgba(34,197,94,0.10)", fg: "#16A34A" },
  sold: { bg: "rgba(74,64,53,0.10)", fg: "#7A6E5E" },
  reserved: { bg: "rgba(234,179,8,0.12)", fg: "#A16207" },
  hidden: { bg: "rgba(74,64,53,0.04)", fg: "#9B8F7E" },
};

export default function AdminCardsPage() {
  const { authenticated } = useAdmin();
  const [cards, setCards] = useState<CardCollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CardStatus | "all">("all");

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

  return (
    <div className="p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Cards</h1>
          <p className="text-sm text-text-secondary">
            {filtered.length} of {cards.length} cards
          </p>
        </div>
        <div className="flex gap-2">
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
