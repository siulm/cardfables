import type { Metadata } from "next";
import { BrowseGrid } from "@/components/browse/BrowseGrid";
import { SERIES } from "@/lib/data";

export const metadata: Metadata = {
  title: "Browse All Series — CardFables",
  description: `Explore ${SERIES.length} original story series inspired by card artwork on CardFables.`,
};

export default function BrowsePage() {
  const browseTypes = ["All", ...Array.from(new Set(SERIES.map((s) => s.type).filter(Boolean)))] as const;
  const totalEps = SERIES.reduce((sum, s) => sum + s.epCount, 0);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        Browse All Series
      </h1>
      <p className="mb-8 text-sm text-text-secondary">
        {SERIES.length} series &middot; {totalEps} episode
        {totalEps !== 1 ? "s" : ""} and counting
      </p>

      <BrowseGrid series={SERIES} browseTypes={browseTypes} />
    </div>
  );
}
