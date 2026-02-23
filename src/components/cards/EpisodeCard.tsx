"use client";

import Link from "next/link";
import type { Episode, Series } from "@/lib/types";

interface EpisodeCardProps {
  episode: Episode;
  series: Series;
  index: number;
}

export function EpisodeCard({ episode, series, index }: EpisodeCardProps) {
  const isLocked = episode.status === "locked";

  if (isLocked) {
    return (
      <div
        className="group overflow-hidden rounded-2xl border border-border transition-all duration-300"
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="h-2"
          style={{ background: series.bg, opacity: 0.3 }}
        />
        <div className="p-5">
          <div className="mb-1 flex items-center gap-3">
            <span className="text-xs font-semibold text-text-dim">
              EP {index + 1}
            </span>
            <span className="rounded-full bg-[rgba(255,255,255,0.04)] px-2.5 py-0.5 text-xs text-text-dim">
              Locked
            </span>
          </div>
          <h4 className="font-heading text-base font-bold text-text-dim">
            {episode.title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/series/${series.id}/${episode.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:-translate-y-1"
      style={{ background: "var(--color-surface)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${series.color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      <div className="h-2" style={{ background: series.bg }} />
      <div className="p-5">
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: series.color }}>
            EP {index + 1}
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs"
            style={{
              background: "rgba(34,197,94,0.1)",
              color: "#22C55E",
            }}
          >
            Live
          </span>
        </div>
        <h4
          className="mb-1 font-heading text-base font-bold text-text-primary"
        >
          {episode.title}
        </h4>
        <p className="text-xs text-text-secondary">
          {episode.card} &middot; {episode.set}
        </p>
        <p className="mt-1 text-xs text-text-dim">Art by {episode.artist}</p>
      </div>
    </Link>
  );
}
