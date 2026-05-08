import type { CardInfo, ShopProduct } from "./types";

const FULL_NAME_MATCH = 10;
const SHORT_NAME_MATCH = 5;
const FEATURED_BONUS = 2;
const BOOSTER_BONUS = 1;
const MIN_REAL_URLS_TO_FILTER = 3;

function shortName(name: string): string {
  return name.split(/\s+/)[0];
}

export function rankProductsForEpisode(
  shop: ShopProduct[],
  cards: CardInfo[],
  limit = 3
): ShopProduct[] {
  const realUrlPool = shop.filter((p) => p.url && p.url !== "#");
  const pool = realUrlPool.length >= MIN_REAL_URLS_TO_FILTER ? realUrlPool : shop;

  const scored = pool.map((p) => {
    let s = 0;
    let cardScored = false;
    for (const card of cards) {
      if (cardScored) break;
      if (p.name.includes(card.name)) {
        s += FULL_NAME_MATCH;
        cardScored = true;
      } else if (p.name.includes(shortName(card.name))) {
        s += SHORT_NAME_MATCH;
        cardScored = true;
      }
    }
    if (p.cat === "Featured") s += FEATURED_BONUS;
    else if (p.cat === "Booster") s += BOOSTER_BONUS;
    return { p, s };
  });

  scored.sort((a, b) => b.s - a.s || a.p.id - b.p.id);
  return scored.slice(0, limit).map((x) => x.p);
}

export function findShopProductForCard(
  shop: ShopProduct[],
  card: CardInfo
): ShopProduct | undefined {
  const exact = shop.find((p) => p.name === card.name);
  if (exact) return exact;
  const short = shortName(card.name);
  return shop.find((p) => p.name.includes(short) && p.cat === "Featured");
}

export function resolveCardBuyUrl(
  shop: ShopProduct[],
  card: CardInfo
): { url: string; external: boolean } {
  if (card.affiliateUrl && card.affiliateUrl !== "#") {
    return { url: card.affiliateUrl, external: true };
  }
  const fallback = findShopProductForCard(shop, card);
  if (fallback?.url && fallback.url !== "#") {
    return { url: fallback.url, external: true };
  }
  return { url: "/shop", external: false };
}
