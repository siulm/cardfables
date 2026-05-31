"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CardCollectionEntry, Series } from "@/lib/types";
import { CURRENCY } from "@/lib/data";
import { findEpisodeForCard, isComingSoon, formatPrice } from "@/lib/cardsCollection";

interface CardDetailOverlayProps {
  card: CardCollectionEntry;
  series: Series[];
  onClose: () => void;
  anchor: { x: number; y: number; width: number; height: number } | null;
}

function prefilledMessage(card: CardCollectionEntry): string {
  return `Hi! I'm interested in: ${card.name} — ${card.set} (${card.year}) — ${formatPrice(card.price, CURRENCY)}`;
}

const RARITY_COLORS: Record<string, string> = {
  SAR: "#D4893A",
  "Full Art": "#9B7AC4",
  Holo: "#8FA8B8",
  Promo: "#22C55E",
  Rare: "#5B9BD5",
};

export function CardDetailOverlay({ card, series, onClose, anchor }: CardDetailOverlayProps) {
  const [useModal, setUseModal] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // Choose modal vs overlay based on viewport + hover capability
  useEffect(() => {
    const isDesktop =
      window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
    setUseModal(!isDesktop);
  }, []);

  // Compute desktop overlay position from anchor
  useEffect(() => {
    if (useModal || !anchor) return;
    const overlayWidth = 360;
    const overlayHeight = 540;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.x + anchor.width + gap;
    let top = anchor.y;

    if (left + overlayWidth > vw - 16) {
      // flip to left of anchor
      left = anchor.x - overlayWidth - gap;
    }
    if (left < 16) {
      // fall through to modal style
      setUseModal(true);
      return;
    }
    if (top + overlayHeight > vh - 16) {
      top = Math.max(16, vh - overlayHeight - 16);
    }
    if (top < 16) top = 16;
    setPosition({ left, top });
  }, [useModal, anchor]);

  // Close on scroll (desktop overlay)
  useEffect(() => {
    if (useModal) return;
    const onScroll = () => onClose();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useModal, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ep = findEpisodeForCard(series, card);
  const isAvailable = card.status === "available";
  const comingSoon = isComingSoon(card);
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#7A6E5E";

  const handleBuy = async () => {
    try {
      await navigator.clipboard.writeText(prefilledMessage(card));
    } catch {
      // ignore — clipboard might be blocked on some browsers
    }
    const url = `https://m.me/cardfables?ref=${encodeURIComponent(card.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const content = (
    <div className="flex flex-col">
      {/* Image */}
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl bg-surface-light">
        {card.image ? (
          <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">🎴</div>
        )}
        <span
          className="absolute top-3 right-3 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
          style={{ background: rarityColor }}
        >
          {card.rarity}
        </span>
      </div>

      {/* Info */}
      <div className="mt-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">{card.name}</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          {card.set} · {card.year}
          {card.setNumber && ` · ${card.setNumber}`}
        </p>
        <p className="mt-1 text-xs text-text-dim">
          {card.condition}
          {card.artist && ` · Art by ${card.artist}`}
        </p>

        {card.description && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {card.description}
          </p>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          {comingSoon ? (
            <span className="rounded-md bg-surface-light px-3 py-1 text-sm font-bold uppercase tracking-wider text-text-dim">
              Coming Soon
            </span>
          ) : (
            <>
              {card.originalPrice && card.originalPrice > card.price && (
                <span className="text-sm text-text-dim line-through">
                  {formatPrice(card.originalPrice, CURRENCY)}
                </span>
              )}
              <span className="font-heading text-2xl font-bold text-gold">
                {formatPrice(card.price, CURRENCY)}
              </span>
            </>
          )}
        </div>

        {comingSoon ? (
          <div className="mt-4 rounded-xl border border-border bg-surface-light px-5 py-3 text-center text-sm font-bold text-text-dim">
            Coming Soon — not yet for sale
          </div>
        ) : isAvailable ? (
          <button
            type="button"
            onClick={handleBuy}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-[#FFFEF7]"
            style={{
              background: "linear-gradient(135deg, #D4893A, #B86E28)",
              boxShadow: "0 8px 28px rgba(212,137,58,0.25)",
            }}
          >
            Message me to buy ↗
          </button>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-surface-light px-5 py-3 text-center text-sm font-bold text-text-dim">
            {card.status === "sold" ? "Sold" : card.status === "reserved" ? "Reserved" : "Not available"}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] text-text-dim">
          {isAvailable && !comingSoon ? "Message copied to clipboard — paste it into Messenger to start the conversation" : ""}
        </p>

        {ep && (
          <Link
            href={`/series/${ep.series.id}/${ep.episode.slug}`}
            className="mt-3 block text-center text-sm font-medium text-text-secondary underline hover:text-gold"
            onClick={onClose}
          >
            📖 Read the story →
          </Link>
        )}
      </div>
    </div>
  );

  // Mobile / fallback: full-screen modal
  if (useModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-bg p-5 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-bg/80 px-2.5 py-1 text-sm font-bold text-text-secondary backdrop-blur-sm"
            aria-label="Close"
          >
            ✕
          </button>
          {content}
        </div>
      </div>
    );
  }

  // Desktop floating overlay
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-50 w-[360px] rounded-2xl border border-border bg-bg p-5 shadow-2xl"
      style={{
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
      }}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs text-text-secondary"
        aria-label="Close"
      >
        ✕
      </button>
      {content}
    </div>
  );
}
