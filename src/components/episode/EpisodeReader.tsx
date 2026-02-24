"use client";

import { useState } from "react";
import { CardSidebar } from "./CardSidebar";
import { StoryRenderer } from "./StoryRenderer";
import { NextEpisodeCTA } from "./NextEpisodeCTA";
import type { Episode, Series } from "@/lib/types";

interface EpisodeReaderProps {
  episode: Episode;
  series: Series;
}

export function EpisodeReader({ episode, series }: EpisodeReaderProps) {
  const [mode, setMode] = useState<"junior" | "full">("junior");

  const story = mode === "junior" ? episode.junior : episode.full;
  const episodeIndex = series.episodes.findIndex((e) => e.id === episode.id);

  if (!story) return null;

  return (
    <>
      {/* Episode header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: series.color }}
          >
            {series.title}
          </span>
          <span className="text-text-dim">&middot;</span>
          <span className="text-xs text-text-secondary">
            Episode {episode.id}
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          {episode.title}
        </h1>
        <p className="mt-1 text-sm text-text-dim">
          Featuring: {episode.cards.map((c) => c.name).join(" + ")}
        </p>
      </div>

      {/* Age toggle */}
      <div
        className="mb-8 flex w-fit overflow-hidden rounded-[14px] border border-border"
      >
        <button
          onClick={() => setMode("junior")}
          className="min-h-[48px] cursor-pointer border-none px-5 py-3 text-sm font-bold transition-all duration-300 sm:px-6"
          style={{
            background:
              mode === "junior"
                ? "linear-gradient(135deg, #22C55E, #16A34A)"
                : "var(--color-surface)",
            color: mode === "junior" ? "#fff" : "var(--color-text-dim)",
          }}
        >
          <span className="block">{"\u{1F423}"} Junior Fables</span>
          <span className="mt-0.5 block text-xs font-normal opacity-80">
            Ages 6&ndash;11
          </span>
        </button>
        <button
          onClick={() => setMode("full")}
          className="min-h-[48px] cursor-pointer border-none px-5 py-3 text-sm font-bold transition-all duration-300 sm:px-6"
          style={{
            background:
              mode === "full"
                ? "linear-gradient(135deg, #E8651A, #C41E3A)"
                : "var(--color-surface)",
            color: mode === "full" ? "#fff" : "var(--color-text-dim)",
          }}
        >
          <span className="block">{"\u{1F525}"} Full Fables</span>
          <span className="mt-0.5 block text-xs font-normal opacity-80">
            Ages 12+
          </span>
        </button>
      </div>

      {/* Two-column reader */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <StoryRenderer story={story} seriesColor={series.color} mode={mode} />
          <NextEpisodeCTA
            series={series}
            currentEpisodeId={episode.id}
            currentEpisodeIndex={episodeIndex}
          />
        </div>
        <CardSidebar
          cards={episode.cards}
          products={episode.products}
          seriesColor={series.color}
          mode={mode}
        />
      </div>

      {/* Disclaimer */}
      <p className="mt-12 text-center text-sm text-text-dim">
        An original fan story &mdash; not affiliated with The Pok&eacute;mon Company
      </p>
    </>
  );
}
