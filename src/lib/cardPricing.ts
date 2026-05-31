// Suggested market prices from the free Pokémon TCG API. Advisory only — the
// owner's asking price is never derived from this automatically.

export interface PriceSuggestion {
  suggestedPrice: number; // USD, whole dollars
  variant: string; // tcgplayer variant key the price came from
  basis: "market" | "mid";
  checkedAt: string; // ISO date (YYYY-MM-DD)
}

interface PriceBlock {
  low?: number | null;
  mid?: number | null;
  high?: number | null;
  market?: number | null;
  directLow?: number | null;
}

type Prices = Record<string, PriceBlock>;

// Minimal shape so tests can pass a stub without faking the whole DOM fetch.
type FetchLike = (url: string) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

const HOLO_FIRST = ["holofoil", "reverseHolofoil", "1stEditionHolofoil", "unlimitedHolofoil"];
const NORMAL_FIRST = ["normal", "1stEdition", "unlimited"];

export function selectPrice(
  prices: Prices | undefined,
  rarity?: string
): { suggestedPrice: number; variant: string; basis: "market" | "mid" } | null {
  if (!prices) return null;
  const keys = Object.keys(prices);
  if (keys.length === 0) return null;

  const plain = /^(common|uncommon)$/i.test((rarity ?? "").trim());
  const pref = plain ? [...NORMAL_FIRST, ...HOLO_FIRST] : [...HOLO_FIRST, ...NORMAL_FIRST];
  const order = [...pref.filter((k) => keys.includes(k)), ...keys];

  const seen = new Set<string>();
  for (const v of order) {
    if (seen.has(v)) continue;
    seen.add(v);
    const block = prices[v];
    if (!block) continue;
    const value = block.market ?? block.mid ?? null;
    if (value != null && value > 0) {
      return {
        suggestedPrice: Math.round(value),
        variant: v,
        basis: block.market != null ? "market" : "mid",
      };
    }
  }
  return null;
}

export async function fetchSuggestedPrice(
  card: { name: string; setNumber?: string; rarity?: string },
  opts: { fetchImpl?: FetchLike; today?: string } = {}
): Promise<PriceSuggestion | null> {
  const doFetch: FetchLike = opts.fetchImpl ?? (fetch as unknown as FetchLike);
  const today = opts.today ?? new Date().toISOString().slice(0, 10);

  if (!card.name || !card.setNumber) return null;
  const [num, denom] = String(card.setNumber).split("/").map((s) => s.trim());
  if (!num || !denom) return null;

  const q = encodeURIComponent(`name:"${card.name}" number:"${num}"`);
  let data: { data?: Array<{ set?: { printedTotal?: number; total?: number }; tcgplayer?: { prices?: Prices } }> };
  try {
    const res = await doFetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=50`);
    if (!res.ok) return null;
    data = (await res.json()) as typeof data;
  } catch {
    return null;
  }

  const d = Number(denom);
  const match = (data.data ?? []).find(
    (c) => Number(c.set?.printedTotal) === d || Number(c.set?.total) === d
  );
  if (!match) return null;

  const picked = selectPrice(match.tcgplayer?.prices, card.rarity);
  if (!picked) return null;
  return { ...picked, checkedAt: today };
}
