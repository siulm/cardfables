import type { Series } from "@/lib/types";

interface NextEpisodeCTAProps {
  series: Series;
}

export function NextEpisodeCTA({ series }: NextEpisodeCTAProps) {
  return (
    <div
      className="mt-12 rounded-2xl border border-dashed p-8 text-center"
      style={{ borderColor: `${series.color}33` }}
    >
      <p className="mb-2 text-sm font-semibold text-text-secondary">
        Next Episode
      </p>
      <h3 className="mb-2 font-heading text-lg font-bold text-text-dim">
        Episode 2 — ???
      </h3>
      <p className="text-sm text-text-dim">
        Coming soon. Follow us to get notified when the next episode drops.
      </p>
    </div>
  );
}
