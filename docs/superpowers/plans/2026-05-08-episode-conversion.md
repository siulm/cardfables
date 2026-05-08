# Episode-Page Conversion Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lift affiliate-revenue conversion on the episode reader page via 5 surgical changes (inline card chips, above-fold sidebar Buy CTA, smarter "You Might Like", end-of-episode card spotlight, cards↔shop fallback).

**Architecture:** Two pure-function helpers (`cardMentions.ts`, `shopMatch.ts`) drive UI logic. New components: `CardChip` (inline chip in story text) and `EpisodeCardSpotlight` (post-cliffhanger affiliate panel). Modifications to `StoryRenderer`, `CardSidebar`, `EpisodeReader`. No schema changes to episode JSON or `shop.json`. No new persisted data — everything is derived at render time.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, vitest (added for unit testing), pnpm.

**Spec:** `docs/superpowers/specs/2026-05-08-episode-conversion-design.md`

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/lib/cardMentions.ts` | new | Pure helper: split paragraph text into `{kind: "text" \| "chip"}` segments based on episode card names |
| `src/lib/cardMentions.test.ts` | new | Unit tests for `splitParagraph` |
| `src/lib/shopMatch.ts` | new | Pure helpers: `rankProductsForEpisode`, `findShopProductForCard` |
| `src/lib/shopMatch.test.ts` | new | Unit tests for both helpers |
| `src/components/episode/CardChip.tsx` | new | Inline-pill button that pulses + scrolls to sidebar card |
| `src/components/episode/EpisodeCardSpotlight.tsx` | new | Post-story panel listing the episode's cards with Buy CTAs |
| `src/components/episode/StoryRenderer.tsx` | modify | Accept `cards` prop, route `t:"p"` and `t:"q"` block text through `splitParagraph` |
| `src/components/episode/CardSidebar.tsx` | modify | Add IDs to card wrappers, listen for `cardfables:focus-card` event with pulse animation, add top Buy CTA, use `rankProductsForEpisode`, replace dead-end "coming soon" with `/shop` link, make card image hover-clickable |
| `src/components/episode/EpisodeReader.tsx` | modify | Pass `episode.cards` to `<StoryRenderer>`, insert `<EpisodeCardSpotlight>` between story and `<NextEpisodeCTA>` |
| `package.json` | modify | Add `vitest` dev dep + `test` script |
| `vitest.config.ts` | new | Minimal vitest config |

---

## Task 0: Set up vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run:
```bash
pnpm add -D vitest@^2
```
Expected: vitest added to devDependencies.

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

Edit `package.json` `scripts` block. Add two lines:
```json
"test": "vitest run",
"test:watch": "vitest"
```
Final `scripts` block:
```json
"scripts": {
  "dev": "next dev --turbopack",
  "prebuild": "node scripts/build-data.js",
  "build": "pnpm prebuild && next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Add a sanity test**

Create `src/lib/sanity.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("vitest works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run sanity test, verify pass**

Run: `pnpm test`
Expected: `1 passed`. If fail, fix config before proceeding.

- [ ] **Step 6: Delete sanity test**

Run: `rm src/lib/sanity.test.ts`

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for unit testing helpers"
```

---

## Task 1: `cardMentions.ts` helper (TDD)

**Files:**
- Create: `src/lib/cardMentions.test.ts`
- Create: `src/lib/cardMentions.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/cardMentions.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { splitParagraph } from "./cardMentions";
import type { CardInfo } from "./types";

const charizard: CardInfo = {
  name: "Charizard V (SAR)",
  set: "VSTAR Universe",
  artist: "Oswaldo KATO",
  emoji: "🔥",
};
const venusaur: CardInfo = {
  name: "Venusaur",
  set: "Base Set",
  artist: "Mitsuhiro Arita",
  emoji: "🌿",
};

describe("splitParagraph", () => {
  it("returns single text segment when no cards", () => {
    expect(splitParagraph("hello world", [])).toEqual([
      { kind: "text", value: "hello world" },
    ]);
  });

  it("returns single text segment when no card names appear", () => {
    expect(splitParagraph("a quiet day", [charizard])).toEqual([
      { kind: "text", value: "a quiet day" },
    ]);
  });

  it("wraps short-name match (first word of card name)", () => {
    const result = splitParagraph("Charizard was napping.", [charizard]);
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " was napping." },
    ]);
  });

  it("wraps multiple occurrences of same card", () => {
    const result = splitParagraph("Charizard saw Charizard.", [charizard]);
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " saw " },
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: "." },
    ]);
  });

  it("wraps mentions across multiple cards", () => {
    const result = splitParagraph(
      "Charizard met Venusaur today.",
      [charizard, venusaur]
    );
    expect(result).toEqual([
      { kind: "chip", value: "Charizard", cardIndex: 0 },
      { kind: "text", value: " met " },
      { kind: "chip", value: "Venusaur", cardIndex: 1 },
      { kind: "text", value: " today." },
    ]);
  });

  it("prefers full name over short name when both match", () => {
    const result = splitParagraph(
      "The Charizard V (SAR) is rare.",
      [charizard]
    );
    expect(result[0]).toEqual({
      kind: "chip",
      value: "Charizard V (SAR)",
      cardIndex: 0,
    });
  });

  it("respects word boundaries — does not match within larger word", () => {
    const result = splitParagraph("Charizardian dialect", [charizard]);
    expect(result).toEqual([
      { kind: "text", value: "Charizardian dialect" },
    ]);
  });

  it("matches at end of string (no trailing char)", () => {
    const result = splitParagraph("look — Charizard", [charizard]);
    expect(result).toEqual([
      { kind: "text", value: "look — " },
      { kind: "chip", value: "Charizard", cardIndex: 0 },
    ]);
  });

  it("matches at start of string", () => {
    const result = splitParagraph("Charizard yawned.", [charizard]);
    expect(result[0]).toEqual({
      kind: "chip",
      value: "Charizard",
      cardIndex: 0,
    });
  });

  it("handles empty text", () => {
    expect(splitParagraph("", [charizard])).toEqual([
      { kind: "text", value: "" },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/cardMentions.test.ts`
Expected: All 10 tests fail with "Cannot find module './cardMentions'".

- [ ] **Step 3: Implement `splitParagraph`**

Create `src/lib/cardMentions.ts`:
```ts
import type { CardInfo } from "./types";

export type Segment =
  | { kind: "text"; value: string }
  | { kind: "chip"; value: string; cardIndex: number };

interface Matcher {
  needle: string;
  cardIndex: number;
}

function isWordChar(ch: string): boolean {
  return /\w/.test(ch);
}

export function splitParagraph(text: string, cards: CardInfo[]): Segment[] {
  if (!text || cards.length === 0) {
    return [{ kind: "text", value: text }];
  }

  const matchers: Matcher[] = [];
  cards.forEach((card, idx) => {
    matchers.push({ needle: card.name, cardIndex: idx });
    const short = card.name.split(/\s+/)[0];
    if (short && short !== card.name) {
      matchers.push({ needle: short, cardIndex: idx });
    }
  });
  // Longer needles first so "Charizard V (SAR)" wins over "Charizard"
  matchers.sort((a, b) => b.needle.length - a.needle.length);

  const segments: Segment[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) {
      segments.push({ kind: "text", value: buffer });
      buffer = "";
    }
  };

  while (i < text.length) {
    let matched: Matcher | null = null;
    for (const m of matchers) {
      if (!text.startsWith(m.needle, i)) continue;
      const before = i === 0 ? "" : text[i - 1];
      const after = text[i + m.needle.length] ?? "";
      if (!isWordChar(before) && !isWordChar(after)) {
        matched = m;
        break;
      }
    }
    if (matched) {
      flush();
      segments.push({
        kind: "chip",
        value: text.slice(i, i + matched.needle.length),
        cardIndex: matched.cardIndex,
      });
      i += matched.needle.length;
    } else {
      buffer += text[i];
      i++;
    }
  }
  flush();
  // Preserve invariant: empty input returns [{ kind: "text", value: "" }]
  if (segments.length === 0) {
    segments.push({ kind: "text", value: "" });
  }
  return segments;
}
```

Note: The "full name over short name" test relies on word-boundary checks plus longest-first ordering. `"Charizard V (SAR)"` matches at position 4 with after-char ` ` (non-word). `"Charizard"` would also match at position 4, but matchers are sorted longest-first so the full name wins.

Wait — `"Charizard V (SAR)"` ends with `)`, after-char is ` ` or end-of-string in our test text `"The Charizard V (SAR) is rare."`. Word-boundary on `)` next to `i` (word char)? The regex `\w` is `[A-Za-z0-9_]`. `)` is not `\w`, ` ` is not `\w`, `i` is `\w`. After-char check: char at `i + needle.length` = `" "` (space before `is`). Not word char. Good. Before-char at position 4 is `" "` (space after `The`). Not word char. So match succeeds. ✓

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/cardMentions.test.ts`
Expected: All 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cardMentions.ts src/lib/cardMentions.test.ts
git commit -m "feat: add cardMentions helper for inline card chips"
```

---

## Task 2: `shopMatch.ts` helpers (TDD)

**Files:**
- Create: `src/lib/shopMatch.test.ts`
- Create: `src/lib/shopMatch.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/shopMatch.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { rankProductsForEpisode, findShopProductForCard } from "./shopMatch";
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
    // Charizard V (SAR) (full match) first, then Charizard Plush (short match)
    expect(result[0].name).toBe("Charizard V (SAR)");
    expect(result[1].name).toBe("Charizard Plush");
  });

  it("ranks Featured above Booster above Gear when no card match", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(shop, [noCard], 6);
    // Featured first (Charizard SAR), then Boosters by id, then Gear by id
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
    // Boosters (id 2 and id 5) — id 2 first
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
    expect(result).toHaveLength(3); // placeholder D filtered
    expect(result.every((p) => p.url !== "#")).toBe(true);
  });

  it("allows placeholder URLs when fewer than 3 real-URL products exist", () => {
    const noCard: CardInfo = { name: "Mewtwo", set: "X", artist: "Y", emoji: "🧠" };
    const result = rankProductsForEpisode(shop, [noCard], 3);
    // All shop URLs are "#" — should still return 3 products
    expect(result).toHaveLength(3);
  });

  it("returns all when shop smaller than limit", () => {
    const tinyShop: ShopProduct[] = shop.slice(0, 2);
    const result = rankProductsForEpisode(tinyShop, [charizard]);
    expect(result).toHaveLength(2);
  });

  it("scores a product once even if multiple cards match", () => {
    const cards = [charizard, charizard];
    // Should still return Charizard SAR first; not throw
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
    // Two booster products contain "Booster" but neither is Featured
    expect(findShopProductForCard(shop, noCard)).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/shopMatch.test.ts`
Expected: 14 tests fail with "Cannot find module './shopMatch'".

- [ ] **Step 3: Implement helpers**

Create `src/lib/shopMatch.ts`:
```ts
import type { CardInfo, ShopProduct } from "./types";

const FULL_NAME_MATCH = 10;
const SHORT_NAME_MATCH = 5;
const FEATURED_BONUS = 2;
const BOOSTER_BONUS = 1;

function shortName(name: string): string {
  return name.split(/\s+/)[0];
}

export function rankProductsForEpisode(
  shop: ShopProduct[],
  cards: CardInfo[],
  limit = 3
): ShopProduct[] {
  const realUrlCount = shop.filter((p) => p.url && p.url !== "#").length;
  const pool =
    realUrlCount >= 3 ? shop.filter((p) => p.url && p.url !== "#") : shop;

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/shopMatch.test.ts`
Expected: 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shopMatch.ts src/lib/shopMatch.test.ts
git commit -m "feat: add shopMatch helpers for episode-aware product ranking"
```

---

## Task 3: `<CardChip>` component

**Files:**
- Create: `src/components/episode/CardChip.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/episode/CardChip.tsx`:
```tsx
"use client";

interface CardChipProps {
  cardIndex: number;
  seriesColor: string;
  children: React.ReactNode;
}

export function CardChip({ cardIndex, seriesColor, children }: CardChipProps) {
  const onClick = () => {
    window.dispatchEvent(
      new CustomEvent("cardfables:focus-card", { detail: { index: cardIndex } })
    );
    const target = document.getElementById(`sidebar-card-${cardIndex}`);
    if (target) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      target.scrollIntoView({
        behavior: reduce ? "instant" : "smooth",
        block: "center",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:bg-[rgba(74,64,53,0.06)]"
      style={{
        font: "inherit",
        color: "inherit",
        borderBottom: `1px dotted ${seriesColor}`,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/episode/CardChip.tsx
git commit -m "feat: add CardChip inline-pill component"
```

---

## Task 4: Wire `<CardChip>` into `<StoryRenderer>`

**Files:**
- Modify: `src/components/episode/StoryRenderer.tsx`

- [ ] **Step 1: Replace the file**

Open `src/components/episode/StoryRenderer.tsx` and replace its contents with:
```tsx
import type { CardInfo, StoryData } from "@/lib/types";
import { splitParagraph } from "@/lib/cardMentions";
import { CardChip } from "./CardChip";

type TextSize = "normal" | "large" | "xl";

const SIZE_MAP: Record<TextSize, Record<"junior" | "full", { fontSize: string; lineHeight: string }>> = {
  normal: { junior: { fontSize: "16px", lineHeight: "1.9" }, full: { fontSize: "15px", lineHeight: "1.85" } },
  large:  { junior: { fontSize: "19px", lineHeight: "2.0" }, full: { fontSize: "18px", lineHeight: "1.95" } },
  xl:     { junior: { fontSize: "22px", lineHeight: "2.1" }, full: { fontSize: "21px", lineHeight: "2.05" } },
};

interface StoryRendererProps {
  story: StoryData;
  seriesColor: string;
  mode: "junior" | "full";
  textSize?: TextSize;
  cards: CardInfo[];
}

function renderWithChips(
  text: string,
  cards: CardInfo[],
  seriesColor: string
): React.ReactNode {
  const segments = splitParagraph(text, cards);
  return segments.map((seg, i) => {
    if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
    return (
      <CardChip key={i} cardIndex={seg.cardIndex} seriesColor={seriesColor}>
        {seg.value}
      </CardChip>
    );
  });
}

export function StoryRenderer({
  story,
  seriesColor,
  mode,
  textSize = "normal",
  cards,
}: StoryRendererProps) {
  const { fontSize, lineHeight } = SIZE_MAP[textSize][mode];
  return (
    <article className="max-w-2xl">
      <p className="mb-8 text-sm italic text-text-secondary">{story.scene}</p>

      <div className="space-y-6">
        {story.paragraphs.map((block, i) => {
          switch (block.t) {
            case "p":
              return (
                <p
                  key={i}
                  className="text-text-story"
                  style={{ fontSize, lineHeight }}
                >
                  {renderWithChips(block.c, cards, seriesColor)}
                </p>
              );
            case "q":
              return (
                <blockquote
                  key={i}
                  className="rounded-xl border-l-2 py-1 pl-5"
                  style={{ borderColor: seriesColor }}
                >
                  {block.speaker && (
                    <span
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: seriesColor }}
                    >
                      {block.speaker}
                    </span>
                  )}
                  <p className="text-base italic leading-[1.85] text-text-primary">
                    {renderWithChips(block.c, cards, seriesColor)}
                  </p>
                </blockquote>
              );
            case "a":
              return (
                <p
                  key={i}
                  className="text-center text-sm italic text-text-secondary"
                >
                  {block.c}
                </p>
              );
            case "end":
              return (
                <p
                  key={i}
                  className="mt-8 text-center font-heading text-xl font-bold italic"
                  style={{ color: seriesColor }}
                >
                  {block.c}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}
```

Note: `block.t === "a"` (scene-direction asides) and `block.t === "end"` ("To be continued...") intentionally do NOT route through `splitParagraph` — they're descriptive/closing text where wrapping a card name would feel odd. Only `"p"` and `"q"` get chip processing.

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: One error in `EpisodeReader.tsx` because the `cards` prop is now required but isn't passed yet. We fix that in Task 7.

- [ ] **Step 3: Commit (incomplete state — type error is expected)**

Skip commit until Task 7. The codebase will not build cleanly between Task 4 and Task 7.

(Alternative: make `cards` optional with a default of `[]`, commit, then tighten in Task 7. Keep it required — fewer moving parts.)

---

## Task 5: `<CardSidebar>` redesign

**Files:**
- Modify: `src/components/episode/CardSidebar.tsx`

This is the largest single edit. Five distinct changes inside the same file:
- (a) Add `id="sidebar-card-${ci}"` to each card wrapper div
- (b) Listen for `cardfables:focus-card` event with pulse animation
- (c) Add top Buy CTA above the card image
- (d) Make card image hover-clickable (when URL present)
- (e) Replace random `randomProducts` with `rankProductsForEpisode`
- (f) Replace "Buy link coming soon" inert text with link to `/shop`

- [ ] **Step 1: Replace the file**

Open `src/components/episode/CardSidebar.tsx` and replace its contents with:
```tsx
"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import type { AffiliateProduct, CardInfo } from "@/lib/types";
import { SHOP } from "@/lib/data";
import { rankProductsForEpisode, findShopProductForCard } from "@/lib/shopMatch";

interface CardSidebarProps {
  cards: CardInfo[];
  products?: AffiliateProduct[];
  seriesColor: string;
  mode: "junior" | "full";
}

function resolveBuy(card: CardInfo): { url: string; external: boolean } {
  if (card.affiliateUrl && card.affiliateUrl !== "#") {
    return { url: card.affiliateUrl, external: true };
  }
  const fallback = findShopProductForCard(SHOP, card);
  if (fallback?.url && fallback.url !== "#") {
    return { url: fallback.url, external: true };
  }
  return { url: "/shop", external: false };
}

export function CardSidebar({ cards, products, seriesColor, mode }: CardSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const [pulseIndex, setPulseIndex] = useState<number | null>(null);

  // Scroll-direction sticky behavior (unchanged)
  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const topGap = 96;
    let lastScrollY = window.scrollY;
    let stickyTop = topGap;

    const onScroll = () => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const sidebarH = aside.offsetHeight;
      const viewportH = window.innerHeight;

      if (sidebarH <= viewportH - topGap) {
        stickyTop = topGap;
      } else {
        const minTop = viewportH - sidebarH;
        stickyTop = Math.max(minTop, Math.min(topGap, stickyTop - delta));
      }

      aside.style.top = `${stickyTop}px`;
      lastScrollY = scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Listen for chip clicks → pulse the matching card
  useEffect(() => {
    const onFocus = (e: Event) => {
      const detail = (e as CustomEvent<{ index: number }>).detail;
      if (typeof detail?.index !== "number") return;
      setPulseIndex(detail.index);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ms = reduce ? 0 : 1500;
      window.setTimeout(() => setPulseIndex(null), ms);
    };
    window.addEventListener("cardfables:focus-card", onFocus as EventListener);
    return () =>
      window.removeEventListener("cardfables:focus-card", onFocus as EventListener);
  }, []);

  // Smarter "You Might Like" — episode-aware
  const suggestedProducts = useMemo(
    () => rankProductsForEpisode(SHOP, cards, 3),
    [cards]
  );

  const primaryCard = cards[0];
  const primaryBuy = primaryCard ? resolveBuy(primaryCard) : null;

  return (
    <aside ref={asideRef} className="lg:sticky lg:self-start" style={{ top: 96 }}>
      {/* Reading level info — stays at top for parent reassurance */}
      <div
        className="mb-3.5 rounded-xl border p-3.5"
        style={{
          background:
            mode === "junior"
              ? "rgba(34,197,94,0.06)"
              : "rgba(232,101,26,0.06)",
          borderColor:
            mode === "junior"
              ? "rgba(34,197,94,0.12)"
              : "rgba(232,101,26,0.12)",
        }}
      >
        <div
          className="mb-1 text-xs font-bold"
          style={{ color: mode === "junior" ? "#22C55E" : "#E8651A" }}
        >
          {mode === "junior" ? "\u{1F423} Junior Fables" : "\u{1F525} Full Fables"}
        </div>
        <p className="text-xs leading-relaxed text-text-dim">
          {mode === "junior"
            ? "Written for ages 6–11. Shorter sentences, simpler words, all the fun. Perfect for reading together!"
            : "Written for ages 12 and up. Richer vocabulary, deeper emotions, dramatic storytelling."}
        </p>
      </div>

      {/* Top Buy CTA — above-the-fold conversion */}
      {primaryCard && primaryBuy && (
        <BuyCTA
          card={primaryCard}
          buy={primaryBuy}
          variant="top"
        />
      )}

      {/* Card placeholders */}
      <div className="flex flex-col gap-3">
        {cards.map((card, ci) => {
          const buy = resolveBuy(card);
          const cardImage = (
            <div
              className="relative h-full w-full overflow-hidden rounded-2xl"
              style={{
                aspectRatio: cards.length > 1 ? "3/2" : "2.5/3.5",
                boxShadow:
                  pulseIndex === ci
                    ? `0 0 0 3px ${seriesColor}, 0 0 32px ${seriesColor}80`
                    : `0 0 40px ${seriesColor}10, 0 16px 48px rgba(0,0,0,0.08)`,
                transition: "box-shadow 350ms ease-out",
              }}
            >
              {card.image ? (
                <img
                  src={card.image}
                  alt={card.name}
                  width={320}
                  height={448}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full flex-col items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}55, ${seriesColor}22)`,
                  }}
                >
                  <span className={cards.length > 1 ? "text-4xl" : "text-5xl"}>
                    {card.emoji}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-white/90">
                    {card.name}
                  </span>
                </div>
              )}
              {card.sold && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-bold tracking-widest text-white shadow-lg"
                    style={{ transform: "rotate(-12deg)" }}
                  >
                    SOLD
                  </span>
                </div>
              )}
              {cards.length > 1 && (
                <div className="absolute top-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-bold tracking-wider text-white/90 backdrop-blur-sm">
                  CARD {ci + 1} OF {cards.length}
                </div>
              )}
            </div>
          );

          return (
            <div
              id={`sidebar-card-${ci}`}
              key={ci}
              className="relative"
            >
              {buy.external ? (
                <a
                  href={buy.url}
                  target="_blank"
                  rel="nofollow noopener"
                  aria-label={`Buy ${card.name} on Amazon`}
                  className="block"
                >
                  {cardImage}
                </a>
              ) : (
                <Link
                  href={buy.url}
                  aria-label={`Browse ${card.name} in shop`}
                  className="block"
                >
                  {cardImage}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Card info + bottom Buy CTA */}
      <div
        className="mt-3.5 rounded-xl border border-border p-4"
        style={{ background: "var(--color-surface-light, #E8DFD0)" }}
      >
        {cards.map((card, ci) => (
          <div key={ci} className={ci < cards.length - 1 ? "mb-3" : ""}>
            <h3 className="mb-0.5 text-[13px] font-bold text-text-primary">
              {card.name}
            </h3>
            <p className="text-xs text-text-dim">
              {card.set} &middot; Art by {card.artist}
            </p>
            {ci < cards.length - 1 && <div className="mt-3 h-px bg-border" />}
          </div>
        ))}

        {primaryCard && primaryBuy && (
          <BuyCTA
            card={primaryCard}
            buy={primaryBuy}
            variant="bottom"
          />
        )}
      </div>

      {/* Collector's Gear (unchanged) */}
      {products && products.length > 0 && (
        <div
          className="mt-3.5 rounded-xl border border-border p-4"
          style={{ background: "var(--color-surface-light, #E8DFD0)" }}
        >
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            Collector&apos;s Gear ↗
          </h4>
          <p className="mb-2.5 text-[10px] text-text-dim">
            These links go to Amazon.com — ask a grown-up before buying!
          </p>
          <div className="flex flex-col gap-2.5">
            {products.map((product, i) => (
              <a
                key={i}
                href={product.url}
                target="_blank"
                rel="nofollow noopener"
                className="flex items-center gap-3 rounded-lg border border-border p-2.5 transition-colors hover:border-[rgba(74,64,53,0.20)]"
                style={{ background: "rgba(74,64,53,0.04)" }}
              >
                <span className="text-lg">{product.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-semibold text-text-primary">
                    {product.name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-dim">
                    <span>{product.price}</span>
                    <span className="rounded bg-[rgba(74,64,53,0.08)] px-1.5 py-0.5 text-[9px] font-medium">
                      {product.tag}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
          <p className="mt-3 text-center text-[11px] text-text-secondary">
            As an Amazon Associate I earn from qualifying purchases
          </p>
        </div>
      )}

      {/* You Might Like — now episode-aware */}
      {suggestedProducts.length > 0 && (
        <div
          className="mt-3.5 rounded-xl border border-border p-4"
          style={{ background: "var(--color-surface, #F2EDE4)" }}
        >
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            You Might Like
          </h4>
          <div className="flex flex-col gap-2.5">
            {suggestedProducts.map((product, i) => {
              const hasUrl = product.url && product.url !== "#";
              const Tag = hasUrl ? "a" : Link;
              const href = hasUrl ? product.url! : "/shop";
              const props = hasUrl
                ? {
                    href,
                    target: "_blank" as const,
                    rel: "nofollow noopener",
                  }
                : { href };
              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Tag
                  key={i}
                  {...(props as any)}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-[rgba(212,137,58,0.3)]"
                  style={{ background: "rgba(74,64,53,0.04)" }}
                >
                  <span className="text-2xl">{product.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-text-primary">
                      {product.name}
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-dim">
                      {product.desc}
                    </div>
                    <div className="mt-1 text-xs font-bold text-gold">
                      {product.price}
                    </div>
                  </div>
                </Tag>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

interface BuyCTAProps {
  card: CardInfo;
  buy: { url: string; external: boolean };
  variant: "top" | "bottom";
}

function BuyCTA({ card, buy, variant }: BuyCTAProps) {
  const label = buy.external
    ? `Buy ${card.name} ↗`
    : `Browse this card in Shop →`;

  const className =
    "mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-[#FFFEF7] transition-opacity hover:opacity-90";
  const style = {
    background: "linear-gradient(135deg, #D4893A, #B86E28)",
    boxShadow: "0 8px 28px rgba(212,137,58,0.25)",
  };

  const button = buy.external ? (
    <a
      href={buy.url}
      target="_blank"
      rel="nofollow noopener"
      className={className}
      style={style}
    >
      {label}
    </a>
  ) : (
    <Link href={buy.url} className={className} style={style}>
      {label}
    </Link>
  );

  return (
    <>
      {button}
      <p className="mt-2 text-center text-[10px] text-text-dim">
        {variant === "top"
          ? buy.external
            ? "Opens Amazon.com — ask a parent first!"
            : "Browse related cards on our shop page"
          : buy.external
          ? "Opens Amazon.com — ask a parent first!"
          : "Browse related cards on our shop page"}
      </p>
    </>
  );
}
```

Note on the `Tag` polymorphism in "You Might Like": `next/link`'s `Link` and a plain `<a>` have slightly different prop shapes. The `as any` cast on props is intentional — it avoids a complex generic dance for two trivial shapes. Keep it scoped to that one line.

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: Same single error from Task 4 (`StoryRenderer` requires `cards` prop) — no new errors from this file.

- [ ] **Step 3: Skip commit**

Codebase still doesn't build cleanly. Commit happens after Task 7.

---

## Task 6: `<EpisodeCardSpotlight>` component

**Files:**
- Create: `src/components/episode/EpisodeCardSpotlight.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/episode/EpisodeCardSpotlight.tsx`:
```tsx
import Link from "next/link";
import type { CardInfo } from "@/lib/types";
import { SHOP } from "@/lib/data";
import { findShopProductForCard } from "@/lib/shopMatch";

interface EpisodeCardSpotlightProps {
  cards: CardInfo[];
  seriesColor: string;
}

function resolveBuy(card: CardInfo): { url: string; external: boolean } {
  if (card.affiliateUrl && card.affiliateUrl !== "#") {
    return { url: card.affiliateUrl, external: true };
  }
  const fallback = findShopProductForCard(SHOP, card);
  if (fallback?.url && fallback.url !== "#") {
    return { url: fallback.url, external: true };
  }
  return { url: "/shop", external: false };
}

export function EpisodeCardSpotlight({
  cards,
  seriesColor,
}: EpisodeCardSpotlightProps) {
  if (cards.length === 0) return null;
  const single = cards.length === 1;

  return (
    <section
      className="mt-12 rounded-2xl border border-dashed p-6"
      style={{
        borderColor: `${seriesColor}55`,
        background: `linear-gradient(180deg, ${seriesColor}06, transparent)`,
      }}
    >
      <h2 className="mb-1 text-center font-heading text-lg font-bold text-text-primary">
        Cards from this episode
      </h2>
      <p className="mb-5 text-center text-xs text-text-dim">
        Want the real card? Tap to shop.
      </p>
      <div
        className={`flex gap-4 ${
          single ? "justify-center" : "flex-wrap justify-center"
        }`}
      >
        {cards.map((card, i) => {
          const buy = resolveBuy(card);
          const w = single ? 200 : 140;
          const h = single ? 280 : 196;
          return (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ width: w }}
            >
              <div
                className="relative overflow-hidden rounded-xl"
                style={{
                  width: w,
                  height: h,
                  boxShadow: `0 0 0 1px ${seriesColor}22, 0 12px 32px rgba(0,0,0,0.10)`,
                }}
              >
                {card.image ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${seriesColor}CC, ${seriesColor}55, ${seriesColor}22)`,
                    }}
                  >
                    <span className="text-4xl">{card.emoji}</span>
                  </div>
                )}
              </div>
              <div className="mt-2.5 text-center">
                <div className="text-[13px] font-bold text-text-primary">
                  {card.name}
                </div>
                <div className="text-[11px] text-text-dim">{card.set}</div>
              </div>
              {buy.external ? (
                <a
                  href={buy.url}
                  target="_blank"
                  rel="nofollow noopener"
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-[#FFFEF7] transition-opacity hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #D4893A, #B86E28)",
                  }}
                >
                  Buy on Amazon ↗
                </a>
              ) : (
                <Link
                  href={buy.url}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-secondary transition-colors hover:border-[rgba(212,137,58,0.3)] hover:text-text-primary"
                >
                  Browse in Shop →
                </Link>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center text-[10px] text-text-dim">
        Amazon links open in a new tab — ask a parent first!
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: Still the same single error from Task 4. No new errors.

- [ ] **Step 3: Skip commit**

Codebase still doesn't build cleanly. Commit happens after Task 7.

---

## Task 7: Wire everything into `<EpisodeReader>`

**Files:**
- Modify: `src/components/episode/EpisodeReader.tsx`

This task closes the type error from Task 4 by passing `episode.cards` to `<StoryRenderer>`, and inserts `<EpisodeCardSpotlight>` between the story and `<NextEpisodeCTA>`.

- [ ] **Step 1: Edit EpisodeReader.tsx**

Open `src/components/episode/EpisodeReader.tsx`. Find the import block at the top and add the spotlight import. Find the two-column reader JSX (around line 150) and add `cards={episode.cards}` to `<StoryRenderer>` plus a `<EpisodeCardSpotlight>` after it.

Apply this edit:

Find:
```tsx
import { CardSidebar } from "./CardSidebar";
import { StoryRenderer } from "./StoryRenderer";
import { NextEpisodeCTA } from "./NextEpisodeCTA";
import type { Episode, Series } from "@/lib/types";
```

Replace with:
```tsx
import { CardSidebar } from "./CardSidebar";
import { StoryRenderer } from "./StoryRenderer";
import { NextEpisodeCTA } from "./NextEpisodeCTA";
import { EpisodeCardSpotlight } from "./EpisodeCardSpotlight";
import type { Episode, Series } from "@/lib/types";
```

Find:
```tsx
        <div>
          <StoryRenderer story={story} seriesColor={series.color} mode={mode} textSize={textSize} />
          <NextEpisodeCTA
            series={series}
            currentEpisodeId={episode.id}
            currentEpisodeIndex={episodeIndex}
          />
        </div>
```

Replace with:
```tsx
        <div>
          <StoryRenderer
            story={story}
            seriesColor={series.color}
            mode={mode}
            textSize={textSize}
            cards={episode.cards}
          />
          <EpisodeCardSpotlight
            cards={episode.cards}
            seriesColor={series.color}
          />
          <NextEpisodeCTA
            series={series}
            currentEpisodeId={episode.id}
            currentEpisodeIndex={episodeIndex}
          />
        </div>
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run lint**

Run: `pnpm lint`
Expected: 0 errors. (Warnings like `next/image` reminders on `<img>` tags are pre-existing — leave them.)

- [ ] **Step 4: Run all unit tests**

Run: `pnpm test`
Expected: 24 tests pass (10 cardMentions + 14 shopMatch).

- [ ] **Step 5: Build**

Run: `pnpm build`
Expected: Build succeeds. If it fails on something unrelated (e.g., env-var requirement), report and stop.

- [ ] **Step 6: Commit all wiring**

```bash
git add src/lib/cardMentions.ts src/lib/cardMentions.test.ts \
        src/lib/shopMatch.ts src/lib/shopMatch.test.ts \
        src/components/episode/CardChip.tsx \
        src/components/episode/EpisodeCardSpotlight.tsx \
        src/components/episode/StoryRenderer.tsx \
        src/components/episode/CardSidebar.tsx \
        src/components/episode/EpisodeReader.tsx
git commit -m "feat: episode-page conversion improvements

- Inline CardChip in story text (tap → pulse + scroll sidebar card)
- Above-the-fold sidebar Buy CTA, no more 'coming soon' dead-ends
- Smarter 'You Might Like' ranked by episode card matches
- New EpisodeCardSpotlight panel between story and Ko-fi line
- Cards ↔ shop products fallback via findShopProductForCard

Spec: docs/superpowers/specs/2026-05-08-episode-conversion-design.md"
```

---

## Task 8: Manual browser verification

**Files:** none modified — this is an evidence-gathering task.

- [ ] **Step 1: Start the dev server**

Run: `pnpm dev`
Wait for: `Local: http://localhost:3000`

- [ ] **Step 2: Visit episode 1 of Flames of Our Lives**

URL: `http://localhost:3000/series/flames-of-our-lives/the-nap-that-changed-everything`

- [ ] **Step 3: Verify inline card chips**

Look at the first paragraph in Junior mode:
> "Charizard was the biggest, strongest Pokémon in Verdant Valley..."

Expected: "Charizard" is rendered as a button with a dotted underline in the series color. Hover: subtle background tint. Click: sidebar card pulses gold/orange ring for ~1.5s. On a phone-sized viewport (DevTools 390×844), clicking the chip scrolls down to the sidebar card.

If the chip doesn't appear: open DevTools, search the rendered HTML for `<button` inside the first `<p>`. If absent, `splitParagraph` is being called but returning a single text segment — check that `cards` prop is reaching `StoryRenderer`.

- [ ] **Step 4: Verify above-the-fold Buy CTA**

Resize the viewport to 390×844 (iPhone 13 portrait). The sidebar (or its mobile-stacked equivalent below the story) shows:
- Junior/Full Fables reading-level info card
- A terracotta-gradient pill button: `Browse this card in Shop →` (because `affiliateUrl: "#"` for episode 1)
- THEN the card image

Expected: Button label says "Browse this card in Shop →" and clicking it goes to `/shop`. (Once a real Amazon URL is added later, this becomes "Buy Charizard V (SAR) ↗" and opens Amazon.)

- [ ] **Step 5: Verify clickable card image**

Click the Charizard card image in the sidebar.
Expected: navigates to `/shop` (since `affiliateUrl` is `#`).

- [ ] **Step 6: Verify smart "You Might Like"**

Scroll the sidebar to the "You Might Like" panel.
Expected: First item is "Charizard V (SAR)" (the matching Featured product from `shop.json`).

- [ ] **Step 7: Verify end-of-episode card spotlight**

Scroll to the end of the story. Expected order:
1. "To be continued..." (story end)
2. **NEW:** "Cards from this episode" panel — single Charizard card centered, with "Browse in Shop →" button
3. "Enjoyed this fable? Buy us a coffee ☕" (Ko-fi)
4. "Next Episode" CTA box

- [ ] **Step 8: Verify multi-card episode**

Visit any episode with >1 card. (Check by inspecting `clients/pokemon-fables/series/flames-of-our-lives/episodes/episode-*.json` files for `cards` arrays of length ≥2.)

If none exists, verify by editing your URL to a multi-card episode in the data, OR skip this step and note "no multi-card episode in data — single-card path verified only".

Expected for multi-card: spotlight shows multiple smaller cards side-by-side; sidebar shows "CARD 1 OF N" labels; chip clicks pulse the correct sidebar card by index.

- [ ] **Step 9: Verify reduced-motion**

In DevTools → Rendering tab, check "Emulate CSS media feature prefers-reduced-motion: reduce". Click an inline card chip.
Expected: scroll is instant (not smooth); no pulse animation (or instant set/unset).

- [ ] **Step 10: Verify Junior ↔ Full toggle**

Toggle between Junior and Full modes.
Expected: chips work in both. Card spotlight, Buy CTA, sidebar IDs unaffected.

- [ ] **Step 11: Verify text-size toggle**

Cycle through normal / large / xl.
Expected: chips scale with surrounding text (no awkward size mismatch).

- [ ] **Step 12: Stop the dev server**

Ctrl+C the dev server. No commit needed for this task — it's verification.

---

## Self-Review Notes

Spec coverage check (each spec section → which task implements it):

| Spec section | Implementing task |
|---|---|
| §1 Inline card chips | Tasks 1, 3, 4 |
| §2 Sidebar Buy CTA above-the-fold + no dead-ends | Task 5 |
| §3 Smarter "You Might Like" | Tasks 2, 5 |
| §4 End-of-episode card spotlight | Tasks 6, 7 |
| §5 Cards ↔ shop products connection | Tasks 2, 5, 6 |
| Helpers + tests | Tasks 1, 2 |
| `prefers-reduced-motion` | Tasks 3, 5, 8 (verify) |
| Sidebar card IDs (`sidebar-card-${ci}`) | Task 5 |
| Pulse animation | Task 5 |

Type consistency: `findShopProductForCard` is defined in Task 2 and used in Tasks 5 & 6 with same signature. `splitParagraph` defined in Task 1, consumed in Task 4 with same signature. `Segment` type matches across files.

No placeholders. Every step has actual code or commands.
