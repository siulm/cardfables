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

type TextSize = "normal" | "large" | "xl";

export function EpisodeReader({ episode, series }: EpisodeReaderProps) {
  const [mode, setMode] = useState<"junior" | "full">("junior");
  const [textSize, setTextSize] = useState<TextSize>("normal");

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

      {/* Text size control */}
      <div className="mb-8 flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">Text size:</span>
        {(["normal", "large", "xl"] as const).map((size) => (
          <button
            key={size}
            onClick={() => setTextSize(size)}
            className="min-h-[36px] min-w-[36px] cursor-pointer rounded-lg border px-2 py-1 font-bold transition-colors"
            style={{
              fontSize: size === "normal" ? 13 : size === "large" ? 16 : 20,
              background: textSize === size ? "rgba(212,137,58,0.12)" : "var(--color-surface)",
              borderColor: textSize === size ? "rgba(212,137,58,0.3)" : "rgba(74,64,53,0.10)",
              color: textSize === size ? "#D4893A" : "var(--color-text-secondary)",
            }}
            aria-label={`${size} text`}
          >
            A
          </button>
        ))}
      </div>

      {/* Two-column reader */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <StoryRenderer story={story} seriesColor={series.color} mode={mode} textSize={textSize} />
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
