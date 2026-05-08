"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdmin } from "../context";

interface Card {
  name: string;
  set: string;
  emoji: string;
  sold?: boolean;
}

interface Episode {
  id: number;
  title: string;
  cards: Card[];
}

export default function EpisodesPage() {
  const { selectedSeries, setError, setSuccess } = useAdmin();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/episodes?seriesId=${selectedSeries}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEpisodes(data.episodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, [selectedSeries, setError]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  async function toggleSold(episodeId: number, cardIndex: number, currentSold: boolean) {
    const key = `${episodeId}-${cardIndex}`;
    setToggling(key);
    try {
      const res = await fetch("/api/episodes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId: selectedSeries,
          episodeId,
          cardIndex,
          sold: !currentSold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update local state
      setEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === episodeId
            ? {
                ...ep,
                cards: ep.cards.map((c, i) =>
                  i === cardIndex ? { ...c, sold: !currentSold } : c
                ),
              }
            : ep
        )
      );
      setSuccess(`Card marked as ${!currentSold ? "sold" : "available"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setToggling(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-text-primary">
        Episodes & Cards
      </h1>

      {episodes.length === 0 && (
        <p className="text-sm text-text-secondary">No episodes yet for this series.</p>
      )}

      <div className="space-y-4">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="rounded-xl border border-border p-4"
            style={{ background: "var(--color-surface)" }}
          >
            <h3 className="mb-3 text-sm font-bold text-text-primary">
              Episode {ep.id} — {ep.title}
            </h3>
            <div className="space-y-2">
              {ep.cards.map((card, ci) => {
                const key = `${ep.id}-${ci}`;
                const isSold = card.sold ?? false;
                return (
                  <div
                    key={ci}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    style={{ background: "rgba(74,64,53,0.04)" }}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>{card.emoji}</span>
                      <span className="font-medium text-text-primary">{card.name}</span>
                      <span className="text-text-dim">— {card.set}</span>
                    </div>
                    <button
                      onClick={() => toggleSold(ep.id, ci, isSold)}
                      disabled={toggling === key}
                      className="cursor-pointer rounded-lg px-3 py-1 text-xs font-bold tracking-wider transition-colors"
                      style={{
                        background: isSold ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.10)",
                        color: isSold ? "#EF4444" : "#22C55E",
                        border: `1px solid ${isSold ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.2)"}`,
                        opacity: toggling === key ? 0.5 : 1,
                      }}
                    >
                      {toggling === key ? "..." : isSold ? "SOLD" : "AVAILABLE"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
