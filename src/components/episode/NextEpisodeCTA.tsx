import Link from "next/link";
import { Button } from "@/components/ui/Button";
import type { Series } from "@/lib/types";

interface NextEpisodeCTAProps {
  series: Series;
  currentEpisodeId: number;
  currentEpisodeIndex: number;
}

export function NextEpisodeCTA({
  series,
  currentEpisodeId,
  currentEpisodeIndex,
}: NextEpisodeCTAProps) {
  const nextEpisode = series.episodes[currentEpisodeIndex + 1];
  const hasNextLive = nextEpisode && nextEpisode.status === "live";

  return (
    <div
      className="mt-12 rounded-2xl border border-dashed p-8 text-center"
      style={{ borderColor: `${series.color}33` }}
    >
      {hasNextLive ? (
        <>
          <p className="mb-2 text-sm font-semibold text-text-secondary">
            Next Episode
          </p>
          <h3 className="mb-2 font-heading text-lg font-bold text-text-primary">
            &ldquo;{nextEpisode.title}&rdquo;
          </h3>
          <Link
            href={`/series/${series.id}/${nextEpisode.slug}`}
            className="mt-4 inline-block rounded-lg px-6 py-2.5 text-sm font-bold text-[#07070D] transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, #D4A846, #B8860B)`,
            }}
          >
            Read Next Episode &rarr;
          </Link>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm font-semibold text-text-secondary">
            Next Episode
          </p>
          <h3 className="mb-2 font-heading text-lg font-bold text-text-dim">
            Episode {currentEpisodeId + 1} Coming Soon
          </h3>
          <p className="mb-4 text-sm text-text-dim">
            Submit a card to help pick the next episode!
          </p>
          <Button href="/submit">Submit a Card &rarr;</Button>
        </>
      )}
    </div>
  );
}
