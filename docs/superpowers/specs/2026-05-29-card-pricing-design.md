# Card Price Suggestions — Design Spec

**Date:** 2026-05-29
**Status:** Approved (pending spec review)

## Goal

Give the owner **suggested** market prices for the card collection, sourced from the
free Pokémon TCG API, so pricing 236+ cards becomes "glance & tweak" instead of
"research each." Suggestions are advisory: the owner's actual asking `price` is
never set or overwritten automatically. The owner re-reviews prices on a roughly
two-week cadence via an on-demand, confirmation-gated admin button.

## Non-goals

- No automated price changes — the owner always sets the final `price`.
- No paid data sources (PriceCharting, eBay) in this iteration. Japanese-card
  coverage is therefore partial (best-effort, like the existing TCG cross-check).
- No cron / scheduled jobs / email reminders. Cadence is manual.
- No condition- or margin-based math — suggestion is raw NM market price; the
  owner applies condition/margin/quick-sale judgement themselves.

## Scope & sequencing

Two parts, built at different times (decided: "logic now, button with admin"):

- **Part A (build now):** reusable price-fetch logic + a CLI pass that fills
  suggested prices into `cards-import.csv`. No dependency on unbuilt code.
- **Part B (folded into the marketplace plan):** the admin "Review Prices"
  button on `/admin/cards`. Depends on the marketplace data layer + admin page
  (marketplace plan Tasks 2, 8, 9) and is implemented alongside them.

---

## Part A — Price-suggestion logic + CLI

### `src/lib/cardPricing.ts` (new)

Pure, testable module. No DOM, no React.

```ts
export interface PriceSuggestion {
  suggestedPrice: number;   // USD, rounded to whole dollars
  variant: string;          // e.g. "holofoil", "normal"
  basis: "market" | "mid";  // which TCG field was used
  checkedAt: string;        // ISO date
}

// Returns null when the API has no confident match (best-effort).
export async function fetchSuggestedPrice(card: {
  name: string;
  setNumber?: string;
  rarity?: string;
}): Promise<PriceSuggestion | null>;
```

**Matching** (reuses the rule already in `process-card-images.js`): query
`name:"<name>" number:"<numerator>"`, then require the result's
`set.printedTotal`/`set.total` to equal the denominator of `setNumber`
(`018/172` → 172). No denominator or no matching set → return `null` rather than
risk pricing the wrong card.

**Price selection:** from the matched card's `tcgplayer.prices`:
1. Choose the variant: prefer one whose name implies holo/special when the
   card's rarity is holo/special (`holofoil`, then `reverseHolofoil`), otherwise
   the first present variant (`normal`, …).
2. Use that variant's `market`; if `market` is null, use `mid`. If neither
   exists, return `null`.
3. Round to whole USD.

**Errors:** network failure / non-200 / empty → `null` (never throws). Currency
is USD (matches `config.json`'s `currency`).

### `scripts/suggest-prices.js` (new)

```
node --env-file=.env.local scripts/suggest-prices.js [cards-import.csv]
```

- Reads the CSV, calls `fetchSuggestedPrice` per row (sequential; the API is
  free but rate-friendly).
- Writes back two columns, **leaving `price` untouched**:
  - `suggestedPrice` — the number, or blank if no match
  - `priceCheckedAt` — ISO date of this run
- Re-runnable (idempotent): overwrites prior suggestions.
- Prints coverage: `priced N / blank M (EN x / JP y)`.

### Type additions (`src/lib/types.ts`)

Add to `CardCollectionEntry` (defined in marketplace Task 2):

```ts
  suggestedPrice?: number;  // advisory, from the TCG API; never the asking price
  priceCheckedAt?: string;  // ISO date the suggestion was last refreshed
```

The `cards-import.csv` columns and the import parser (marketplace Task 11) carry
these two fields so suggestions survive import.

---

## Part B — Admin "Review Prices" button (built with `/admin/cards`)

Implemented when marketplace Tasks 8–9 build the admin cards surface.

### UI (`/admin/cards` header)

- A **"Review Prices"** button.
- Beside it: **"Prices last reviewed N days ago"** derived from the newest
  `priceCheckedAt` across cards. When N > 14, the label is visually emphasized
  (it's "due"). This is the entire cadence mechanism — no automation.

### Confirmation-gated flow

1. Click **"Review Prices"** → a **confirmation modal** appears:
   *"Fetch current market prices for all N cards from the Pokémon TCG API? This
   won't change your set prices — it refreshes the suggestions for you to
   review."* The fetch runs **only on confirm**, never on the bare click.
2. On confirm → `POST /api/cards/refresh-prices` (auth-gated, same
   `isAuthenticated()` pattern as other admin routes). It runs
   `fetchSuggestedPrice` over all cards and persists the refreshed
   `suggestedPrice` + `priceCheckedAt` to `cards-collection.json` via
   `commitFiles` (the existing GitHub-as-storage path). **`price` is never
   written.**
3. The page then shows a **review table**: card · your `price` · previous
   suggestion · new suggestion · % change · coverage note for blanks. The owner
   eyeballs it and manually edits any asking prices via the normal inline edit.

### Error handling

- The route returns per-card results including failures; cards with no match
  show a "—" in the new-suggestion column and keep their prior suggestion.
- A total API failure surfaces an error banner and writes nothing.

---

## Testing

- **`src/lib/cardPricing.test.ts`** (vitest): variant selection (holo vs normal),
  `market`→`mid` fallback, denominator-mismatch → null, missing prices → null,
  rounding. The `fetch` call is mocked.
- CLI and admin route are thin wrappers over the tested module.

## Files

| File | Status | Responsibility |
|---|---|---|
| `src/lib/cardPricing.ts` | new (Part A) | `fetchSuggestedPrice` + price selection |
| `src/lib/cardPricing.test.ts` | new (Part A) | unit tests |
| `scripts/suggest-prices.js` | new (Part A) | CSV enrichment pass |
| `src/lib/types.ts` | modify (Part A) | `suggestedPrice`, `priceCheckedAt` on `CardCollectionEntry` |
| `src/app/api/cards/refresh-prices/route.ts` | new (Part B) | auth-gated refresh endpoint |
| `src/app/admin/cards/page.tsx` | modify (Part B) | button + confirm modal + review table + age label |
