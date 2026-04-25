"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useAdmin } from "../context";

interface SeriesMeta {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  type: string;
  color: string;
  accent: string;
  bg: string;
  desc: string;
  status: string;
}

export default function SeriesPage() {
  const { allSeries, setAllSeries, loadSeriesList, setError, setSuccess } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");

  useEffect(() => {
    if (allSeries.length === 0) {
      loadAll();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/series");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load series");
        return;
      }
      setAllSeries(data.series);
    } catch {
      setError("Failed to load series");
    } finally {
      setLoading(false);
    }
  }

  async function saveSeriesList() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/series", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ series: allSeries }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }
      setSuccess("Series metadata saved!");
    } catch {
      setError("Failed to save series");
    } finally {
      setSaving(false);
    }
  }

  async function createNewSeries() {
    if (!newSeriesTitle.trim()) return;
    setCreating(true);
    setError("");
    const id = newSeriesTitle
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title: newSeriesTitle }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create series");
        return;
      }
      setNewSeriesTitle("");
      setSuccess(`Series "${newSeriesTitle}" created!`);
      loadSeriesList();
    } catch {
      setError("Failed to create series");
    } finally {
      setCreating(false);
    }
  }

  function updateSeriesMeta(index: number, field: keyof SeriesMeta, value: string) {
    const updated = [...allSeries];
    updated[index] = { ...updated[index], [field]: value };
    setAllSeries(updated);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">Series Management</h1>
        <Button
          onClick={saveSeriesList}
          className={saving || allSeries.length === 0 ? "opacity-50 pointer-events-none" : ""}
        >
          {saving ? "Saving..." : "Save to GitHub"}
        </Button>
      </div>

      {/* Create new series */}
      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Create New Series
        </h3>
        <div className="flex gap-3">
          <input
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
            placeholder="Series title (e.g., Ocean's Deep)"
            value={newSeriesTitle}
            onChange={(e) => setNewSeriesTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createNewSeries()}
          />
          <Button
            onClick={createNewSeries}
            className={creating || !newSeriesTitle.trim() ? "opacity-50 pointer-events-none" : ""}
          >
            {creating ? "Creating..." : "+ Create"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">Loading series...</p>
        </div>
      )}

      {!loading && allSeries.length > 0 && (
        <div className="space-y-4">
          {allSeries.map((s, i) => (
            <div
              key={s.id}
              className="rounded-xl border border-border p-5 space-y-3"
              style={{ background: "var(--color-surface)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg"
                    style={{ background: s.bg || s.color }}
                  />
                  <div>
                    <span className="text-sm font-bold text-text-primary">{s.title}</span>
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.status === "Airing"
                          ? "bg-[rgba(34,197,94,0.15)] text-green-600"
                          : "bg-surface-light text-text-dim"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-text-dim font-mono">{s.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Title"
                  value={s.title}
                  onChange={(v) => updateSeriesMeta(i, "title", v)}
                />
                <Field
                  label="Tagline"
                  value={s.tagline}
                  onChange={(v) => updateSeriesMeta(i, "tagline", v)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Genre"
                  value={s.genre}
                  onChange={(v) => updateSeriesMeta(i, "genre", v)}
                  placeholder="e.g., Mystery • Thriller"
                />
                <Field
                  label="Type"
                  value={s.type}
                  onChange={(v) => updateSeriesMeta(i, "type", v)}
                  placeholder="e.g., Fire, Romance, Mystery"
                />
              </div>

              <Field
                label="Description"
                value={s.desc}
                onChange={(v) => updateSeriesMeta(i, "desc", v)}
                multiline
                rows={2}
              />

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={s.color}
                      onChange={(e) => {
                        updateSeriesMeta(i, "color", e.target.value);
                        updateSeriesMeta(
                          i,
                          "bg",
                          `linear-gradient(135deg, ${e.target.value} 0%, ${e.target.value}88 50%, ${e.target.value}44 100%)`
                        );
                      }}
                      className="h-9 w-9 cursor-pointer rounded border border-border"
                    />
                    <span className="text-xs text-text-dim font-mono">{s.color}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Accent</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={s.accent}
                      onChange={(e) => updateSeriesMeta(i, "accent", e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded border border-border"
                    />
                    <span className="text-xs text-text-dim font-mono">{s.accent}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-text-secondary">Status</label>
                  <select
                    value={s.status}
                    onChange={(e) => updateSeriesMeta(i, "status", e.target.value)}
                    className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
                  >
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Airing">Airing</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
