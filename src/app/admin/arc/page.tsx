"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useAdmin } from "../context";

interface StoryArc {
  season: number;
  act: "setup" | "rising_action" | "climax" | "resolution";
  total_episodes: number;
  arc_summary: string;
  climax: string;
  resolution: string;
  season2_hooks: string[];
  remaining_episodes: { episode: number; outline: string }[];
}

const ACTS: StoryArc["act"][] = ["setup", "rising_action", "climax", "resolution"];
const ACT_LABELS: Record<string, string> = {
  setup: "Setup",
  rising_action: "Rising Action",
  climax: "Climax",
  resolution: "Resolution",
};

export default function ArcPage() {
  const { selectedSeries, setError, setSuccess } = useAdmin();

  const [storyArc, setStoryArc] = useState<StoryArc | null>(null);
  const [lastEpisode, setLastEpisode] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [proposing, setProposing] = useState(false);

  useEffect(() => {
    loadArc();
  }, [selectedSeries]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadArc() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/story-arc?seriesId=${selectedSeries}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load arc");
        return;
      }
      setStoryArc(data.story_arc || null);
      setLastEpisode(data.last_episode || 0);
    } catch {
      setError("Failed to load arc");
    } finally {
      setLoading(false);
    }
  }

  async function saveArc() {
    if (!storyArc) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/story-arc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_arc: storyArc, seriesId: selectedSeries }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }
      setSuccess("Story arc saved!");
    } catch {
      setError("Failed to save arc");
    } finally {
      setSaving(false);
    }
  }

  async function proposeArc() {
    setProposing(true);
    setError("");
    try {
      const res = await fetch(`/api/story-arc?seriesId=${selectedSeries}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to propose arc");
        return;
      }
      setStoryArc(data.proposed_arc);
    } catch {
      setError("Failed to propose arc");
    } finally {
      setProposing(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Story Arc — Season {storyArc?.season || 1}
        </h1>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={proposeArc}
            className={proposing ? "opacity-50 pointer-events-none" : ""}
          >
            {proposing ? "Thinking..." : "Ask Claude to Propose"}
          </Button>
          <Button
            onClick={saveArc}
            className={saving || !storyArc ? "opacity-50 pointer-events-none" : ""}
          >
            {saving ? "Saving..." : "Save to GitHub"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">Loading story arc...</p>
        </div>
      )}

      {proposing && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">Claude is planning the story arc...</p>
        </div>
      )}

      {!loading && !proposing && !storyArc && (
        <div className="py-16 text-center">
          <p className="text-sm text-text-dim mb-4">No story arc defined yet.</p>
          <Button onClick={proposeArc}>Let Claude Propose an Arc</Button>
        </div>
      )}

      {!loading && !proposing && storyArc && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-text-primary">
                Episode {lastEpisode} of {storyArc.total_episodes}
              </span>
              <span className="rounded-full bg-[rgba(212,137,58,0.15)] px-3 py-1 text-xs font-bold text-[#D4893A]">
                {ACT_LABELS[storyArc.act]}
              </span>
            </div>
            <div className="flex gap-1">
              {ACTS.map((act) => {
                const actIndex = ACTS.indexOf(act);
                const currentIndex = ACTS.indexOf(storyArc.act);
                const isComplete = actIndex < currentIndex;
                const isCurrent = actIndex === currentIndex;
                return (
                  <div key={act} className="flex-1 flex flex-col gap-1">
                    <div
                      className="h-2 rounded-full transition-colors"
                      style={{
                        background: isComplete
                          ? "#D4893A"
                          : isCurrent
                          ? "linear-gradient(90deg, #D4893A, rgba(212,137,58,0.3))"
                          : "rgba(74,64,53,0.10)",
                      }}
                    />
                    <span
                      className={`text-[10px] ${
                        isCurrent ? "text-[#D4893A] font-bold" : "text-text-dim"
                      }`}
                    >
                      {ACT_LABELS[act]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Act selector */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text-secondary">Current Act</label>
            <select
              value={storyArc.act}
              onChange={(e) =>
                setStoryArc({ ...storyArc, act: e.target.value as StoryArc["act"] })
              }
              className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
            >
              {ACTS.map((act) => (
                <option key={act} value={act}>
                  {ACT_LABELS[act]}
                </option>
              ))}
            </select>
          </div>

          {/* Arc summary */}
          <Field
            label="Arc Summary"
            value={storyArc.arc_summary}
            onChange={(v) => setStoryArc({ ...storyArc, arc_summary: v })}
            multiline
            rows={3}
          />

          {/* Climax & Resolution */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Climax"
              value={storyArc.climax}
              onChange={(v) => setStoryArc({ ...storyArc, climax: v })}
              multiline
              rows={3}
            />
            <Field
              label="Resolution"
              value={storyArc.resolution}
              onChange={(v) => setStoryArc({ ...storyArc, resolution: v })}
              multiline
              rows={3}
            />
          </div>

          {/* Season 2 Hooks */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Season 2 Hooks
            </h3>
            <div className="space-y-2">
              {storyArc.season2_hooks.map((hook, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
                    value={hook}
                    onChange={(e) => {
                      const hooks = [...storyArc.season2_hooks];
                      hooks[i] = e.target.value;
                      setStoryArc({ ...storyArc, season2_hooks: hooks });
                    }}
                  />
                  <button
                    onClick={() =>
                      setStoryArc({
                        ...storyArc,
                        season2_hooks: storyArc.season2_hooks.filter((_, j) => j !== i),
                      })
                    }
                    className="rounded-lg px-2 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setStoryArc({
                    ...storyArc,
                    season2_hooks: [...storyArc.season2_hooks, ""],
                  })
                }
                className="text-xs text-gold hover:underline cursor-pointer"
              >
                + Add hook
              </button>
            </div>
          </div>

          {/* Remaining Episodes */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Episode Outlines
            </h3>
            <div className="space-y-2">
              {storyArc.remaining_episodes.map((ep, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span
                    className={`mt-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      ep.episode <= lastEpisode
                        ? "bg-[rgba(34,197,94,0.15)] text-green-600"
                        : "bg-surface-light text-text-dim"
                    }`}
                  >
                    Ep {ep.episode}
                  </span>
                  <textarea
                    className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
                    value={ep.outline}
                    onChange={(e) => {
                      const eps = [...storyArc.remaining_episodes];
                      eps[i] = { ...eps[i], outline: e.target.value };
                      setStoryArc({ ...storyArc, remaining_episodes: eps });
                    }}
                    rows={2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total episodes */}
          <div className="flex items-center gap-4 border-t border-border pt-4">
            <label className="text-sm font-medium text-text-secondary">Total Episodes</label>
            <input
              type="number"
              min={lastEpisode}
              className="w-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
              value={storyArc.total_episodes}
              onChange={(e) =>
                setStoryArc({
                  ...storyArc,
                  total_episodes: parseInt(e.target.value) || storyArc.total_episodes,
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
