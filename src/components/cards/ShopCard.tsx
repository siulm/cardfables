"use client";

import type { ShopProduct } from "@/lib/types";

interface ShopCardProps {
  product: ShopProduct;
}

export function ShopCard({ product }: ShopCardProps) {
  const hasUrl = product.url && product.url !== "#";

  const card = (
    <div
      className={`group overflow-hidden rounded-2xl border border-border transition-all duration-300 ${hasUrl ? "hover:-translate-y-1 cursor-pointer" : ""}`}
      style={{ background: "var(--color-surface)" }}
      onMouseEnter={(e) => {
        if (hasUrl) e.currentTarget.style.borderColor = "rgba(212,137,58,0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Icon area */}
      <div className="flex h-[100px] items-center justify-center bg-surface-light text-4xl">
        {product.icon}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="mb-1 font-heading text-base font-bold text-text-primary">
          {product.name}
        </h3>
        <p className="mb-3 text-xs leading-relaxed text-text-secondary">
          {product.desc}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gold">{product.price}</span>
          <span
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
              hasUrl
                ? "border-[rgba(74,64,53,0.10)] text-text-secondary group-hover:border-gold group-hover:bg-gold group-hover:text-[#FFFEF7]"
                : "border-[rgba(74,64,53,0.06)] text-text-dim"
            }`}
          >
            {hasUrl ? "Amazon →" : "Coming Soon"}
          </span>
        </div>
      </div>
    </div>
  );

  if (hasUrl) {
    return (
      <a href={product.url} target="_blank" rel="noopener noreferrer">
        {card}
      </a>
    );
  }

  return card;
}
