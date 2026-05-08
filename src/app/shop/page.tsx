import type { Metadata } from "next";
import { ShopGrid } from "@/components/shop/ShopGrid";
import { SHOP, SHOP_CATEGORIES } from "@/lib/data";

export const metadata: Metadata = {
  title: "The Card Shop — CardFables",
  description: "Own the cards from the stories. Every purchase helps keep the fables going.",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        {"\u{1F6D2}"} The Card Shop
      </h1>
      <p className="mb-8 text-sm text-text-secondary">
        Own the cards from the stories. Every purchase helps keep the fables
        going.
      </p>

      <ShopGrid products={SHOP} categories={SHOP_CATEGORIES} />

      <p className="mt-12 text-center text-xs text-text-dim">
        As an Amazon Associate I earn from qualifying purchases. Prices
        approximate.
      </p>
    </div>
  );
}
