"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import type { AffiliateProduct, CardInfo } from "@/lib/types";

interface CardSidebarProps {
  cards: CardInfo[];
  products?: AffiliateProduct[];
  seriesColor: string;
  mode: "junior" | "full";
}

export function CardSidebar({ cards, products, seriesColor, mode }: CardSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const topGap = 96; // 6rem — matches the navbar clearance
    let lastScrollY = window.scrollY;
    let stickyTop = topGap;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const sidebarH = aside.offsetHeight;
      const viewportH = window.innerHeight;

      if (sidebarH <= viewportH - topGap) {
        // Sidebar fits in viewport — plain sticky
        stickyTop = topGap;
      } else {
        // Taller than viewport — shift top with scroll direction
        const minTop = viewportH - sidebarH; // negative
        stickyTop = Math.max(minTop, Math.min(topGap, stickyTop - delta));
      }

      aside.style.top = `${stickyTop}px`;
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside ref={asideRef} className="lg:sticky lg:self-start" style={{ top: 96 }}>
      {/* Reading level info */}
      <div
        className="mb-3.5 rounded-xl border p-3.5"
        style={{
          background:
            mode === "junior"
              ? "rgba(34,197,94,0.06)"
              : "rgba(232,101,26,0.06)",
          borderColor:
            mode === "junior"
              ? "rgba(34,197,94,0.12)"
              : "rgba(232,101,26,0.12)",
        }}
      >
        <div
          className="mb-1 text-xs font-bold"
          style={{ color: mode === "junior" ? "#22C55E" : "#E8651A" }}
        >
          {mode === "junior" ? "\u{1F423} Junior Fables" : "\u{1F525} Full Fables"}
        </div>
        <p className="text-xs leading-relaxed text-text-dim">
          {mode === "junior"
            ? "Written for ages 6\u201311. Shorter sentences, simpler words, all the fun. Perfect for reading together!"
            : "Written for ages 12 and up. Richer vocabulary, deeper emotions, dramatic storytelling."}
        </p>
      </div>

      {/* Card placeholders */}
      <div className="flex flex-col gap-3">
        {cards.map((card, ci) => (
          <div
            key={ci}
            className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl"
            style={{
              aspectRatio: cards.length > 1 ? "3/2" : "2.5/3.5",
              background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}66, #1a1a2e)`,
              boxShadow: `0 0 40px ${seriesColor}15, 0 16px 48px rgba(0,0,0,0.4)`,
            }}
          >
            <span className={cards.length > 1 ? "text-4xl" : "text-5xl"}>
              {card.emoji}
            </span>
            <span className="mt-1 text-xs font-semibold text-white/65">
              {card.name}
            </span>
            <span className="mt-0.5 text-[11px] text-white/35">
              Your card image here
            </span>
            {cards.length > 1 && (
              <div className="absolute top-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold tracking-wider backdrop-blur-sm">
                CARD {ci + 1} OF {cards.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Card info */}
      <div
        className="mt-3.5 rounded-xl border border-border p-4"
        style={{ background: "var(--color-surface-light, #1a1a2e)" }}
      >
        {cards.map((card, ci) => (
          <div key={ci} className={ci < cards.length - 1 ? "mb-3" : ""}>
            <h3 className="mb-0.5 text-[13px] font-bold text-text-primary">
              {card.name}
            </h3>
            <p className="text-xs text-text-dim">
              {card.set} &middot; Art by {card.artist}
            </p>
            {ci < cards.length - 1 && (
              <div className="mt-3 h-px bg-border" />
            )}
          </div>
        ))}

        <Button href={cards[0]?.affiliateUrl ?? "#"} className="mt-3.5 w-full">
          Buy {cards.length > 1 ? "These Cards" : "This Card"}
        </Button>
      </div>

      {/* Collector's Gear */}
      {products && products.length > 0 && (
        <div
          className="mt-3.5 rounded-xl border border-border p-4"
          style={{ background: "var(--color-surface-light, #1a1a2e)" }}
        >
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Collector&apos;s Gear
          </h4>
          <div className="flex flex-col gap-2.5">
            {products.map((product, i) => (
              <a
                key={i}
                href={product.url}
                target="_blank"
                rel="nofollow noopener"
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-white/15"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <span className="text-lg">{product.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-text-primary">
                    {product.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-dim">
                    <span>{product.price}</span>
                    <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium">
                      {product.tag}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-text-secondary">
            As an Amazon Associate I earn from qualifying purchases
          </p>
        </div>
      )}

    </aside>
  );
}
