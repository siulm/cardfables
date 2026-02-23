"use client";

import type { ShopProduct } from "@/lib/types";

interface ShopCardProps {
  product: ShopProduct;
}

export function ShopCard({ product }: ShopCardProps) {
  return (
    <div
      className="group overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:-translate-y-1"
      style={{ background: "var(--color-surface)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(212,168,70,0.2)";
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
          <span className="rounded-lg border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-medium text-text-secondary transition-all duration-200 group-hover:border-gold group-hover:bg-gold group-hover:text-[#07070D]">
            Amazon
          </span>
        </div>
      </div>
    </div>
  );
}
