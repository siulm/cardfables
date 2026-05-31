import { describe, it, expect } from "vitest";
import { selectPrice, fetchSuggestedPrice } from "./cardPricing";

describe("selectPrice", () => {
  it("prefers a holo variant's market price for non-plain rarity", () => {
    const prices = {
      normal: { low: 1, mid: 2, high: 3, market: 2, directLow: 1 },
      holofoil: { low: 8, mid: 10, high: 14, market: 12, directLow: 9 },
    };
    expect(selectPrice(prices, "Holo")).toEqual({
      suggestedPrice: 12,
      variant: "holofoil",
      basis: "market",
    });
  });

  it("falls back to mid when market is null", () => {
    const prices = { holofoil: { low: 8, mid: 10, high: 14, market: null, directLow: 9 } };
    expect(selectPrice(prices, "SAR")).toEqual({
      suggestedPrice: 10,
      variant: "holofoil",
      basis: "mid",
    });
  });

  it("prefers the normal variant for plain (common/uncommon) rarity", () => {
    const prices = {
      reverseHolofoil: { low: 1, mid: 2, high: 3, market: 5, directLow: 1 },
      normal: { low: 1, mid: 2, high: 3, market: 2, directLow: 1 },
    };
    expect(selectPrice(prices, "Common")).toEqual({
      suggestedPrice: 2,
      variant: "normal",
      basis: "market",
    });
  });

  it("rounds to the cent (keeps decimals; cards can be < $1)", () => {
    const prices = { normal: { low: 1, mid: 2, high: 3, market: 2.649, directLow: 1 } };
    expect(selectPrice(prices, "Common")?.suggestedPrice).toBe(2.65);
    const cheap = { normal: { low: 0.1, mid: 0.5, high: 1, market: 0.49, directLow: 0.1 } };
    expect(selectPrice(cheap, "Common")?.suggestedPrice).toBe(0.49);
  });

  it("returns null when there are no usable prices", () => {
    expect(selectPrice(undefined, "Holo")).toBeNull();
    expect(selectPrice({}, "Holo")).toBeNull();
    expect(selectPrice({ normal: { low: 1, mid: null, high: 3, market: null, directLow: 1 } }, "Common")).toBeNull();
  });
});

describe("fetchSuggestedPrice", () => {
  const card = { name: "Charizard", setNumber: "4/102", rarity: "Holo" };
  const mk = (body: unknown, ok = true) => async () => ({ ok, json: async () => body });

  it("matches on set size (denominator) and returns a dated suggestion", async () => {
    const body = {
      data: [
        {
          name: "Charizard",
          number: "4",
          set: { printedTotal: 102, total: 110 },
          tcgplayer: { prices: { holofoil: { market: 250, mid: 240 } } },
        },
      ],
    };
    const res = await fetchSuggestedPrice(card, { fetchImpl: mk(body), today: "2026-05-29" });
    expect(res).toEqual({ suggestedPrice: 250, variant: "holofoil", basis: "market", checkedAt: "2026-05-29" });
  });

  it("returns null when no result's set size matches the denominator", async () => {
    const body = {
      data: [
        {
          name: "Charizard",
          number: "4",
          set: { printedTotal: 132, total: 132 },
          tcgplayer: { prices: { holofoil: { market: 9 } } },
        },
      ],
    };
    expect(await fetchSuggestedPrice(card, { fetchImpl: mk(body) })).toBeNull();
  });

  it("returns null when setNumber is missing or has no denominator", async () => {
    expect(await fetchSuggestedPrice({ name: "Pikachu" }, { fetchImpl: mk({ data: [] }) })).toBeNull();
    expect(await fetchSuggestedPrice({ name: "Pikachu", setNumber: "58" }, { fetchImpl: mk({ data: [] }) })).toBeNull();
  });

  it("returns null on a non-ok response", async () => {
    expect(await fetchSuggestedPrice(card, { fetchImpl: mk({}, false) })).toBeNull();
  });

  it("returns null when the matched card has no tcgplayer prices", async () => {
    const body = { data: [{ name: "Charizard", number: "4", set: { printedTotal: 102 } }] };
    expect(await fetchSuggestedPrice(card, { fetchImpl: mk(body) })).toBeNull();
  });
});
