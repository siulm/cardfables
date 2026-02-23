import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Episode, Series } from "@/lib/types";

interface CardSidebarProps {
  episode: Episode;
  series: Series;
}

export function CardSidebar({ episode, series }: CardSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{ background: "var(--color-surface)" }}
      >
        {/* Card image */}
        <div className="relative aspect-[2/3] w-full">
          <Image
            src="/images/cards/charizardVSAR.jpg"
            alt={`${episode.card} - ${episode.set}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 320px"
            priority
          />
        </div>

        {/* Card info */}
        <div className="p-5">
          <h3 className="mb-1 font-heading text-base font-bold text-text-primary">
            {episode.card}
          </h3>
          <p className="mb-1 text-xs text-text-secondary">{episode.set}</p>
          <p className="mb-4 text-xs text-text-dim">
            Art by {episode.artist}
          </p>

          <Button href="#" className="w-full">
            Buy This Card
          </Button>
        </div>
      </div>

      {/* Related products */}
      <div className="mt-4 rounded-2xl border border-border p-5" style={{ background: "var(--color-surface)" }}>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Related Products
        </h4>
        <div className="space-y-3">
          {[
            { name: "VSTAR Universe Booster Box", price: "~$85" },
            { name: "Ultra Pro Sleeves (100ct)", price: "~$9" },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
            >
              <span className="text-xs text-text-secondary">{p.name}</span>
              <span className="text-xs font-bold text-gold">{p.price}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
