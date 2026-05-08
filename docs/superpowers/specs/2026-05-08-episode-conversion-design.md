# Episode-Page Conversion Improvements — Design

> Status: Proposed
> Date: 2026-05-08
> Scope: Improve affiliate-revenue conversion on the episode reader page. Out of scope: newsletter/email capture, real Amazon URL filling, API key handling.

---

## Goal

The episode reader is where readers are emotionally invested in a specific Pokémon card — the only surface where affiliate intent is naturally high. Today the page works but leaves money on the table:

1. The Buy button sits below a tall card image, often below the fold.
2. "Buy link coming soon" is a dead-end (no path forward when `affiliateUrl` is `#`).
3. Card names in the story text are plain — no link to the card or shop.
4. "You Might Like" is randomized — ignores which cards the episode actually features.
5. After the cliffhanger, the reader is funneled to Ko-fi and next episode but never gets a focused affiliate moment.

This spec defines five surgical changes that turn the episode page into a conversion engine without rewriting it. Every change keeps the existing visual language (Ghibli theme, parchment surfaces, terracotta accents).

## Non-goals

- Filling in real Amazon affiliate URLs (owner task — UX must be ready first)
- Newsletter / email capture
- Changes to story-bible / generation pipeline
- Multi-tenant / SaaS readiness
- Shop page (`/shop`) redesign
- Browse page redesign

---

## The Five Changes

### 1. Inline card chips in story text

**What:** When a card name from `episode.cards[].name` (or its short form, e.g., "Charizard" matching "Charizard V (SAR)") appears in a paragraph, wrap it in a `<CardChip>` component. Tapping the chip highlights the matching card in the sidebar (smooth scroll + color pulse) on desktop, and on mobile scrolls to the sidebar block.

**Why:** Inline mentions are the highest-intent click surface in narrative content. The reader is mid-sentence, picturing the card — that's the moment to make it tappable.

**Where:** `src/components/episode/StoryRenderer.tsx` + new `src/components/episode/CardChip.tsx`.

**How:**
- New helper `src/lib/cardMentions.ts` exports `splitParagraph(text, cards)` that returns an array of `{ kind: "text" | "chip", value, cardIndex? }` segments.
- Matching: build a list of `{ shortName, fullName, index }` from `episode.cards`. `shortName` is the first word of `name` (e.g., "Charizard" from "Charizard V (SAR)"). Match case-sensitive on word boundaries (`\b`). Prefer longest match first to avoid double-wrapping.
- `<StoryRenderer>` calls `splitParagraph` for each `t: "p"` and `t: "q"` block. Renders text segments as plain text and chip segments as `<CardChip>` with `cardIndex`.
- `<CardChip>` is a small inline element styled like a subtle pill: `border-bottom: 1px dotted seriesColor`, slight `font-weight: 600`. On hover/focus: background tint. On click: dispatches `window.dispatchEvent(new CustomEvent("cardfables:focus-card", { detail: { index } }))` and scrolls to `#sidebar-card-${index}`.
- `<CardSidebar>` adds `id="sidebar-card-${ci}"` to each card's wrapper div, listens for `cardfables:focus-card`, applies a 1.5s pulse animation (boxShadow ring) to the matching card.
- On desktop the sidebar is `lg:sticky` so it's always in view — pulse is the main cue. On mobile the sidebar sits below the story, so the scroll-into-view is the main cue and the pulse plays on arrival.

**Edge cases:**
- A name appearing inside a quote attribution (e.g., `speaker: "Charizard"`) is not wrapped — only the body `c` text is processed.
- A name appearing twice in one paragraph: both wrapped (idempotent).
- No cards in episode (impossible — every episode has ≥1) — no-op.
- Junior Fables uses simpler vocabulary; matching still works because card names are unchanged across modes.

**Success check:** Click "Charizard" in episode 1 paragraph 1 → sidebar card pulses gold and scrolls into view.

---

### 2. Sidebar Buy CTA — above-the-fold + no dead-ends

**What:**
- Add a compact primary Buy button at the **top** of the sidebar (above the card image), in addition to the existing button below card info.
- The "Buy link coming soon" dead-end (when `affiliateUrl === "#"`) becomes a link to `/shop` with the card name pre-filtered (or just `/shop` if filtering doesn't exist — see §5).
- Card image gets a subtle hover indicator (lift + ring) hinting at clickability — clicking the image triggers the same Buy action when a URL is present.

**Why:** The conversion CTA must be visible without scrolling. "Coming soon" should always offer a path forward.

**Where:** `src/components/episode/CardSidebar.tsx`.

**How:**
- New compact CTA at top of sidebar: `[🔥 Buy Charizard V (SAR) — ~$45 ↗]` — full-width pill, terracotta gradient background.
  - When card has real URL: links to `cards[0].affiliateUrl`.
  - When `affiliateUrl === "#"`: button text becomes `Browse this card in Shop →` and links to `/shop` (with anchor `#card-{slug}` for future filtering).
- Existing "Buy link coming soon" inert text is replaced with a styled link to `/shop`.
- Card image becomes wrapped in `<a>` when URL is present; pure `<div>` otherwise. Hover ring: `box-shadow: 0 0 0 3px rgba(212,137,58,0.25)`.
- Reading-level info block (the "Junior Fables / Full Fables" mode card) **stays at the top** of the sidebar — it's contextually important for parents and removing it from the top would feel wrong on a kids' site. The new top Buy CTA goes immediately below it (still above the card image), so the reading-level reassurance is read first, then the Buy CTA, then the card visual. This keeps trust signals leading on a kids' product while still moving the CTA above the fold.

**Edge cases:**
- Multi-card episodes: top CTA shows only the first card's Buy. Below, each card retains its own info block; the bottom Buy button is preserved for the first card. (Multi-card buy UX is not solved here; flagged for future.)
- Junior mode: button copy stays the same; the parent-warning microcopy ("Ask a parent first!") stays under the bottom button only — no need to repeat at top.

**Success check:** On a phone viewport, the Buy CTA is visible without scrolling the sidebar.

---

### 3. Smarter "You Might Like" — match by episode cards

**What:** Replace the random shuffle in `randomProducts` with a deterministic ranker that prioritizes shop products whose `name` matches the episode's card names, then booster boxes from the same set, then generic gear.

**Why:** A reader who just read the Charizard episode is most likely to click on Charizard merchandise. Random selection wastes that signal.

**Where:** `src/components/episode/CardSidebar.tsx` + new `src/lib/shopMatch.ts`.

**How:**
- New `src/lib/shopMatch.ts` exports `rankProductsForEpisode(shop: ShopProduct[], cards: CardInfo[]): ShopProduct[]`.
  - Score each product:
    - +10 if product `name` contains any `cards[].name` (full match)
    - +5 if product `name` contains any card's short name (first word of `name`)
    - +2 if product `cat === "Featured"`
    - +1 if product `cat === "Booster"`
    - 0 otherwise
  - Sort descending by score; break ties by product `id` (stable).
  - Filter out products with `url === "#"` only if at least 3 products have real URLs; otherwise allow placeholders so the section never goes empty.
  - Return top 3.
- `<CardSidebar>` replaces `useMemo(() => shuffle(SHOP)...)` with `useMemo(() => rankProductsForEpisode(SHOP, cards), [cards])`.

**Edge cases:**
- Shop has fewer than 3 products: return all.
- No matches: top 3 by category priority (Featured > Booster > Gear).
- Same product matches multiple cards: still scored once.

**Success check:** On episode 1 (Charizard), the first "You Might Like" item is "Charizard V (SAR)" from `shop.json`.

---

### 4. End-of-episode card spotlight

**What:** New component `<EpisodeCardSpotlight>` rendered between the story body and the Ko-fi line. A clean panel showing each card from the episode with a thumbnail, name, set, and a Buy CTA. Headline: "Cards from this episode →".

**Why:** The cliffhanger is the emotional peak. Readers stop, take a breath, and decide whether to continue or close the tab. This is the highest-intent moment for an affiliate ask. Currently we go straight to Ko-fi — which is a donation ask, secondary revenue. Affiliate should come first.

**Where:** `src/components/episode/EpisodeCardSpotlight.tsx` (new), wired into `EpisodeReader.tsx`.

**How:**
- Component receives `cards: CardInfo[]` and `seriesColor: string`.
- Layout: horizontal row of card thumbnails (max 3, stacks on mobile), each ~120×168px, with name + set below, and a Buy button per card.
- Buy button uses same logic as sidebar (real URL → Amazon; `#` → `/shop`).
- Container: parchment background, dashed terracotta border, subtle inner glow with `seriesColor`.
- Insertion point: in `EpisodeReader.tsx`, between `<StoryRenderer />` and `<NextEpisodeCTA />`. Final reading flow becomes: **Story → Cliffhanger → Cards spotlight (affiliate) → Ko-fi line (donation) → Next episode CTA**.

**Note on Ko-fi line:** The "Buy us a coffee" line currently lives at the top of `<NextEpisodeCTA>`. It stays there — the spotlight goes *before* it. Order: affiliate before donation before next-episode.

**Edge cases:**
- Single-card episode: spotlight shows one larger card (~200×280px) centered.
- All cards have `affiliateUrl === "#"`: spotlight still renders, all buttons link to `/shop`.

**Success check:** After scrolling past "To be continued..." on episode 1, a card spotlight appears before the Ko-fi line.

---

### 5. Cards ↔ shop products connection

**What:** A small data-layer helper that finds a `ShopProduct` matching a `CardInfo`, used by §2 (deep-link to `/shop`) and potentially §4 (richer Buy CTA with actual price from `shop.json`).

**Why:** Today `episode.cards[].affiliateUrl` and `shop.json` are disconnected. Many episodes have `affiliateUrl: "#"` even when the same card exists in `shop.json`. We can fall back to shop data without requiring schema changes.

**Where:** `src/lib/shopMatch.ts` (same file as §3).

**How:**
- Export `findShopProductForCard(shop: ShopProduct[], card: CardInfo): ShopProduct | undefined`.
  - Match by `product.name === card.name` first (exact).
  - Fallback: short-name match (first word of card name appears in product name AND product `cat === "Featured"`).
- Used in §2 sidebar Buy CTA: when `card.affiliateUrl === "#"` but a matching shop product has a real URL, use the shop product's URL. Cleaner fallback than just routing to `/shop`.
- Used in §4 spotlight: same fallback logic for each card.

**Edge cases:**
- No match: fall back to `/shop` link as defined in §2.
- Shop product also has `url === "#"`: skip the upgrade, route to `/shop`.

**Success check:** Episode 1 has `cards[0].affiliateUrl: "#"`. Shop has `Charizard V (SAR)` with `url: "#"` (today). When the owner fills in the shop URL, episode 1's Buy button auto-uses it without editing the episode JSON.

---

## Data flow

```
episode.cards[i] ─┐
                  │  ┌─ §1 cardMentions.ts → CardChip → focus-card event
                  ├──┤
                  │  └─ §3 + §5 shopMatch.ts ─┬─ rankProductsForEpisode → "You Might Like"
                  │                            └─ findShopProductForCard ─┬─ §2 sidebar Buy URL
                  │                                                       └─ §4 spotlight Buy URL
SHOP (shop.json) ─┘
```

No new persisted data. No schema changes to episode JSON or shop.json. All logic is derived at render time from existing fields.

---

## Testing

Each helper file gets a sibling `.test.ts` with `node --test` + the existing test harness. UI-level changes get spot-checked in a browser via `pnpm dev`.

**`cardMentions.test.ts`:**
- Splits a paragraph with one card name into `[text, chip, text]`
- Splits with multiple mentions (same name twice → two chips)
- Splits with multiple cards (each name finds its own index)
- Short-name fallback: text contains "Charizard" but card is "Charizard V (SAR)" → still matches
- Word boundaries: text contains "Charizardian" → no match
- Empty cards array → returns single text segment

**`shopMatch.test.ts`:**
- `rankProductsForEpisode` ranks card-name matches above featured above booster above gear
- Same product never appears twice
- `findShopProductForCard` returns exact match before short-name match
- `findShopProductForCard` returns undefined when no match
- Filters `url === "#"` when ≥3 real-URL products exist; allows placeholders otherwise

**Manual browser checks:**
- Click an inline card chip — sidebar card pulses, scrolls into view
- Buy button is visible at top of sidebar without scrolling on iPhone-13 viewport (390×844)
- "You Might Like" first item on Charizard episode is the Charizard SAR product
- Card spotlight renders between story and Ko-fi line
- All "coming soon" placeholders link to `/shop` and don't dead-end

---

## Visual/style notes (Ghibli theme — no new colors)

- **Card chip:** `border-bottom: 1px dotted var(--series-color)`. On hover: `background: rgba(seriesColor, 0.08)`. No bright link blue — preserve parchment feel.
- **Top sidebar Buy:** terracotta gradient (existing `Button` component is fine). Add a subtle ↗ glyph after price.
- **Card image hover:** parchment-tinted ring, not a harsh blue outline.
- **Spotlight container:** dashed border in `${seriesColor}33` (matches the existing `<NextEpisodeCTA>` dashed-border treatment).
- **Pulse animation:** 1.5s, 2 ring expansions, fades out. Same gold (`#D4893A`) used elsewhere.

All new elements respect `prefers-reduced-motion` (skip the pulse, skip smooth-scroll → use `behavior: "instant"`).

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Card-mention matcher false-positives (e.g., narrator says "I am no Charizard fan") | Short-name match is case-sensitive at word boundaries; we accept the rare false-positive — cost is low (a chip that links to a card the reader is reading about). |
| Multiple cards in one episode complicate the top CTA | v1 only highlights the first card. Multi-card buy UX flagged for a future spec. |
| Spotlight feels pushy in a kids' product | Tone copy carefully ("Cards from this episode" — descriptive, not "Buy now!"). Keep "ask a parent first" microcopy on every Buy button. |
| Smart "You Might Like" reduces variety, looks repetitive across episodes with same featured card | Acceptable — relevance > variety for conversion. |
| Inline chips inflate paragraph DOM and may complicate text-size toggle | Test all three sizes; chips inherit `font-size` from parent `<p>`. |

---

## Implementation outline (handed off to writing-plans)

The plan should sequence:

1. Helpers + tests (`cardMentions.ts`, `shopMatch.ts`) — pure functions, fully TDD-able
2. `<CardChip>` component + StoryRenderer integration + focus-card event
3. CardSidebar redesign (top CTA, "coming soon" link, smarter ranking, image hover)
4. `<EpisodeCardSpotlight>` component + EpisodeReader wiring
5. Manual browser verification + screenshot pass

Each step should be independently verifiable. Helpers ship first because §2 and §4 both depend on `findShopProductForCard`.
