"use client";

import Link from "next/link";
import { Tag } from "@/components/ui/Tag";
import type { Series } from "@/lib/types";

interface SeriesCardProps {
  series: Series;
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link
      href={`/series/${series.id}`}
      className="hover-lift group block w-full min-w-[280px] overflow-hidden rounded-2xl border border-border"
      style={
        {
          background: "var(--color-surface)",
          "--hover-color": series.color,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${series.color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Gradient header */}
      <div
        className="relative h-[120px] p-5"
        style={{ background: series.bg }}
      >
        <Tag label={series.status} color={series.color} />
        <div className="absolute bottom-3 right-4 text-3xl opacity-20">
          {series.type === "Fire" && "\u{1F525}"}
          {series.type === "Water" && "\u{1F4A7}"}
          {series.type === "Grass" && "\u{1F33F}"}
          {series.type === "Electric" && "\u26A1"}
          {series.type === "Dark" && "\u{1F47B}"}
          {series.type === "Steel" && "\u{1F6E1}\uFE0F"}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3
          className="mb-1 font-heading text-lg font-bold"
          style={{ color: series.accent }}
        >
          {series.title}
        </h3>
        <p className="mb-3 text-xs italic text-text-secondary">
          {series.tagline}
        </p>
        <p className="mb-4 text-xs leading-relaxed text-text-secondary">
          {series.desc}
        </p>
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span>{series.genre}</span>
          <span>
            {series.epCount} ep{series.epCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
