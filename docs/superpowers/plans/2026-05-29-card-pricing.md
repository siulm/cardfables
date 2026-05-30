# Card Price Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable Pokémon-TCG-API price lookup and a CLI pass that fills *suggested* prices into `cards-import.csv` (never touching the owner's asking price), then record the admin "Review Prices" button into the marketplace plan for later.

**Architecture:** A pure, tested TypeScript module `src/lib/cardPricing.ts` does the lookup (reusing the safe name + set-size match) and price selection. A Node-25 TS CLI (`scripts/suggest-prices.ts`) imports that module and enriches the CSV. The admin button (Part B) is downstream of the unbuilt `/admin/cards` section, so it is folded into the marketplace plan rather than built here.

**Tech Stack:** TypeScript, vitest, Node 25 native TS execution, Pokémon TCG API v2 (keyless), pnpm.

**Spec:** `docs/superpowers/specs/2026-05-29-card-pricing-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/cardPricing.ts` | Create | `selectPrice` (pure) + `fetchSuggestedPrice` (TCG API lookup) |
| `src/lib/cardPricing.test.ts` | Create | vitest unit tests (mocked fetch) |
| `scripts/suggest-prices.ts` | Create | CLI: enrich `cards-import.csv` with `suggestedPrice` + `priceCheckedAt` |
| `tsconfig.json` | Modify | Enable `allowImportingTsExtensions` (so the CLI can import the `.ts` module) |
| `docs/superpowers/plans/2026-05-29-cards-marketplace.md` | Modify | Fold in Part B (admin button) + the two new entry fields |

---

## Task 1: `cardPricing.ts` module + tests (TDD)

**Files:**
- Create: `src/lib/cardPricing.test.ts`
- Create: `src/lib/cardPricing.ts`

Pure logic + a single async lookup. No DOM, no React. `fetch` and the date are injectable for deterministic tests.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/cardPricing.test.ts`:

```ts
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

  it("rounds to whole dollars", () => {
    const prices = { normal: { low: 1, mid: 2, high: 3, market: 2.6, directLow: 1 } };
    expect(selectPrice(prices, "Common")?.suggestedPrice).toBe(3);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/cardPricing.test.ts`
Expected: FAIL — `cardPricing` module / exports do not exist.

- [ ] **Step 3: Implement `cardPricing.ts`**

Create `src/lib/cardPricing.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/cardPricing.test.ts`
Expected: PASS (all 10 tests).

- [ ] **Step 5: Type-check**

Run: `pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cardPricing.ts src/lib/cardPricing.test.ts
git commit -m "feat(cards): cardPricing module — TCG market-price suggestions (TDD)"
```

---

## Task 2: `suggest-prices.ts` CLI — enrich the CSV

**Files:**
- Modify: `tsconfig.json`
- Create: `scripts/suggest-prices.ts`

The CLI imports the module from Task 1. Node 25 runs `.ts` directly, but importing a `.ts` file with its extension requires `allowImportingTsExtensions` so `tsc --noEmit` stays green (the project already sets `noEmit`, which this option needs).

- [ ] **Step 1: Enable `.ts`-extension imports**

In `/Users/lm/repos/cardfables/tsconfig.json`, add to `compilerOptions`:

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 2: Verify the type-check still passes with the new option**

Run: `pnpm tsc --noEmit`
Expected: 0 errors (no `.ts`-extension imports exist yet; this just confirms the option is valid against the project's `noEmit` config).

- [ ] **Step 3: Create the CLI**

Create `/Users/lm/repos/cardfables/scripts/suggest-prices.ts`:

```ts
/**
 * Fill suggested market prices into cards-import.csv from the Pokémon TCG API.
 * Adds/updates two columns and NEVER touches the `price` column.
 *
 * Usage:
 *   node scripts/suggest-prices.ts [path/to/cards-import.csv]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fetchSuggestedPrice } from "../src/lib/cardPricing.ts";

const CSV = process.argv[2] ?? "cards-import.csv";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", row: string[] = [], inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

async function main() {
  const rows = parseCSV(readFileSync(CSV, "utf-8"));
  const header = rows[0];
  const col = Object.fromEntries(header.map((h, i) => [h, i])) as Record<string, number>;

  // Ensure the two output columns exist (append if missing).
  for (const name of ["suggestedPrice", "priceCheckedAt"]) {
    if (!(name in col)) { col[name] = header.length; header.push(name); }
  }
  const width = header.length;
  const out = [header.map(esc).join(",")];

  let priced = 0, blank = 0, jpPriced = 0, jpTotal = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue;
    while (row.length < width) row.push("");

    const isJp = (row[col.id] ?? "").endsWith("-jp") || (row[col.id] ?? "").includes("-jp-");
    if (isJp) jpTotal++;

    const sug = await fetchSuggestedPrice({
      name: row[col.name],
      setNumber: row[col.setNumber],
      rarity: row[col.rarity],
    });

    if (sug) {
      row[col.suggestedPrice] = String(sug.suggestedPrice);
      row[col.priceCheckedAt] = sug.checkedAt;
      priced++;
      if (isJp) jpPriced++;
    } else {
      row[col.suggestedPrice] = "";
      row[col.priceCheckedAt] = "";
      blank++;
    }
    out.push(row.map((v) => esc(String(v ?? ""))).join(","));
  }

  writeFileSync(CSV, out.join("\n"));
  console.log(`priced ${priced} / blank ${blank}   (jp: ${jpPriced}/${jpTotal} priced)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Type-check the CLI + module together**

Run: `pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Run it against the real CSV**

Run: `node scripts/suggest-prices.ts cards-import.csv`
Expected: a coverage line like `priced N / blank M (jp: x/y priced)`. English cards should mostly be priced; Japanese coverage will be partial (expected).

- [ ] **Step 6: Spot-check the result**

Run: `head -3 cards-import.csv`
Expected: the header now ends with `,suggestedPrice,priceCheckedAt`; rows have a number + today's date where the API had a match, and the original `price` column is unchanged (still blank).

- [ ] **Step 7: Commit**

```bash
git add tsconfig.json scripts/suggest-prices.ts cards-import.csv
git commit -m "feat(cards): suggest-prices CLI — fill suggested prices into the import CSV"
```

---

## Task 3: Fold Part B + entry fields into the marketplace plan

**Files:**
- Modify: `docs/superpowers/plans/2026-05-29-cards-marketplace.md`

This task records the work that depends on the unbuilt `/admin/cards` section so it isn't lost. It is documentation only — no code.

- [ ] **Step 1: Add the two fields to the data model (marketplace Task 2)**

In the marketplace plan's Task 2, inside the `CardCollectionEntry` interface, add these two optional fields right after `status`:

```ts
  suggestedPrice?: number;  // advisory market price from the TCG API; never the asking price
  priceCheckedAt?: string;  // ISO date the suggestion was last refreshed
```

- [ ] **Step 2: Note the CSV import mapping (marketplace Task 11)**

In the marketplace plan's Task 11 (CSV import), add a bullet to the import-parsing description:

> Map the optional `suggestedPrice` (number) and `priceCheckedAt` (ISO date) columns onto the entry when present; ignore them if absent.

- [ ] **Step 3: Add the admin "Review Prices" task**

Append a new task to the marketplace plan (after Task 9, the admin cards page), titled **"Task 9b: Admin Review Prices button"**, with this content:

```markdown
### Task 9b: Admin "Review Prices" button

**Files:**
- Create: `src/app/api/cards/refresh-prices/route.ts`
- Modify: `src/app/admin/cards/page.tsx`

Implements Part B of `docs/superpowers/specs/2026-05-29-card-pricing-design.md`,
reusing `fetchSuggestedPrice` from `src/lib/cardPricing.ts`.

- [ ] Step 1: `POST /api/cards/refresh-prices` — auth-gated (`isAuthenticated()`);
  reads `CARDS`, calls `fetchSuggestedPrice` per card, persists refreshed
  `suggestedPrice` + `priceCheckedAt` to `cards-collection.json` via
  `commitFiles`. Never writes `price`. Returns per-card results (with prior vs
  new suggestion) for the review table.
- [ ] Step 2: On the admin cards header, add a "Review Prices" button plus a
  "Prices last reviewed N days ago" label (derived from the newest
  `priceCheckedAt`; emphasized when N > 14).
- [ ] Step 3: Clicking the button opens a confirmation modal; the fetch runs
  ONLY on confirm. After it returns, render a review table
  (card · your price · previous suggestion · new suggestion · % change).
- [ ] Step 4: Verify build + type-check; commit.
```

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-05-29-cards-marketplace.md
git commit -m "docs(cards): fold price-review button + entry fields into marketplace plan"
```

---

## Self-Review Notes

Spec coverage:

| Spec item | Task |
|---|---|
| `fetchSuggestedPrice` + set-size match + variant/market→mid selection | Task 1 |
| Returns null on no match (best-effort) | Task 1 (tested) |
| CLI fills `suggestedPrice` + `priceCheckedAt`, leaves `price` untouched | Task 2 |
| Re-runnable, coverage report (EN/JP) | Task 2 |
| `suggestedPrice` / `priceCheckedAt` on `CardCollectionEntry` | Task 3 (into marketplace Task 2) |
| CSV import carries the two fields | Task 3 (into marketplace Task 11) |
| Admin confirm-gated button + review table + "last reviewed" label | Task 3 (marketplace Task 9b) |
| Manual cadence, no automation | Task 3 (no cron; age label only) |
| USD, no condition/margin math | Task 1 (raw rounded market) |

Type consistency: `PriceSuggestion` (`suggestedPrice`, `variant`, `basis`, `checkedAt`) is produced by `fetchSuggestedPrice` and consumed by the CLI via the `.suggestedPrice` / `.checkedAt` fields; the CSV columns `suggestedPrice` / `priceCheckedAt` match the entry fields added in Task 3.

No placeholders: every step has runnable code or commands.
