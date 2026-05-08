import { describe, it, expect } from "vitest";
import { rankProductsForEpisode, findShopProductForCard, resolveCardBuyUrl } from "./shopMatch";
import type { CardInfo, ShopProduct } from "./types";

const charizard: CardInfo = {
  name: "Charizard V (SAR)",
  set: "VSTAR Universe",
  artist: "Oswaldo KATO",
  emoji: "🔥",
};

const shop: ShopProduct[] = [
  { id: 1, icon: "🔥", name: "Charizard V (SAR)", desc: "", price: "~$45", cat: "Featured", url: "#" },
  { id: 2, icon: "📦", name: "VSTAR Universe Booster Box", desc: "", price: "~$85", cat: "Booster", url: "#" },
  { id: 3, icon: "🛡️", name: "Ultra Pro Sleeves (100ct)", desc: "", price: "~$9", cat: "Gear", url: "#" },
  { id: 4, icon: "📒", name: "9-Pocket Pro Binder", desc: "", price: "~$25", cat: "Gear", url: "#" },
  { id: 5, icon: "🎴", name: "Pokemon 151 Bundle", desc: "", price: "~$35", cat: "Booster", url: "#" },
  { id: 6, icon: "🔍", name: "LED Magnifying Loupe", desc: "", price: "~$12", cat: "Gear", url: "#" },
];

describe("rankProductsForEpisode", () => {
  it("ranks exact name match first", () => {
    const result = rankProductsForEpisode(shop, [charizard]);
    expect(result[0].name).toBe("Charizard V (SAR)");
  });

  it("ranks short-name match above category-only matches", () => {
    const shopWithShortMatch: ShopProduct[] = [
      ...shop,
      { id: 7, icon: "🔥", name: "Charizard Plush", desc: "", price: "~$20", cat: "Gear", url: "#" },
    ];
    const result = rankProductsForEpisode(shopWithShortMatch, [charizard], 5);
    expect(result[0].name).toBe("Charizard V (SAR)");
    expect(result[1].name).toBe("Charizard Plush");
  });

  it("ranks Featured above Booster above Gear when no card match", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(shop, [noCard], 6);
    expect(result[0].cat).toBe("Featured");
    expect(result[1].cat).toBe("Booster");
    expect(result[2].cat).toBe("Booster");
  });

  it("returns at most `limit` products", () => {
    const result = rankProductsForEpisode(shop, [charizard], 2);
    expect(result).toHaveLength(2);
  });

  it("default limit is 3", () => {
    const result = rankProductsForEpisode(shop, [charizard]);
    expect(result).toHaveLength(3);
  });

  it("ties broken by id (stable)", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(shop, [noCard], 6);
    const boosters = result.filter((p) => p.cat === "Booster");
    expect(boosters[0].id).toBe(2);
    expect(boosters[1].id).toBe(5);
  });

  it("filters placeholder URLs only when ≥3 real-URL products exist", () => {
    const mixedShop: ShopProduct[] = [
      { id: 1, icon: "a", name: "A", desc: "", price: "$1", cat: "Gear", url: "https://amazon.com/a" },
      { id: 2, icon: "b", name: "B", desc: "", price: "$1", cat: "Gear", url: "https://amazon.com/b" },
      { id: 3, icon: "c", name: "C", desc: "", price: "$1", cat: "Gear", url: "https://amazon.com/c" },
      { id: 4, icon: "d", name: "D", desc: "", price: "$1", cat: "Gear", url: "#" },
    ];
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(mixedShop, [noCard], 4);
    expect(result).toHaveLength(3);
    expect(result.every((p) => p.url !== "#")).toBe(true);
  });

  it("allows placeholder URLs when fewer than 3 real-URL products exist", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(shop, [noCard], 3);
    expect(result).toHaveLength(3);
  });

  it("returns all when shop smaller than limit", () => {
    const tinyShop: ShopProduct[] = shop.slice(0, 2);
    const result = rankProductsForEpisode(tinyShop, [charizard]);
    expect(result).toHaveLength(2);
  });

  it("scores a product once even if multiple cards match", () => {
    const cards = [charizard, charizard];
    const result = rankProductsForEpisode(shop, cards);
    expect(result[0].name).toBe("Charizard V (SAR)");
  });
});

describe("findShopProductForCard", () => {
  it("returns exact name match", () => {
    const result = findShopProductForCard(shop, charizard);
    expect(result?.id).toBe(1);
  });

  it("returns short-name + Featured fallback", () => {
    const venusaur: CardInfo = { name: "Venusaur ex", set: "X", artist: "Y", emoji: "🌿" };
    const shopWithFeatured: ShopProduct[] = [
      ...shop,
      { id: 7, icon: "🌿", name: "Venusaur Plush", desc: "", price: "$20", cat: "Featured", url: "#" },
    ];
    const result = findShopProductForCard(shopWithFeatured, venusaur);
    expect(result?.id).toBe(7);
  });

  it("returns undefined when no match", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    expect(findShopProductForCard(shop, noCard)).toBeUndefined();
  });

  it("does not fall back to non-Featured short-name match", () => {
    const noCard: CardInfo = { name: "Booster", set: "X", artist: "Y", emoji: "📦" };
    expect(findShopProductForCard(shop, noCard)).toBeUndefined();
  });
});

describe("resolveCardBuyUrl", () => {
  const realUrlShop: ShopProduct[] = [
    { id: 1, icon: "🔥", name: "Charizard V (SAR)", desc: "", price: "$45", cat: "Featured", url: "https://amazon.com/charizard" },
  ];
  const placeholderShop: ShopProduct[] = [
    { id: 1, icon: "🔥", name: "Charizard V (SAR)", desc: "", price: "$45", cat: "Featured", url: "#" },
  ];

  it("returns card.affiliateUrl when set and not '#'", () => {
    const card: CardInfo = { ...charizard, affiliateUrl: "https://amazon.com/direct" };
    expect(resolveCardBuyUrl(placeholderShop, card)).toEqual({
      url: "https://amazon.com/direct",
      external: true,
    });
  });

  it("falls back to shop product URL when affiliateUrl is '#' but shop has real URL", () => {
    const card: CardInfo = { ...charizard, affiliateUrl: "#" };
    expect(resolveCardBuyUrl(realUrlShop, card)).toEqual({
      url: "https://amazon.com/charizard",
      external: true,
    });
  });

  it("falls back to /shop when both card and shop product have placeholder URLs", () => {
    const card: CardInfo = { ...charizard, affiliateUrl: "#" };
    expect(resolveCardBuyUrl(placeholderShop, card)).toEqual({
      url: "/shop",
      external: false,
    });
  });

  it("falls back to /shop when no shop match exists", () => {
    const card: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    expect(resolveCardBuyUrl(realUrlShop, card)).toEqual({
      url: "/shop",
      external: false,
    });
  });
});
