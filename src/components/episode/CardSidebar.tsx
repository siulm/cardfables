"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import type { AffiliateProduct, CardInfo } from "@/lib/types";
import { SHOP } from "@/lib/data";
import { rankProductsForEpisode, resolveCardBuyUrl } from "@/lib/shopMatch";

interface CardSidebarProps {
  cards: CardInfo[];
  products?: AffiliateProduct[];
  seriesColor: string;
  mode: "junior" | "full";
}

export function CardSidebar({ cards, products, seriesColor, mode }: CardSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Scroll-direction sticky behavior (unchanged)
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const topGap = 96;
    let lastScrollY = window.scrollY;
    let stickyTop = topGap;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const sidebarH = aside.offsetHeight;
      const viewportH = window.innerHeight;

      if (sidebarH <= viewportH - topGap) {
        stickyTop = topGap;
      } else {
        const minTop = viewportH - sidebarH;
        stickyTop = Math.max(minTop, Math.min(topGap, stickyTop - delta));
      }

      aside.style.top = `${stickyTop}px`;
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for chip clicks → flash a focus ring on the matching card
  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      if (typeof detail?.index !== "number") return;
      setFocusedIndex(detail.index);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ms = reduce ? 0 : 1500;
      window.setTimeout(() => setFocusedIndex(null), ms);
    };
    window.addEventListener("cardfables:focus-card", onFocus as EventListener);
    return () =>
      window.removeEventListener("cardfables:focus-card", onFocus as EventListener);
  }, []);

  // Smarter "You Might Like" — episode-aware
  const suggestedProducts = useMemo(
    () => rankProductsForEpisode(SHOP, cards, 3),
    [cards]
  );

  const primaryCard = cards[0];
  const primaryBuy = primaryCard ? resolveCardBuyUrl(SHOP, primaryCard) : null;

  return (
    <aside ref={asideRef} className="lg:sticky lg:self-start" style={{ top: 96 }}>
      {/* Reading level info — stays at top for parent reassurance */}
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
            ? "Written for ages 6–11. Shorter sentences, simpler words, all the fun. Perfect for reading together!"
            : "Written for ages 12 and up. Richer vocabulary, deeper emotions, dramatic storytelling."}
        </p>
      </div>

      {/* Top Buy CTA — above-the-fold conversion */}
      {primaryCard && primaryBuy && (
        <BuyCTA
          card={primaryCard}
          buy={primaryBuy}
          variant="top"
        />
      )}

      {/* Card placeholders */}
      <div className="flex flex-col gap-3">
        {cards.map((card, ci) => {
          const buy = resolveCardBuyUrl(SHOP, card);
          const cardImage = (
            <div
              className="relative h-full w-full overflow-hidden rounded-2xl"
              style={{
                aspectRatio: cards.length > 1 ? "3/2" : "2.5/3.5",
                boxShadow:
                  focusedIndex === ci
                    ? `0 0 0 3px ${seriesColor}, 0 0 32px ${seriesColor}80`
                    : `0 0 40px ${seriesColor}10, 0 16px 48px rgba(0,0,0,0.08)`,
                transition: "box-shadow 350ms ease-out",
              }}
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.name}
                  width={320}
                  height={448}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}55, ${seriesColor}22)`,
                  }}
                >
                  <span className={cards.length > 1 ? "text-4xl" : "text-5xl"}>
                    {card.emoji}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-white/90">
                    {card.name}
                  </span>
                </div>
              )}
              {card.sold && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold tracking-widest text-white shadow-lg"
                    style={{ transform: "rotate(-12deg)" }}
                  >
                    SOLD
                  </span>
                </div>
              )}
              {cards.length > 1 && (
                <div className="absolute top-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-bold tracking-wider text-white/90 backdrop-blur-sm">
                  CARD {ci + 1} OF {cards.length}
                </div>
              )}
            </div>
          );

          return (
            <div
              id={`sidebar-card-${ci}`}
              key={ci}
              className="relative"
            >
              {buy.external ? (
                <a
                  href={buy.url}
                  target="_blank"
                  rel="nofollow noopener"
                  aria-label={`Buy ${card.name} on Amazon`}
                  className="block"
                >
                  {cardImage}
                </a>
              ) : (
                <Link
                  href={buy.url}
                  aria-label={`Browse ${card.name} in shop`}
                  className="block"
                >
                  {cardImage}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Card info + bottom Buy CTA */}
      <div
        className="mt-3.5 rounded-xl border border-border p-4"
        style={{ background: "var(--color-surface-light, #E8DFD0)" }}
      >
        {cards.map((card, ci) => (
          <div key={ci} className={ci < cards.length - 1 ? "mb-3" : ""}>
            <h3 className="mb-0.5 text-[13px] font-bold text-text-primary">
              {card.name}
            </h3>
            <p className="text-xs text-text-dim">
              {card.set} &middot; Art by {card.artist}
            </p>
            {ci < cards.length - 1 && <div className="mt-3 h-px bg-border" />}
          </div>
        ))}

        {primaryCard && primaryBuy && (
          <BuyCTA
            card={primaryCard}
            buy={primaryBuy}
            variant="bottom"
          />
        )}
      </div>

      {/* Collector's Gear (unchanged) */}
      {products && products.length > 0 && (
        <div
          className="mt-3.5 rounded-xl border border-border p-4"
          style={{ background: "var(--color-surface-light, #E8DFD0)" }}
        >
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Collector&apos;s Gear ↗
          </h4>
          <p className="mb-2.5 text-[10px] text-text-dim">
            These links go to Amazon.com — ask a grown-up before buying!
          </p>
          <div className="flex flex-col gap-2.5">
            {products.map((product, i) => (
              <a
                key={i}
                href={product.url}
                target="_blank"
                rel="nofollow noopener"
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-[rgba(74,64,53,0.20)]"
                style={{ background: "rgba(74,64,53,0.04)" }}
              >
                <span className="text-lg">{product.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-text-primary">
                    {product.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-dim">
                    <span>{product.price}</span>
                    <span className="rounded bg-[rgba(74,64,53,0.08)] px-1.5 py-0.5 text-[9px] font-medium">
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

      {/* You Might Like — now episode-aware */}
      {suggestedProducts.length > 0 && (
        <div
          className="mt-3.5 rounded-xl border border-border p-4"
          style={{ background: "var(--color-surface, #F2EDE4)" }}
        >
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            You Might Like
          </h4>
          <div className="flex flex-col gap-2.5">
            {suggestedProducts.map((product, i) => {
              const hasUrl = product.url && product.url !== "#";
              const Tag = hasUrl ? "a" : Link;
              const href = hasUrl ? product.url! : "/shop";
              const props = hasUrl
                ? {
                    href,
                    target: "_blank" as const,
                    rel: "nofollow noopener",
                  }
                : { href };
              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Tag
                  key={i}
                  {...(props as any)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-[rgba(212,137,58,0.3)]"
                  style={{ background: "rgba(74,64,53,0.04)" }}
                >
                  <span className="text-2xl">{product.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-text-primary">
                      {product.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-dim">
                      {product.desc}
                    </div>
                    <div className="mt-1 text-xs font-bold text-gold">
                      {product.price}
                    </div>
                  </div>
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

interface BuyCTAProps {
  card: CardInfo;
  buy: { url: string; external: boolean };
  variant: "top" | "bottom";
}

function BuyCTA({ card, buy, variant }: BuyCTAProps) {
  const label = buy.external
    ? `Buy ${card.name} ↗`
    : `Browse this card in Shop →`;

  const className =
    "mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#FFFEF7] transition-opacity hover:opacity-90";
  const style = {
    background: "linear-gradient(135deg, #D4893A, #B86E28)",
    boxShadow: "0 8px 28px rgba(212,137,58,0.25)",
  };

  const button = buy.external ? (
    <a
      href={buy.url}
      target="_blank"
      rel="nofollow noopener"
      className={className}
      style={style}
    >
      {label}
    </a>
  ) : (
    <Link href={buy.url} className={className} style={style}>
      {label}
    </Link>
  );

  if (variant === "top") {
    return button;
  }

  return (
    <>
      {button}
      <p className="mt-2 text-center text-[10px] text-text-dim">
        {buy.external
          ? "Opens Amazon.com — ask a parent first!"
          : "Browse related cards on our shop page"}
      </p>
    </>
  );
}
