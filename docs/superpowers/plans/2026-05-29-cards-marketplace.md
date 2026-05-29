# `/cards` Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/cards` as the public catalog of ~500 personal Pokémon cards for direct sale via Messenger, plus `/admin/cards` for owner-side management including bulk CSV import.

**Architecture:** New `clients/pokemon-fables/cards-collection.json` is the source of truth; `scripts/build-data.js` reads it and emits a typed `CARDS` array into `src/lib/data.ts`. Pure helpers in `src/lib/cardsCollection.ts` drive filter/sort/group/search/episode-link logic with full vitest coverage. Public surface = grid + filter sidebar + desktop hover-overlay + mobile full-screen modal. Admin surface = list with quick actions + inline edit + CSV import/export. Buy CTA opens `m.me/cardfables` with a clipboard-prefilled message.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, vitest, pnpm. GitHub-as-storage via existing `src/lib/github.ts` helpers. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-29-cards-marketplace-design.md`

---

## File structure

| File | Status | Layer | Responsibility |
|---|---|---|---|
| `clients/pokemon-fables/cards-collection.json` | new | data | Source of truth for cards |
| `clients/pokemon-fables/config.json` | modify | data | Add `"currency": "USD"` field |
| `src/lib/types.ts` | modify | types | Add `CardCollectionEntry`, `PokemonType`, `CardCondition`, `CardStatus`, `CSVImportRow`, `CSVImportResult` interfaces |
| `scripts/build-data.js` | modify | build | Read `cards-collection.json`; emit `CARDS` + `CURRENCY` |
| `src/lib/data.ts` | modify (auto) | data | Auto-generated; will include `CARDS` |
| `src/lib/cardsCollection.ts` | new | helpers | Pure functions: filter, sort, group, search, slugify, episode-link, parse/validate CSV |
| `src/lib/cardsCollection.test.ts` | new | tests | vitest unit tests |
| `src/app/cards/page.tsx` | new | route | `/cards` route (server component) |
| `src/components/cards/CardCollectionGrid.tsx` | new | UI | Client component; filter/sort state; URL sync |
| `src/components/cards/CardCollectionItem.tsx` | new | UI | Thumbnail + status badges + click handler |
| `src/components/cards/CardCollectionFilters.tsx` | new | UI | Filter bar (sidebar / mobile drawer) |
| `src/components/cards/CardDetailOverlay.tsx` | new | UI | Enlarged view (desktop hover overlay + mobile modal in one component) |
| `src/components/layout/Navbar.tsx` | modify | nav | Add "Cards" link |
| `src/app/admin/cards/page.tsx` | new | admin | List + quick actions + edit + import UI |
| `src/app/admin/context.tsx` | modify | admin nav | Add "Cards" sidebar entry |
| `src/app/api/cards/route.ts` | new | API | GET list, POST create |
| `src/app/api/cards/[id]/route.ts` | new | API | PUT update, DELETE delete |
| `src/app/api/cards/import/route.ts` | new | API | POST bulk CSV import |
| `src/app/api/cards/export/route.ts` | new | API | GET CSV download |
| `src/app/api/cards/upload-image/route.ts` | new | API | POST single-card image upload |
| `src/app/sitemap.ts` | modify | SEO | Add `/cards` |
| `public/images/cards-collection/.gitkeep` | new | static | Reserve dir |

---

## Task 1: Data foundation (types + JSON + build script)

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `clients/pokemon-fables/config.json`
- Create: `clients/pokemon-fables/cards-collection.json`
- Modify: `scripts/build-data.js`
- Create: `public/images/cards-collection/.gitkeep`

- [ ] **Step 1: Add types to `src/lib/types.ts`**

Open `/Users/lm/repos/cardfables/src/lib/types.ts` and append at the end:

```ts
export type PokemonType =
  | "Fire" | "Water" | "Grass" | "Electric" | "Dark"
  | "Steel" | "Psychic" | "Fighting" | "Normal"
  | "Dragon" | "Fairy";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export type CardStatus = "available" | "sold" | "reserved" | "hidden";

export interface CardCollectionEntry {
  id: string;
  name: string;
  set: string;
  setNumber?: string;
  year: number;
  type: PokemonType;
  rarity: string;
  artist?: string;
  image: string;
  description?: string;
  price: number;
  originalPrice?: number;
  condition: CardCondition;
  stock?: number;
  status: CardStatus;
  addedAt?: string;
}

export interface CSVImportRow {
  rowNumber: number;
  entry?: CardCollectionEntry;
  errors: string[];
  warnings: string[];
  action: "create" | "update" | "skip";
}

export interface CSVImportResult {
  rows: CSVImportRow[];
  totalCreate: number;
  totalUpdate: number;
  totalErrors: number;
  totalWarnings: number;
}
```

- [ ] **Step 2: Add `currency` to client config**

Open `/Users/lm/repos/cardfables/clients/pokemon-fables/config.json`. Add the `currency` key inside the existing object. The file should now include the new line `"currency": "USD"` alongside other client fields.

(Exact placement: any top-level key works. Keep it grouped with other display-related fields.)

- [ ] **Step 3: Create the cards collection JSON with sample data**

Create `/Users/lm/repos/cardfables/clients/pokemon-fables/cards-collection.json`:
```json
[
  {
    "id": "charizard-v-sar-vstar-universe",
    "name": "Charizard V (SAR)",
    "set": "VSTAR Universe",
    "setNumber": "018/172",
    "year": 2022,
    "type": "Fire",
    "rarity": "SAR",
    "artist": "Oswaldo KATO",
    "image": "/images/cards-collection/charizard-v-sar.jpg",
    "description": "Special Art Rare Charizard from the Japanese VSTAR Universe set. Featured in Episode 1 of Flames of Our Lives.",
    "price": 30,
    "originalPrice": 45,
    "condition": "NM",
    "stock": 1,
    "status": "available",
    "addedAt": "2026-05-29"
  },
  {
    "id": "venusaur-ex-scarlet-violet",
    "name": "Venusaur ex",
    "set": "Scarlet & Violet 151",
    "year": 2023,
    "type": "Grass",
    "rarity": "Holo",
    "image": "",
    "price": 18,
    "condition": "LP",
    "stock": 1,
    "status": "available",
    "addedAt": "2026-05-29"
  },
  {
    "id": "mismagius-ex-shrouded-fable",
    "name": "Mismagius ex",
    "set": "Shrouded Fable",
    "year": 2024,
    "type": "Psychic",
    "rarity": "Full Art",
    "image": "",
    "price": 22,
    "condition": "NM",
    "stock": 2,
    "status": "available",
    "addedAt": "2026-05-29"
  }
]
```

- [ ] **Step 4: Create the public image directory**

Run from `/Users/lm/repos/cardfables`:
```bash
mkdir -p public/images/cards-collection
touch public/images/cards-collection/.gitkeep
```

- [ ] **Step 5: Extend `scripts/build-data.js` to read the collection**

Open `/Users/lm/repos/cardfables/scripts/build-data.js`. After the `shop` constant (around line 31), add the `cards-collection` and `config` reads:

```js
// Read cards collection
const cardsCollectionPath = join(clientDir, "cards-collection.json");
const cardsCollection = existsSync(cardsCollectionPath)
  ? JSON.parse(readFileSync(cardsCollectionPath, "utf-8"))
  : [];

// Read client config (for currency)
const config = JSON.parse(
  readFileSync(join(clientDir, "config.json"), "utf-8")
);
const currency = config.currency || "USD";
```

- [ ] **Step 6: Update the output template in build-data.js**

In the same file, find the `output` template literal (starts with `// AUTO-GENERATED`). Replace the entire template literal with:

```js
const output = `// AUTO-GENERATED by scripts/build-data.js — do not edit manually.
// Source: clients/${CLIENT}/series.json + series/*/episodes/*.json + shop.json + cards-collection.json

import type { Series, ShopProduct, CardCollectionEntry } from "./types";

export const SERIES: Series[] = ${JSON.stringify(seriesWithEpisodes, null, 2)};

export const SHOP: ShopProduct[] = ${JSON.stringify(shop.products, null, 2)};

export const SHOP_CATEGORIES = ${JSON.stringify(shop.categories)} as const;
export const BROWSE_TYPES = ${JSON.stringify(shop.browseTypes)} as const;

export const CARDS: CardCollectionEntry[] = ${JSON.stringify(cardsCollection, null, 2)};

export const CURRENCY = ${JSON.stringify(currency)};

export function getSeriesBySlug(slug: string): Series | undefined {
  return SERIES.find((s) => s.id === slug);
}

export function getEpisodeBySlugs(
  seriesSlug: string,
  episodeSlug: string
): { series: Series; episode: (typeof SERIES)[0]["episodes"][0] } | undefined {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) return undefined;
  const episode = series.episodes.find((e) => e.slug === episodeSlug);
  if (!episode) return undefined;
  return { series, episode };
}

export function getAllEpisodePaths(): {
  seriesSlug: string;
  episodeSlug: string;
}[] {
  const paths: { seriesSlug: string; episodeSlug: string }[] = [];
  for (const series of SERIES) {
    for (const ep of series.episodes) {
      if (ep.status === "live") {
        paths.push({ seriesSlug: series.id, episodeSlug: ep.slug });
      }
    }
  }
  return paths;
}
`;
```

- [ ] **Step 7: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
node scripts/build-data.js
pnpm tsc --noEmit
pnpm build
```
Expected: build script logs include card count; tsc 0 errors; build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/lib/types.ts \
        src/lib/data.ts \
        clients/pokemon-fables/config.json \
        clients/pokemon-fables/cards-collection.json \
        scripts/build-data.js \
        public/images/cards-collection/.gitkeep
git commit -m "feat(cards): data foundation — types, JSON, build script"
```

---

## Task 2: `cardsCollection.ts` helpers + tests (TDD)

**Files:**
- Create: `src/lib/cardsCollection.test.ts`
- Create: `src/lib/cardsCollection.ts`

Pure functions, no DOM, no React. Full unit coverage.

- [ ] **Step 1: Write the failing tests**

Create `/Users/lm/repos/cardfables/src/lib/cardsCollection.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  filterCards,
  sortCards,
  groupCards,
  searchCards,
  slugifyCardId,
  findEpisodeForCard,
  parseCSV,
  validateCSVRows,
} from "./cardsCollection";
import type { CardCollectionEntry, Series } from "./types";

const baseCard: CardCollectionEntry = {
  id: "charizard-v-sar-vstar-universe",
  name: "Charizard V (SAR)",
  set: "VSTAR Universe",
  year: 2022,
  type: "Fire",
  rarity: "SAR",
  image: "/images/cards-collection/charizard-v-sar.jpg",
  price: 30,
  originalPrice: 45,
  condition: "NM",
  stock: 1,
  status: "available",
};

const venusaur: CardCollectionEntry = {
  id: "venusaur-ex-svp",
  name: "Venusaur ex",
  set: "Scarlet & Violet 151",
  year: 2023,
  type: "Grass",
  rarity: "Holo",
  image: "",
  price: 18,
  condition: "LP",
  status: "available",
};

const mismagius: CardCollectionEntry = {
  id: "mismagius-ex-sf",
  name: "Mismagius ex",
  set: "Shrouded Fable",
  year: 2024,
  type: "Psychic",
  rarity: "Full Art",
  image: "",
  price: 22,
  condition: "NM",
  stock: 2,
  status: "sold",
};

const cards = [baseCard, venusaur, mismagius];

describe("filterCards", () => {
  it("returns all when no filters set", () => {
    expect(filterCards(cards, {})).toEqual(cards);
  });

  it("filters by type (single)", () => {
    expect(filterCards(cards, { types: ["Fire"] })).toEqual([baseCard]);
  });

  it("filters by type (multi, OR within group)", () => {
    expect(filterCards(cards, { types: ["Fire", "Grass"] })).toEqual([
      baseCard,
      venusaur,
    ]);
  });

  it("filters by set", () => {
    expect(filterCards(cards, { sets: ["VSTAR Universe"] })).toEqual([baseCard]);
  });

  it("filters by year", () => {
    expect(filterCards(cards, { years: [2023] })).toEqual([venusaur]);
  });

  it("filters by condition", () => {
    expect(filterCards(cards, { conditions: ["LP"] })).toEqual([venusaur]);
  });

  it("filters by rarity", () => {
    expect(filterCards(cards, { rarities: ["Full Art"] })).toEqual([mismagius]);
  });

  it("filters by status (default available only)", () => {
    expect(filterCards(cards, { status: "available-only" })).toEqual([
      baseCard,
      venusaur,
    ]);
  });

  it("filters by status (include sold)", () => {
    expect(filterCards(cards, { status: "include-sold" })).toEqual(cards);
  });

  it("hidden status never included", () => {
    const hiddenCard = { ...baseCard, id: "hidden-1", status: "hidden" as const };
    expect(
      filterCards([...cards, hiddenCard], { status: "include-sold" })
    ).toEqual(cards);
  });

  it("combines filters with AND across groups", () => {
    expect(
      filterCards(cards, { types: ["Fire", "Grass"], years: [2022] })
    ).toEqual([baseCard]);
  });
});

describe("searchCards", () => {
  it("matches name", () => {
    expect(searchCards(cards, "charizard")).toEqual([baseCard]);
  });

  it("is case-insensitive", () => {
    expect(searchCards(cards, "MISMAGIUS")).toEqual([mismagius]);
  });

  it("matches set name", () => {
    expect(searchCards(cards, "vstar")).toEqual([baseCard]);
  });

  it("returns all on empty query", () => {
    expect(searchCards(cards, "")).toEqual(cards);
    expect(searchCards(cards, "   ")).toEqual(cards);
  });

  it("returns empty when no match", () => {
    expect(searchCards(cards, "pikachu")).toEqual([]);
  });
});

describe("sortCards", () => {
  it("sorts by price ascending", () => {
    const sorted = sortCards(cards, "price-asc");
    expect(sorted.map((c) => c.id)).toEqual([
      "venusaur-ex-svp",
      "mismagius-ex-sf",
      "charizard-v-sar-vstar-universe",
    ]);
  });

  it("sorts by price descending", () => {
    const sorted = sortCards(cards, "price-desc");
    expect(sorted.map((c) => c.id)).toEqual([
      "charizard-v-sar-vstar-universe",
      "mismagius-ex-sf",
      "venusaur-ex-svp",
    ]);
  });

  it("sorts by recently-added when addedAt present", () => {
    const cardsWithDates = [
      { ...baseCard, addedAt: "2026-05-01" },
      { ...venusaur, addedAt: "2026-05-15" },
      { ...mismagius, addedAt: "2026-05-29" },
    ];
    const sorted = sortCards(cardsWithDates, "recently-added");
    expect(sorted[0].id).toBe("mismagius-ex-sf");
    expect(sorted[2].id).toBe("charizard-v-sar-vstar-universe");
  });

  it("rarity sort puts SAR > Full Art > Holo > Common", () => {
    const sorted = sortCards(cards, "rarity-desc");
    expect(sorted[0].rarity).toBe("SAR");
    expect(sorted[1].rarity).toBe("Full Art");
    expect(sorted[2].rarity).toBe("Holo");
  });

  it("does not mutate input", () => {
    const before = [...cards];
    sortCards(cards, "price-desc");
    expect(cards).toEqual(before);
  });
});

describe("groupCards", () => {
  it("returns single group when grouping is 'none'", () => {
    const groups = groupCards(cards, "none");
    expect(groups).toEqual([{ key: "", label: "", cards }]);
  });

  it("groups by year (desc)", () => {
    const groups = groupCards(cards, "by-year");
    expect(groups.map((g) => g.key)).toEqual(["2024", "2023", "2022"]);
    expect(groups[0].cards).toEqual([mismagius]);
  });

  it("groups by set (alphabetical)", () => {
    const groups = groupCards(cards, "by-set");
    expect(groups.map((g) => g.key)).toEqual([
      "Scarlet & Violet 151",
      "Shrouded Fable",
      "VSTAR Universe",
    ]);
  });
});

describe("slugifyCardId", () => {
  it("creates slug from name and set", () => {
    expect(slugifyCardId("Charizard V (SAR)", "VSTAR Universe")).toBe(
      "charizard-v-sar-vstar-universe"
    );
  });

  it("handles unicode and special chars", () => {
    expect(slugifyCardId("Pokémon: 151", "Set & Match")).toBe(
      "pokemon-151-set-match"
    );
  });

  it("collapses repeated dashes", () => {
    expect(slugifyCardId("--Foo--", "--Bar--")).toBe("foo-bar");
  });
});

describe("findEpisodeForCard", () => {
  const sampleSeries: Series[] = [
    {
      id: "flames-of-our-lives",
      title: "Flames of Our Lives",
      tagline: "",
      genre: "",
      type: "Fire",
      color: "#E8651A",
      accent: "",
      bg: "",
      desc: "",
      status: "Airing",
      epCount: 1,
      episodes: [
        {
          id: 1,
          slug: "the-nap-that-changed-everything",
          title: "The Nap That Changed Everything",
          cards: [
            { name: "Charizard V (SAR)", set: "VSTAR Universe", artist: "x", emoji: "🔥" },
          ],
          status: "live",
        },
      ],
    },
  ];

  it("finds episode for exact-name match", () => {
    const found = findEpisodeForCard(sampleSeries, baseCard);
    expect(found?.episode.slug).toBe("the-nap-that-changed-everything");
    expect(found?.series.id).toBe("flames-of-our-lives");
  });

  it("returns undefined when no match", () => {
    const found = findEpisodeForCard(sampleSeries, venusaur);
    expect(found).toBeUndefined();
  });
});

describe("parseCSV", () => {
  it("parses a simple CSV with header row", () => {
    const csv =
      "name,price,condition\nCharizard V (SAR),30,NM\nVenusaur ex,18,LP";
    const rows = parseCSV(csv);
    expect(rows).toEqual([
      { name: "Charizard V (SAR)", price: "30", condition: "NM" },
      { name: "Venusaur ex", price: "18", condition: "LP" },
    ]);
  });

  it("handles quoted values with commas", () => {
    const csv = 'name,description\nCharizard,"Burns, breathes fire"';
    const rows = parseCSV(csv);
    expect(rows[0].description).toBe("Burns, breathes fire");
  });

  it("trims whitespace from cell values", () => {
    const csv = "name,price\n  Charizard  ,  30  ";
    const rows = parseCSV(csv);
    expect(rows[0].name).toBe("Charizard");
    expect(rows[0].price).toBe("30");
  });

  it("handles empty lines and trailing newline", () => {
    const csv = "name,price\nCharizard,30\n\n";
    const rows = parseCSV(csv);
    expect(rows.length).toBe(1);
  });
});

describe("validateCSVRows", () => {
  it("flags missing required fields", () => {
    const result = validateCSVRows(
      [{ price: "30", condition: "NM" }],
      []
    );
    expect(result.rows[0].errors).toContain('missing required field "name"');
    expect(result.totalErrors).toBe(1);
  });

  it("flags invalid enum values", () => {
    const result = validateCSVRows(
      [{ name: "Foo", price: "30", condition: "Excellent" }],
      []
    );
    expect(result.rows[0].errors.some((e) => e.includes("condition"))).toBe(true);
  });

  it("auto-fills id and addedAt", () => {
    const result = validateCSVRows(
      [
        {
          name: "Charizard V",
          set: "VSTAR Universe",
          year: "2022",
          type: "Fire",
          rarity: "SAR",
          price: "30",
          condition: "NM",
        },
      ],
      []
    );
    expect(result.rows[0].entry?.id).toBe("charizard-v-vstar-universe");
    expect(result.rows[0].entry?.addedAt).toBeTruthy();
    expect(result.rows[0].errors.length).toBe(0);
  });

  it("warns on empty image but does not error", () => {
    const result = validateCSVRows(
      [
        {
          name: "Charizard V",
          set: "VSTAR Universe",
          year: "2022",
          type: "Fire",
          rarity: "SAR",
          price: "30",
          condition: "NM",
        },
      ],
      []
    );
    expect(result.rows[0].warnings.some((w) => w.includes("image"))).toBe(true);
    expect(result.rows[0].errors.length).toBe(0);
  });

  it("marks existing id as update", () => {
    const existing: CardCollectionEntry[] = [baseCard];
    const result = validateCSVRows(
      [
        {
          id: baseCard.id,
          name: baseCard.name,
          set: baseCard.set,
          year: String(baseCard.year),
          type: baseCard.type,
          rarity: baseCard.rarity,
          price: "35",
          condition: baseCard.condition,
        },
      ],
      existing
    );
    expect(result.rows[0].action).toBe("update");
    expect(result.totalUpdate).toBe(1);
  });

  it("marks new id as create", () => {
    const result = validateCSVRows(
      [
        {
          name: "Pikachu",
          set: "Base",
          year: "1999",
          type: "Electric",
          rarity: "Common",
          price: "5",
          condition: "NM",
        },
      ],
      [baseCard]
    );
    expect(result.rows[0].action).toBe("create");
    expect(result.totalCreate).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/lib/cardsCollection.test.ts`
Expected: All tests fail with "Cannot find module './cardsCollection'".

- [ ] **Step 3: Implement `cardsCollection.ts`**

Create `/Users/lm/repos/cardfables/src/lib/cardsCollection.ts`:

```ts
import type {
  CardCollectionEntry,
  CardCondition,
  CardStatus,
  CSVImportResult,
  CSVImportRow,
  PokemonType,
  Series,
  CardInfo,
} from "./types";

const POKEMON_TYPES: PokemonType[] = [
  "Fire", "Water", "Grass", "Electric", "Dark",
  "Steel", "Psychic", "Fighting", "Normal", "Dragon", "Fairy",
];

const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

const STATUSES: CardStatus[] = ["available", "sold", "reserved", "hidden"];

// Higher = rarer
const RARITY_ORDER: Record<string, number> = {
  Common: 0,
  Uncommon: 1,
  Rare: 2,
  Holo: 3,
  Promo: 4,
  "Full Art": 5,
  SAR: 6,
};

export interface CardFilters {
  types?: PokemonType[];
  sets?: string[];
  years?: number[];
  conditions?: CardCondition[];
  rarities?: string[];
  status?: "available-only" | "include-sold";
}

export function filterCards(
  cards: CardCollectionEntry[],
  filters: CardFilters
): CardCollectionEntry[] {
  return cards.filter((c) => {
    // Hidden never shown publicly
    if (c.status === "hidden") return false;

    // Status filter
    const statusFilter = filters.status ?? "available-only";
    if (statusFilter === "available-only" && c.status === "sold") return false;

    if (filters.types && filters.types.length > 0 && !filters.types.includes(c.type)) {
      return false;
    }
    if (filters.sets && filters.sets.length > 0 && !filters.sets.includes(c.set)) {
      return false;
    }
    if (filters.years && filters.years.length > 0 && !filters.years.includes(c.year)) {
      return false;
    }
    if (filters.conditions && filters.conditions.length > 0 && !filters.conditions.includes(c.condition)) {
      return false;
    }
    if (filters.rarities && filters.rarities.length > 0 && !filters.rarities.includes(c.rarity)) {
      return false;
    }
    return true;
  });
}

export function searchCards(
  cards: CardCollectionEntry[],
  query: string
): CardCollectionEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;
  return cards.filter((c) => {
    const haystack = `${c.name} ${c.set} ${c.artist ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export type CardSort = "recently-added" | "price-asc" | "price-desc" | "rarity-desc";

export function sortCards(
  cards: CardCollectionEntry[],
  sort: CardSort
): CardCollectionEntry[] {
  const copy = [...cards];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
    case "recently-added":
      return copy.sort((a, b) => {
        const ad = a.addedAt ?? "";
        const bd = b.addedAt ?? "";
        if (ad === bd) return a.id.localeCompare(b.id);
        return bd.localeCompare(ad);
      });
    case "rarity-desc":
      return copy.sort((a, b) => {
        const ra = RARITY_ORDER[a.rarity] ?? 0;
        const rb = RARITY_ORDER[b.rarity] ?? 0;
        if (ra === rb) return a.id.localeCompare(b.id);
        return rb - ra;
      });
  }
}

export type CardGrouping = "none" | "by-year" | "by-set";

export interface CardGroup {
  key: string;
  label: string;
  cards: CardCollectionEntry[];
}

export function groupCards(
  cards: CardCollectionEntry[],
  grouping: CardGrouping
): CardGroup[] {
  if (grouping === "none") {
    return [{ key: "", label: "", cards }];
  }
  const byKey = new Map<string, CardCollectionEntry[]>();
  for (const c of cards) {
    const key = grouping === "by-year" ? String(c.year) : c.set;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(c);
  }
  const keys = [...byKey.keys()];
  if (grouping === "by-year") {
    keys.sort((a, b) => Number(b) - Number(a));
  } else {
    keys.sort();
  }
  return keys.map((k) => ({
    key: k,
    label: k,
    cards: byKey.get(k)!,
  }));
}

export function slugifyCardId(name: string, set: string): string {
  const base = `${name}-${set}`;
  return base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function findEpisodeForCard(
  series: Series[],
  card: CardCollectionEntry
): { series: Series; episode: Series["episodes"][0] } | undefined {
  for (const s of series) {
    for (const ep of s.episodes) {
      if (ep.status !== "live") continue;
      const match = ep.cards.find((c: CardInfo) => c.name === card.name);
      if (match) return { series: s, episode: ep };
    }
  }
  return undefined;
}

// --- CSV parsing & validation ---

export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });
}

function parseCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function validateCSVRows(
  rows: Record<string, string>[],
  existing: CardCollectionEntry[]
): CSVImportResult {
  const existingIds = new Set(existing.map((c) => c.id));
  const today = new Date().toISOString().slice(0, 10);

  const result: CSVImportResult = {
    rows: [],
    totalCreate: 0,
    totalUpdate: 0,
    totalErrors: 0,
    totalWarnings: 0,
  };

  rows.forEach((raw, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rowNumber = idx + 2; // +2 because: 1-indexed + header row

    // Required: name, price, condition
    if (!raw.name) errors.push('missing required field "name"');
    if (!raw.price) errors.push('missing required field "price"');
    if (!raw.condition) errors.push('missing required field "condition"');

    // Validate enums
    if (raw.condition && !CONDITIONS.includes(raw.condition as CardCondition)) {
      errors.push(`invalid condition "${raw.condition}" (must be ${CONDITIONS.join("/")})`);
    }
    if (raw.type && !POKEMON_TYPES.includes(raw.type as PokemonType)) {
      errors.push(`invalid type "${raw.type}"`);
    }
    if (raw.status && !STATUSES.includes(raw.status as CardStatus)) {
      errors.push(`invalid status "${raw.status}"`);
    }

    // Numeric validation
    const priceNum = raw.price ? Number(raw.price) : NaN;
    if (raw.price && Number.isNaN(priceNum)) {
      errors.push(`price "${raw.price}" is not a number`);
    }
    if (raw.originalPrice && Number.isNaN(Number(raw.originalPrice))) {
      errors.push(`originalPrice "${raw.originalPrice}" is not a number`);
    }
    const yearNum = raw.year ? Number(raw.year) : NaN;
    if (raw.year && Number.isNaN(yearNum)) {
      errors.push(`year "${raw.year}" is not a number`);
    }
    const stockNum = raw.stock ? Number(raw.stock) : undefined;
    if (raw.stock && Number.isNaN(Number(raw.stock))) {
      errors.push(`stock "${raw.stock}" is not a number`);
    }

    // Warnings
    if (!raw.image) warnings.push("no image — will show emoji fallback");
    if (raw.price === "0") warnings.push("price is 0");

    let entry: CardCollectionEntry | undefined;
    let action: "create" | "update" | "skip" = "skip";

    if (errors.length === 0) {
      const id = raw.id || slugifyCardId(raw.name, raw.set || "");
      entry = {
        id,
        name: raw.name,
        set: raw.set || "",
        setNumber: raw.setNumber || undefined,
        year: yearNum || new Date().getFullYear(),
        type: (raw.type as PokemonType) || "Normal",
        rarity: raw.rarity || "Common",
        artist: raw.artist || undefined,
        image: raw.image || "",
        description: raw.description || undefined,
        price: priceNum,
        originalPrice: raw.originalPrice ? Number(raw.originalPrice) : undefined,
        condition: raw.condition as CardCondition,
        stock: stockNum,
        status: (raw.status as CardStatus) || "available",
        addedAt: raw.addedAt || today,
      };
      action = existingIds.has(id) ? "update" : "create";
      if (action === "create") result.totalCreate++;
      else result.totalUpdate++;
    } else {
      result.totalErrors += errors.length;
    }

    result.totalWarnings += warnings.length;

    const csvRow: CSVImportRow = {
      rowNumber,
      entry,
      errors,
      warnings,
      action,
    };
    result.rows.push(csvRow);
  });

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test src/lib/cardsCollection.test.ts`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cardsCollection.ts src/lib/cardsCollection.test.ts
git commit -m "feat(cards): add cardsCollection helpers (filter/sort/group/search/CSV) + tests"
```

---

## Task 3: `/cards` page MVP (no filters)

**Files:**
- Create: `src/app/cards/page.tsx`
- Create: `src/components/cards/CardCollectionItem.tsx`

Render a basic grid with status badges. Filters/sort/overlay come in later tasks.

- [ ] **Step 1: Create the thumbnail component**

Create `/Users/lm/repos/cardfables/src/components/cards/CardCollectionItem.tsx`:

```tsx
"use client";

import type { CardCollectionEntry } from "@/lib/types";
import { CURRENCY } from "@/lib/data";

interface CardCollectionItemProps {
  card: CardCollectionEntry;
  onClick: (card: CardCollectionEntry) => void;
  episodeBadge?: { href: string };
}

function formatPrice(n: number): string {
  if (CURRENCY === "USD") return `$${n}`;
  if (CURRENCY === "JPY") return `¥${n.toLocaleString()}`;
  return `${CURRENCY} ${n}`;
}

const RARITY_COLORS: Record<string, string> = {
  SAR: "#D4893A",
  "Full Art": "#9B7AC4",
  Holo: "#8FA8B8",
  Promo: "#22C55E",
  Rare: "#5B9BD5",
};

export function CardCollectionItem({ card, onClick, episodeBadge }: CardCollectionItemProps) {
  const isSold = card.status === "sold";
  const isReserved = card.status === "reserved";
  const showStockBadge = (card.stock ?? 1) > 1;
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#7A6E5E";

  return (
    <button
      type="button"
      onClick={() => onClick(card)}
      className="hover-lift group relative block w-full overflow-hidden rounded-2xl border border-border bg-surface text-left p-0"
      aria-label={`View details for ${card.name}`}
      style={{ opacity: isSold ? 0.55 : 1, cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden bg-surface-light">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {card.type === "Fire" ? "🔥" :
             card.type === "Water" ? "💧" :
             card.type === "Grass" ? "🌿" :
             card.type === "Electric" ? "⚡" :
             card.type === "Dark" ? "👻" :
             card.type === "Steel" ? "🛡️" :
             card.type === "Psychic" ? "🔮" :
             card.type === "Dragon" ? "🐉" :
             "🎴"}
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isSold && (
            <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              SOLD
            </span>
          )}
          {isReserved && (
            <span className="rounded-md bg-yellow-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white">
              RESERVED
            </span>
          )}
          {showStockBadge && !isSold && (
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
              {card.stock} AVAILABLE
            </span>
          )}
          {episodeBadge && (
            <span className="rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold text-white">
              📖 STORY
            </span>
          )}
        </div>

        {/* Rarity tag */}
        <div
          className="absolute top-2 right-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ background: rarityColor }}
        >
          {card.rarity}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate text-sm font-bold text-text-primary">{card.name}</h3>
        <p className="truncate text-xs text-text-secondary">
          {card.set} · {card.year}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          {card.originalPrice && card.originalPrice > card.price && (
            <span className="text-xs text-text-dim line-through">
              {formatPrice(card.originalPrice)}
            </span>
          )}
          <span className="text-base font-bold text-gold">
            {formatPrice(card.price)}
          </span>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Create the page**

Create `/Users/lm/repos/cardfables/src/app/cards/page.tsx`:

```tsx
import { CARDS, SERIES } from "@/lib/data";
import { CardCollectionGrid } from "@/components/cards/CardCollectionGrid";

export const metadata = {
  title: "Cards for Sale",
  description: "Browse and shop our Pokémon card collection. Message us to buy direct.",
};

export default function CardsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
          All Cards
        </h1>
        <p className="text-sm text-text-secondary">
          Browse the full collection. Click any card for details. Tap "Message me to buy" to start a chat.
        </p>
      </header>
      <CardCollectionGrid cards={CARDS} series={SERIES} />
    </div>
  );
}
```

- [ ] **Step 3: Create a minimal `CardCollectionGrid` placeholder**

Create `/Users/lm/repos/cardfables/src/components/cards/CardCollectionGrid.tsx`:

```tsx
"use client";

import { useState, useMemo } from "react";
import { CardCollectionItem } from "./CardCollectionItem";
import { findEpisodeForCard } from "@/lib/cardsCollection";
import type { CardCollectionEntry, Series } from "@/lib/types";

interface CardCollectionGridProps {
  cards: CardCollectionEntry[];
  series: Series[];
}

export function CardCollectionGrid({ cards, series }: CardCollectionGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);

  const visibleCards = useMemo(
    () => cards.filter((c) => c.status !== "hidden"),
    [cards]
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleCards.map((card) => {
          const ep = findEpisodeForCard(series, card);
          return (
            <CardCollectionItem
              key={card.id}
              card={card}
              onClick={setSelectedCard}
              episodeBadge={ep ? { href: `/series/${ep.series.id}/${ep.episode.slug}` } : undefined}
            />
          );
        })}
      </div>
      {/* Detail overlay added in Task 6 */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div className="rounded-2xl bg-bg p-6 text-text-primary">
            Detail view for {selectedCard.name} — coming in Task 6
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 type errors, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/cards/page.tsx \
        src/components/cards/CardCollectionItem.tsx \
        src/components/cards/CardCollectionGrid.tsx
git commit -m "feat(cards): /cards page MVP — grid of all cards"
```

---

## Task 4: Filter bar + sort + group + URL state sync

**Files:**
- Create: `src/components/cards/CardCollectionFilters.tsx`
- Modify: `src/components/cards/CardCollectionGrid.tsx`

- [ ] **Step 1: Create the filter bar**

Create `/Users/lm/repos/cardfables/src/components/cards/CardCollectionFilters.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { CardCondition, PokemonType } from "@/lib/types";
import type { CardFilters, CardSort, CardGrouping } from "@/lib/cardsCollection";

const TYPES: PokemonType[] = ["Fire", "Water", "Grass", "Electric", "Dark", "Steel", "Psychic", "Fighting", "Normal", "Dragon", "Fairy"];
const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];

interface FilterBarProps {
  filters: CardFilters;
  search: string;
  sort: CardSort;
  grouping: CardGrouping;
  availableSets: string[];
  availableYears: number[];
  availableRarities: string[];
  onFiltersChange: (f: CardFilters) => void;
  onSearchChange: (q: string) => void;
  onSortChange: (s: CardSort) => void;
  onGroupingChange: (g: CardGrouping) => void;
  onClearAll: () => void;
}

function toggleArrayValue<T>(arr: T[] | undefined, value: T): T[] {
  const set = new Set(arr ?? []);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return [...set];
}

function ChipGroup<T extends string | number>(props: {
  label: string;
  options: T[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
        {props.label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {props.options.map((opt) => {
          const active = props.selected.includes(opt);
          return (
            <button
              key={String(opt)}
              type="button"
              onClick={() => props.onChange(toggleArrayValue(props.selected, opt))}
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors"
              style={{
                background: active ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
                borderColor: active ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
                color: active ? "#D4893A" : "var(--color-text-secondary)",
              }}
            >
              {String(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CardCollectionFilters(props: FilterBarProps) {
  const [open, setOpen] = useState(false);

  const filterContent = (
    <div className="p-4">
      <div className="mb-3">
        <input
          type="search"
          value={props.search}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder="Search name, set, artist…"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
        />
      </div>
      <ChipGroup
        label="Type"
        options={TYPES}
        selected={props.filters.types ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, types: next })}
      />
      <ChipGroup
        label="Set"
        options={props.availableSets}
        selected={props.filters.sets ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, sets: next })}
      />
      <ChipGroup
        label="Year"
        options={props.availableYears}
        selected={props.filters.years ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, years: next })}
      />
      <ChipGroup
        label="Condition"
        options={CONDITIONS}
        selected={props.filters.conditions ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, conditions: next })}
      />
      <ChipGroup
        label="Rarity"
        options={props.availableRarities}
        selected={props.filters.rarities ?? []}
        onChange={(next) => props.onFiltersChange({ ...props.filters, rarities: next })}
      />
      <div className="mb-3">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
          Status
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => props.onFiltersChange({ ...props.filters, status: "available-only" })}
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: (props.filters.status ?? "available-only") === "available-only" ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
              borderColor: (props.filters.status ?? "available-only") === "available-only" ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
              color: (props.filters.status ?? "available-only") === "available-only" ? "#D4893A" : "var(--color-text-secondary)",
            }}
          >
            Available
          </button>
          <button
            type="button"
            onClick={() => props.onFiltersChange({ ...props.filters, status: "include-sold" })}
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
            style={{
              background: props.filters.status === "include-sold" ? "rgba(212,137,58,0.15)" : "rgba(74,64,53,0.04)",
              borderColor: props.filters.status === "include-sold" ? "rgba(212,137,58,0.4)" : "rgba(74,64,53,0.10)",
              color: props.filters.status === "include-sold" ? "#D4893A" : "var(--color-text-secondary)",
            }}
          >
            Include Sold
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={props.onClearAll}
        className="mt-2 text-xs font-medium text-text-secondary underline hover:text-text-primary"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="sticky top-24 rounded-2xl border border-border bg-surface">
          {filterContent}
        </div>
      </aside>

      {/* Mobile drawer trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden mb-4 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary"
      >
        Filters & Sort
      </button>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-bg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-bg px-4 py-3">
              <h2 className="font-bold text-text-primary">Filters</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-text-secondary"
                aria-label="Close filters"
              >
                ✕
              </button>
            </div>
            {filterContent}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Update `CardCollectionGrid` to use filters/sort/group + URL sync**

Replace `/Users/lm/repos/cardfables/src/components/cards/CardCollectionGrid.tsx` with:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CardCollectionItem } from "./CardCollectionItem";
import { CardCollectionFilters } from "./CardCollectionFilters";
import {
  filterCards,
  searchCards,
  sortCards,
  groupCards,
  findEpisodeForCard,
  type CardFilters,
  type CardSort,
  type CardGrouping,
} from "@/lib/cardsCollection";
import type { CardCollectionEntry, Series, PokemonType, CardCondition } from "@/lib/types";

interface CardCollectionGridProps {
  cards: CardCollectionEntry[];
  series: Series[];
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function parseNumberList(value: string | null): number[] {
  return parseList(value).map(Number).filter((n) => !Number.isNaN(n));
}

export function CardCollectionGrid({ cards, series }: CardCollectionGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);

  // Parse state from URL
  const filters: CardFilters = useMemo(
    () => ({
      types: parseList(searchParams.get("type")) as PokemonType[],
      sets: parseList(searchParams.get("set")),
      years: parseNumberList(searchParams.get("year")),
      conditions: parseList(searchParams.get("cond")) as CardCondition[],
      rarities: parseList(searchParams.get("rarity")),
      status: searchParams.get("status") === "include-sold" ? "include-sold" : "available-only",
    }),
    [searchParams]
  );
  const search = searchParams.get("q") ?? "";
  const sort = (searchParams.get("sort") as CardSort) ?? "recently-added";
  const grouping = (searchParams.get("group") as CardGrouping) ?? "none";

  const updateUrl = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);
      const qs = params.toString();
      router.replace(qs ? `/cards?${qs}` : "/cards", { scroll: false });
    },
    [router, searchParams]
  );

  const onFiltersChange = (next: CardFilters) => {
    updateUrl((params) => {
      const setOrDel = (key: string, val: string) => {
        if (val) params.set(key, val);
        else params.delete(key);
      };
      setOrDel("type", (next.types ?? []).join(","));
      setOrDel("set", (next.sets ?? []).join(","));
      setOrDel("year", (next.years ?? []).join(","));
      setOrDel("cond", (next.conditions ?? []).join(","));
      setOrDel("rarity", (next.rarities ?? []).join(","));
      if (next.status === "include-sold") params.set("status", "include-sold");
      else params.delete("status");
    });
  };
  const onSearchChange = (q: string) =>
    updateUrl((p) => (q ? p.set("q", q) : p.delete("q")));
  const onSortChange = (s: CardSort) =>
    updateUrl((p) => (s === "recently-added" ? p.delete("sort") : p.set("sort", s)));
  const onGroupingChange = (g: CardGrouping) =>
    updateUrl((p) => (g === "none" ? p.delete("group") : p.set("group", g)));
  const onClearAll = () => router.replace("/cards", { scroll: false });

  // Compute available filter options from data
  const availableSets = useMemo(
    () => [...new Set(cards.map((c) => c.set))].filter(Boolean).sort(),
    [cards]
  );
  const availableYears = useMemo(
    () => [...new Set(cards.map((c) => c.year))].sort((a, b) => b - a),
    [cards]
  );
  const availableRarities = useMemo(
    () => [...new Set(cards.map((c) => c.rarity))].filter(Boolean).sort(),
    [cards]
  );

  // Apply pipeline: filter → search → sort → group
  const groups = useMemo(() => {
    const filtered = filterCards(cards, filters);
    const searched = searchCards(filtered, search);
    const sorted = sortCards(searched, sort);
    return groupCards(sorted, grouping);
  }, [cards, filters, search, sort, grouping]);

  const totalVisible = groups.reduce((sum, g) => sum + g.cards.length, 0);
  const soldCount = cards.filter((c) => c.status === "sold").length;
  const availableCount = cards.filter((c) => c.status === "available").length;

  return (
    <div className="flex gap-6">
      <CardCollectionFilters
        filters={filters}
        search={search}
        sort={sort}
        grouping={grouping}
        availableSets={availableSets}
        availableYears={availableYears}
        availableRarities={availableRarities}
        onFiltersChange={onFiltersChange}
        onSearchChange={onSearchChange}
        onSortChange={onSortChange}
        onGroupingChange={onGroupingChange}
        onClearAll={onClearAll}
      />
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            {totalVisible} of {availableCount} available
            {soldCount > 0 && <> · {soldCount} sold</>}
          </p>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as CardSort)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
              aria-label="Sort cards"
            >
              <option value="recently-added">Recently added</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="rarity-desc">Rarity: rare first</option>
            </select>
            <select
              value={grouping}
              onChange={(e) => onGroupingChange(e.target.value as CardGrouping)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text-primary"
              aria-label="Group cards"
            >
              <option value="none">No grouping</option>
              <option value="by-year">Group by year</option>
              <option value="by-set">Group by set</option>
            </select>
          </div>
        </div>

        {groups.map((group) => (
          <section key={group.key || "all"} className="mb-8">
            {group.key && (
              <h2 className="mb-4 font-heading text-xl font-bold text-text-primary">
                {group.label} <span className="text-sm font-normal text-text-dim">({group.cards.length} cards)</span>
              </h2>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {group.cards.map((card) => {
                const ep = findEpisodeForCard(series, card);
                return (
                  <CardCollectionItem
                    key={card.id}
                    card={card}
                    onClick={setSelectedCard}
                    episodeBadge={ep ? { href: `/series/${ep.series.id}/${ep.episode.slug}` } : undefined}
                  />
                );
              })}
            </div>
          </section>
        ))}

        {totalVisible === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-text-secondary">No cards match these filters.</p>
            <button
              type="button"
              onClick={onClearAll}
              className="mt-3 text-sm font-medium text-gold underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Detail view added in Task 6 */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedCard(null)}
        >
          <div className="rounded-2xl bg-bg p-6 text-text-primary" onClick={(e) => e.stopPropagation()}>
            <p>Detail view for {selectedCard.name} — coming in Task 6</p>
            <button
              type="button"
              onClick={() => setSelectedCard(null)}
              className="mt-4 rounded-lg bg-gold px-4 py-1.5 text-sm font-bold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/cards/CardCollectionFilters.tsx \
        src/components/cards/CardCollectionGrid.tsx
git commit -m "feat(cards): filter bar, sort, group, URL state sync"
```

---

## Task 5: `CardDetailOverlay` (desktop floating + mobile modal + Messenger flow)

**Files:**
- Create: `src/components/cards/CardDetailOverlay.tsx`
- Modify: `src/components/cards/CardCollectionGrid.tsx` (replace placeholder)

- [ ] **Step 1: Create the overlay/modal component**

Create `/Users/lm/repos/cardfables/src/components/cards/CardDetailOverlay.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { CardCollectionEntry, Series } from "@/lib/types";
import { CURRENCY } from "@/lib/data";
import { findEpisodeForCard } from "@/lib/cardsCollection";

interface CardDetailOverlayProps {
  card: CardCollectionEntry;
  series: Series[];
  onClose: () => void;
  anchor: { x: number; y: number; width: number; height: number } | null;
}

function formatPrice(n: number): string {
  if (CURRENCY === "USD") return `$${n}`;
  if (CURRENCY === "JPY") return `¥${n.toLocaleString()}`;
  return `${CURRENCY} ${n}`;
}

function prefilledMessage(card: CardCollectionEntry): string {
  return `Hi! I'm interested in: ${card.name} — ${card.set} (${card.year}) — ${formatPrice(card.price)}`;
}

const RARITY_COLORS: Record<string, string> = {
  SAR: "#D4893A",
  "Full Art": "#9B7AC4",
  Holo: "#8FA8B8",
  Promo: "#22C55E",
  Rare: "#5B9BD5",
};

export function CardDetailOverlay({ card, series, onClose, anchor }: CardDetailOverlayProps) {
  const [useModal, setUseModal] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // Choose modal vs overlay based on viewport + hover capability
  useEffect(() => {
    const isDesktop =
      window.matchMedia("(min-width: 1024px) and (hover: hover)").matches;
    setUseModal(!isDesktop);
  }, []);

  // Compute desktop overlay position from anchor
  useEffect(() => {
    if (useModal || !anchor) return;
    const overlayWidth = 360;
    const overlayHeight = 540;
    const gap = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = anchor.x + anchor.width + gap;
    let top = anchor.y;

    if (left + overlayWidth > vw - 16) {
      // flip to left of anchor
      left = anchor.x - overlayWidth - gap;
    }
    if (left < 16) {
      // fall through to modal style
      setUseModal(true);
      return;
    }
    if (top + overlayHeight > vh - 16) {
      top = Math.max(16, vh - overlayHeight - 16);
    }
    if (top < 16) top = 16;
    setPosition({ left, top });
  }, [useModal, anchor]);

  // Close on scroll (desktop overlay)
  useEffect(() => {
    if (useModal) return;
    const onScroll = () => onClose();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useModal, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ep = findEpisodeForCard(series, card);
  const isAvailable = card.status === "available";
  const rarityColor = RARITY_COLORS[card.rarity] ?? "#7A6E5E";

  const handleBuy = async () => {
    try {
      await navigator.clipboard.writeText(prefilledMessage(card));
    } catch {
      // ignore — clipboard might be blocked on some browsers
    }
    const url = `https://m.me/cardfables?ref=${encodeURIComponent(card.id)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const content = (
    <div className="flex flex-col">
      {/* Image */}
      <div className="relative aspect-[2.5/3.5] w-full overflow-hidden rounded-xl bg-surface-light">
        {card.image ? (
          <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">🎴</div>
        )}
        <span
          className="absolute top-3 right-3 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
          style={{ background: rarityColor }}
        >
          {card.rarity}
        </span>
      </div>

      {/* Info */}
      <div className="mt-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">{card.name}</h2>
        <p className="mt-0.5 text-sm text-text-secondary">
          {card.set} · {card.year}
          {card.setNumber && ` · ${card.setNumber}`}
        </p>
        <p className="mt-1 text-xs text-text-dim">
          {card.condition}
          {card.artist && ` · Art by ${card.artist}`}
        </p>

        {card.description && (
          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            {card.description}
          </p>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          {card.originalPrice && card.originalPrice > card.price && (
            <span className="text-sm text-text-dim line-through">
              {formatPrice(card.originalPrice)}
            </span>
          )}
          <span className="font-heading text-2xl font-bold text-gold">
            {formatPrice(card.price)}
          </span>
        </div>

        {isAvailable ? (
          <button
            type="button"
            onClick={handleBuy}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-[#FFFEF7]"
            style={{
              background: "linear-gradient(135deg, #D4893A, #B86E28)",
              boxShadow: "0 8px 28px rgba(212,137,58,0.25)",
            }}
          >
            Message me to buy ↗
          </button>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-surface-light px-5 py-3 text-center text-sm font-bold text-text-dim">
            {card.status === "sold" ? "Sold" : card.status === "reserved" ? "Reserved" : "Not available"}
          </div>
        )}
        <p className="mt-2 text-center text-[10px] text-text-dim">
          {isAvailable ? "Message copied to clipboard — paste it into Messenger to start the conversation" : ""}
        </p>

        {ep && (
          <Link
            href={`/series/${ep.series.id}/${ep.episode.slug}`}
            className="mt-3 block text-center text-sm font-medium text-text-secondary underline hover:text-gold"
            onClick={onClose}
          >
            📖 Read the story →
          </Link>
        )}
      </div>
    </div>
  );

  // Mobile / fallback: full-screen modal
  if (useModal) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-bg p-5 sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 rounded-full bg-bg/80 px-2.5 py-1 text-sm font-bold text-text-secondary backdrop-blur-sm"
            aria-label="Close"
          >
            ✕
          </button>
          {content}
        </div>
      </div>
    );
  }

  // Desktop floating overlay
  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="fixed z-50 w-[360px] rounded-2xl border border-border bg-bg p-5 shadow-2xl"
      style={{
        left: position?.left ?? -9999,
        top: position?.top ?? -9999,
      }}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs text-text-secondary"
        aria-label="Close"
      >
        ✕
      </button>
      {content}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the grid (replace the placeholder)**

In `/Users/lm/repos/cardfables/src/components/cards/CardCollectionGrid.tsx`, replace the placeholder modal at the bottom of the file with the real overlay. Update the file:

Find the import block at the top:
```tsx
import { CardCollectionItem } from "./CardCollectionItem";
import { CardCollectionFilters } from "./CardCollectionFilters";
```
Replace with:
```tsx
import { CardCollectionItem } from "./CardCollectionItem";
import { CardCollectionFilters } from "./CardCollectionFilters";
import { CardDetailOverlay } from "./CardDetailOverlay";
```

Find the state declarations:
```tsx
const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);
```
Replace with:
```tsx
const [selectedCard, setSelectedCard] = useState<CardCollectionEntry | null>(null);
const [anchor, setAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

const handleCardClick = (card: CardCollectionEntry, event?: React.MouseEvent<HTMLButtonElement>) => {
  if (event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchor({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
  } else {
    setAnchor(null);
  }
  setSelectedCard(card);
};
```

In `CardCollectionItem`'s prop, the onClick now takes an event too. Update the call site:
```tsx
<CardCollectionItem
  key={card.id}
  card={card}
  onClick={(c, e) => handleCardClick(c, e)}
  episodeBadge={ep ? { href: `/series/${ep.series.id}/${ep.episode.slug}` } : undefined}
/>
```

And the placeholder modal at the bottom:
```tsx
{selectedCard && (
  <div
    role="dialog"
    ...
  >
    ...placeholder...
  </div>
)}
```
Replace with:
```tsx
{selectedCard && (
  <CardDetailOverlay
    card={selectedCard}
    series={series}
    onClose={() => {
      setSelectedCard(null);
      setAnchor(null);
    }}
    anchor={anchor}
  />
)}
```

- [ ] **Step 3: Update `CardCollectionItem` to pass the click event**

In `/Users/lm/repos/cardfables/src/components/cards/CardCollectionItem.tsx`, update the prop type and onClick:

Change the interface from:
```ts
onClick: (card: CardCollectionEntry) => void;
```
to:
```ts
onClick: (card: CardCollectionEntry, event?: React.MouseEvent<HTMLButtonElement>) => void;
```

And change the button's onClick from:
```tsx
onClick={() => onClick(card)}
```
to:
```tsx
onClick={(e) => onClick(card, e)}
```

- [ ] **Step 4: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```
Expected: 0 errors, all helper tests still pass, build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/cards/CardDetailOverlay.tsx \
        src/components/cards/CardCollectionGrid.tsx \
        src/components/cards/CardCollectionItem.tsx
git commit -m "feat(cards): CardDetailOverlay — desktop overlay + mobile modal, Messenger flow"
```

---

## Task 6: Navbar + sitemap

**Files:**
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Add "Cards" link to Navbar**

Read `/Users/lm/repos/cardfables/src/components/layout/Navbar.tsx`. Find the navigation links section (a list of `<Link>` elements with hrefs like `/browse`, `/shop`, etc.). Add a `<Link>` for `/cards` between Shop and Submit (or wherever fits the existing visual grouping). The exact insertion depends on the file's current structure — locate by reading the file first.

Add an entry that matches the existing pattern. For example, if other links look like:
```tsx
<Link href="/shop" className="...">Shop</Link>
```
Add right after:
```tsx
<Link href="/cards" className="...">Cards</Link>
```

- [ ] **Step 2: Add `/cards` to sitemap**

Open `/Users/lm/repos/cardfables/src/app/sitemap.ts`. Inside `staticPages`, add:

```ts
{ url: `${baseUrl}/cards`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
```

Insert it next to the existing `/shop` entry. Final `staticPages` array order is up to existing convention.

- [ ] **Step 3: Verify build**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors. `/cards` appears in the built static pages list.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Navbar.tsx src/app/sitemap.ts
git commit -m "feat(cards): add Cards to navbar and sitemap"
```

---

## Task 7: `/admin/cards` API routes (CRUD)

**Files:**
- Create: `src/app/api/cards/route.ts`
- Create: `src/app/api/cards/[id]/route.ts`
- Create: `src/app/api/cards/upload-image/route.ts`

Pattern matches existing `/api/shop` and `/api/series` admin routes.

- [ ] **Step 1: Reference an existing API route**

Read `/Users/lm/repos/cardfables/src/app/api/shop/route.ts` (or similar) to understand the existing pattern for auth + GitHub read/write. The same patterns apply here.

- [ ] **Step 2: Create the collection-level route (GET list, POST create)**

Create `/Users/lm/repos/cardfables/src/app/api/cards/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, commitFiles } from "@/lib/github";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function readCollection(): Promise<CardCollectionEntry[]> {
  try {
    const { content } = await readFile(COLLECTION_PATH);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const cards = await readCollection();
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const body = (await req.json()) as CardCollectionEntry;
  if (!body.id || !body.name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }
  const cards = await readCollection();
  if (cards.find((c) => c.id === body.id)) {
    return NextResponse.json({ error: "id already exists" }, { status: 409 });
  }
  cards.push(body);
  await commitFiles(
    [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
    `admin: add card ${body.name}`
  );
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Create the per-id route (PUT update, DELETE delete)**

Create `/Users/lm/repos/cardfables/src/app/api/cards/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, commitFiles, deleteFile } from "@/lib/github";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function readCollection(): Promise<CardCollectionEntry[]> {
  try {
    const { content } = await readFile(COLLECTION_PATH);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const updates = (await req.json()) as Partial<CardCollectionEntry>;
  const cards = await readCollection();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  cards[idx] = { ...cards[idx], ...updates, id };
  await commitFiles(
    [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
    `admin: update card ${cards[idx].name}`
  );
  return NextResponse.json({ ok: true, card: cards[idx] });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await ctx.params;
  const cards = await readCollection();
  const idx = cards.findIndex((c) => c.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const removed = cards.splice(idx, 1)[0];
  await commitFiles(
    [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
    `admin: delete card ${removed.name}`
  );
  // Best-effort image cleanup; tolerate missing images
  if (removed.image && removed.image.startsWith("/images/cards-collection/")) {
    try {
      await deleteFile(`public${removed.image}`, `admin: delete card image ${removed.id}`);
    } catch {
      // ignore — image may not exist or have been managed manually
    }
  }
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Create the image upload route**

Create `/Users/lm/repos/cardfables/src/app/api/cards/upload-image/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { commitFiles } from "@/lib/github";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const form = await req.formData();
  const file = form.get("image") as File | null;
  const id = form.get("id") as string | null;
  if (!file || !id) {
    return NextResponse.json({ error: "image and id required" }, { status: 400 });
  }
  const safeId = id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `public/images/cards-collection/${safeId}.${ext}`;
  const arrayBuf = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuf).toString("base64");
  await commitFiles(
    [{ path, content: base64 }],
    `admin: upload card image ${safeId}`
  );
  return NextResponse.json({ ok: true, path: `/images/cards-collection/${safeId}.${ext}` });
}
```

Note: `commitFiles` in `src/lib/github.ts` currently encodes content as utf-8. For binary uploads (images), the GitHub API needs base64 encoding. **Before completing this step, verify `commitFiles` supports binary content**. Read `/Users/lm/repos/cardfables/src/lib/github.ts`:
- If `commitFiles` uses `encoding: "utf-8"` only, this route will corrupt binary content. In that case, either:
  - Add an optional `encoding` parameter to the `commitFiles` signature in `src/lib/github.ts` (defaults to `"utf-8"`, accepts `"base64"`), pass `"base64"` for images
  - Or use the simpler GitHub `/contents/{path}` PUT API which accepts base64 directly

If you need to modify `commitFiles`, do so as a separate small commit before this route.

- [ ] **Step 5: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cards/route.ts \
        src/app/api/cards/[id]/route.ts \
        src/app/api/cards/upload-image/route.ts
git commit -m "feat(cards): admin API routes — list/create/update/delete + image upload"
```

If `commitFiles` needed a binary-encoding update, that's a separate prior commit.

---

## Task 8: `/admin/cards` page (list + inline edit + quick actions)

**Files:**
- Create: `src/app/admin/cards/page.tsx`
- Modify: `src/app/admin/context.tsx` (add sidebar nav entry)

- [ ] **Step 1: Read the existing admin shop page for the pattern**

Read `/Users/lm/repos/cardfables/src/app/admin/shop/page.tsx` to understand the existing list-edit-save flow and replicate the visual style.

- [ ] **Step 2: Create the admin cards page**

Create `/Users/lm/repos/cardfables/src/app/admin/cards/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../context";
import type { CardCollectionEntry, CardStatus } from "@/lib/types";

const STATUS_COLORS: Record<CardStatus, { bg: string; fg: string }> = {
  available: { bg: "rgba(34,197,94,0.10)", fg: "#16A34A" },
  sold: { bg: "rgba(74,64,53,0.10)", fg: "#7A6E5E" },
  reserved: { bg: "rgba(234,179,8,0.12)", fg: "#A16207" },
  hidden: { bg: "rgba(74,64,53,0.04)", fg: "#9B8F7E" },
};

export default function AdminCardsPage() {
  const { authed } = useAdmin();
  const [cards, setCards] = useState<CardCollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CardStatus | "all">("all");

  useEffect(() => {
    if (!authed) return;
    fetch("/api/cards")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .finally(() => setLoading(false));
  }, [authed]);

  if (!authed) return null;
  if (loading) return <div className="p-6 text-text-secondary">Loading cards…</div>;

  const filtered = cards.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (c.name + " " + c.set).toLowerCase().includes(q);
    }
    return true;
  });

  const updateCard = async (id: string, updates: Partial<CardCollectionEntry>) => {
    const res = await fetch(`/api/cards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      alert("Failed to update");
      return;
    }
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCard = async (id: string) => {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete");
      return;
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">Cards</h1>
          <p className="text-sm text-text-secondary">
            {filtered.length} of {cards.length} cards
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CardStatus | "all")}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="reserved">Reserved</option>
            <option value="hidden">Hidden</option>
          </select>
          <a
            href="/admin/cards/new"
            className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-white"
          >
            + Add Card
          </a>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-light text-xs uppercase tracking-wider text-text-secondary">
            <tr>
              <th className="px-3 py-2 text-left">Image</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Set · Year</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Cond.</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Stock</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const sc = STATUS_COLORS[c.status];
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    {c.image ? (
                      <img src={c.image} alt="" className="h-12 w-9 rounded object-cover" />
                    ) : (
                      <div className="flex h-12 w-9 items-center justify-center rounded bg-surface-light text-xs">🎴</div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-text-primary">{c.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{c.set} · {c.year}</td>
                  <td className="px-3 py-2 font-bold text-gold">${c.price}{c.originalPrice ? <span className="ml-1 text-xs text-text-dim line-through">${c.originalPrice}</span> : null}</td>
                  <td className="px-3 py-2">{c.condition}</td>
                  <td className="px-3 py-2">
                    <select
                      value={c.status}
                      onChange={(e) => updateCard(c.id, { status: e.target.value as CardStatus })}
                      className="rounded px-1.5 py-0.5 text-xs font-bold uppercase"
                      style={{ background: sc.bg, color: sc.fg }}
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{c.stock ?? 1}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === c.id ? null : c.id)}
                      className="mr-2 text-xs font-medium text-text-secondary underline"
                    >
                      {editingId === c.id ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCard(c.id)}
                      className="text-xs font-medium text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-text-secondary">
          No cards match the filter.
        </div>
      )}
    </div>
  );
}
```

Note: this MVP renders the list with quick status toggle + delete. Full inline-edit form is added in Task 9 (along with CSV import). For now, status + delete + new (via dedicated route, also added in Task 9).

- [ ] **Step 3: Add "Cards" entry to admin sidebar**

Read `/Users/lm/repos/cardfables/src/app/admin/context.tsx`. Find the sidebar nav definition (likely an array of `{ label, href, icon }` entries). Add `{ label: "Cards", href: "/admin/cards" }` between Shop and Series. The exact code depends on the file's structure — locate by reading.

- [ ] **Step 4: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors. `/admin/cards` is built.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/cards/page.tsx src/app/admin/context.tsx
git commit -m "feat(cards): /admin/cards page — list, quick status, delete"
```

---

## Task 9: Admin "Add card" + inline edit form

**Files:**
- Create: `src/app/admin/cards/new/page.tsx`
- Modify: `src/app/admin/cards/page.tsx` (inline edit form expansion)

- [ ] **Step 1: Create the "new card" page**

Create `/Users/lm/repos/cardfables/src/app/admin/cards/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../context";
import { slugifyCardId } from "@/lib/cardsCollection";
import type {
  CardCollectionEntry,
  CardCondition,
  CardStatus,
  PokemonType,
} from "@/lib/types";

const TYPES: PokemonType[] = ["Fire", "Water", "Grass", "Electric", "Dark", "Steel", "Psychic", "Fighting", "Normal", "Dragon", "Fairy"];
const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const STATUSES: CardStatus[] = ["available", "sold", "reserved", "hidden"];

export default function NewCardPage() {
  const { authed } = useAdmin();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<CardCollectionEntry>>({
    name: "",
    set: "",
    year: new Date().getFullYear(),
    type: "Normal",
    rarity: "Common",
    price: 0,
    condition: "NM",
    status: "available",
    image: "",
  });

  if (!authed) return null;

  const update = (patch: Partial<CardCollectionEntry>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Name and price are required");
      return;
    }
    setSaving(true);
    const id = slugifyCardId(form.name, form.set ?? "");
    const today = new Date().toISOString().slice(0, 10);
    const entry: CardCollectionEntry = {
      id,
      name: form.name!,
      set: form.set ?? "",
      year: form.year ?? new Date().getFullYear(),
      type: form.type as PokemonType,
      rarity: form.rarity ?? "Common",
      image: form.image ?? "",
      price: Number(form.price),
      condition: form.condition as CardCondition,
      status: form.status as CardStatus,
      addedAt: today,
      ...(form.setNumber ? { setNumber: form.setNumber } : {}),
      ...(form.artist ? { artist: form.artist } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
      ...(form.stock ? { stock: Number(form.stock) } : {}),
    };
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    setSaving(false);
    if (!res.ok) {
      const error = await res.text();
      alert(`Failed to save: ${error}`);
      return;
    }
    router.push("/admin/cards");
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-4 font-heading text-2xl font-bold text-text-primary">Add Card</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name *">
          <input value={form.name ?? ""} onChange={(e) => update({ name: e.target.value })} className={input} required />
        </Field>
        <Field label="Set">
          <input value={form.set ?? ""} onChange={(e) => update({ set: e.target.value })} className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input type="number" value={form.year ?? ""} onChange={(e) => update({ year: Number(e.target.value) })} className={input} />
          </Field>
          <Field label="Set Number">
            <input value={form.setNumber ?? ""} onChange={(e) => update({ setNumber: e.target.value })} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={form.type ?? "Normal"} onChange={(e) => update({ type: e.target.value as PokemonType })} className={input}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Rarity">
            <input value={form.rarity ?? ""} onChange={(e) => update({ rarity: e.target.value })} className={input} />
          </Field>
        </div>
        <Field label="Artist">
          <input value={form.artist ?? ""} onChange={(e) => update({ artist: e.target.value })} className={input} />
        </Field>
        <Field label="Image path (e.g., /images/cards-collection/foo.jpg)">
          <input value={form.image ?? ""} onChange={(e) => update({ image: e.target.value })} className={input} />
        </Field>
        <Field label="Description">
          <textarea value={form.description ?? ""} onChange={(e) => update({ description: e.target.value })} className={input} rows={3} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price *">
            <input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => update({ price: Number(e.target.value) })} className={input} required />
          </Field>
          <Field label="Original Price">
            <input type="number" step="0.01" value={form.originalPrice ?? ""} onChange={(e) => update({ originalPrice: Number(e.target.value) })} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Condition">
            <select value={form.condition ?? "NM"} onChange={(e) => update({ condition: e.target.value as CardCondition })} className={input}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Stock">
            <input type="number" min={0} value={form.stock ?? ""} onChange={(e) => update({ stock: Number(e.target.value) })} className={input} />
          </Field>
          <Field label="Status">
            <select value={form.status ?? "available"} onChange={(e) => update({ status: e.target.value as CardStatus })} className={input}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="pt-3 flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-white">
            {saving ? "Saving…" : "Save card"}
          </button>
          <button type="button" onClick={() => router.push("/admin/cards")} className="text-sm font-medium text-text-secondary underline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</div>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Verify build + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/cards/new/page.tsx
git commit -m "feat(cards): admin add-card form"
```

(Inline edit-in-row is deferred. Editing today requires deleting + re-adding, OR direct git edits. Acceptable for v1.)

---

## Task 10: CSV import + export

**Files:**
- Create: `src/app/api/cards/import/route.ts`
- Create: `src/app/api/cards/export/route.ts`
- Create: `src/app/admin/cards/import/page.tsx`

- [ ] **Step 1: Create the import API route**

Create `/Users/lm/repos/cardfables/src/app/api/cards/import/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile, commitFiles } from "@/lib/github";
import { parseCSV, validateCSVRows } from "@/lib/cardsCollection";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

async function readCollection(): Promise<CardCollectionEntry[]> {
  try {
    const { content } = await readFile(COLLECTION_PATH);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// Preview mode (validate only, no write)
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { csv, commit } = (await req.json()) as { csv: string; commit?: boolean };
  if (!csv) {
    return NextResponse.json({ error: "csv body required" }, { status: 400 });
  }

  const existing = await readCollection();
  const rows = parseCSV(csv);
  const result = validateCSVRows(rows, existing);

  if (!commit) {
    return NextResponse.json({ result });
  }

  if (result.totalErrors > 0) {
    return NextResponse.json(
      { error: "Cannot commit with errors", result },
      { status: 400 }
    );
  }

  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const row of result.rows) {
    if (row.entry) {
      byId.set(row.entry.id, row.entry);
    }
  }
  const next = [...byId.values()];
  await commitFiles(
    [{ path: COLLECTION_PATH, content: JSON.stringify(next, null, 2) }],
    `admin: import ${result.totalCreate} new + ${result.totalUpdate} updated cards`
  );
  return NextResponse.json({ ok: true, result });
}
```

- [ ] **Step 2: Create the export API route**

Create `/Users/lm/repos/cardfables/src/app/api/cards/export/route.ts`:

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "@/lib/github";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

const COLUMNS: (keyof CardCollectionEntry)[] = [
  "id", "name", "set", "setNumber", "year", "type", "rarity",
  "artist", "image", "description", "price", "originalPrice",
  "condition", "stock", "status", "addedAt",
];

function escapeCSV(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session || session.value !== "ok") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let cards: CardCollectionEntry[] = [];
  try {
    const { content } = await readFile(COLLECTION_PATH);
    cards = JSON.parse(content);
  } catch {
    cards = [];
  }

  const header = COLUMNS.join(",");
  const rows = cards.map((c) =>
    COLUMNS.map((col) => escapeCSV(c[col])).join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cards-collection-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
```

- [ ] **Step 3: Create the import UI page**

Create `/Users/lm/repos/cardfables/src/app/admin/cards/import/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../context";
import type { CSVImportResult } from "@/lib/types";

export default function ImportCardsPage() {
  const { authed } = useAdmin();
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<CSVImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  if (!authed) return null;

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
    setPreview(null);
  };

  const runPreview = async () => {
    if (!csv) {
      alert("Paste CSV or choose a file first");
      return;
    }
    const res = await fetch("/api/cards/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: false }),
    });
    const data = await res.json();
    setPreview(data.result ?? null);
  };

  const commitImport = async () => {
    if (!preview || preview.totalErrors > 0) return;
    setImporting(true);
    const res = await fetch("/api/cards/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: true }),
    });
    setImporting(false);
    if (!res.ok) {
      const err = await res.text();
      alert(`Import failed: ${err}`);
      return;
    }
    router.push("/admin/cards");
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-4 font-heading text-2xl font-bold text-text-primary">
        Import Cards from CSV
      </h1>
      <p className="mb-4 text-sm text-text-secondary">
        Required columns: <code>name, price, condition</code>. Other columns optional. Existing cards (matched by <code>id</code>) are updated; new ones are created.
      </p>

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="mb-2 block text-sm"
        />
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="…or paste CSV here"
          rows={10}
          className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs"
        />
      </div>

      <button
        type="button"
        onClick={runPreview}
        className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium"
      >
        Preview import
      </button>

      {preview && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-bold text-text-primary">Preview</h2>
          <ul className="mb-3 space-y-1 text-sm">
            <li>{preview.totalCreate} new cards</li>
            <li>{preview.totalUpdate} updates</li>
            <li className={preview.totalErrors > 0 ? "text-red-600 font-bold" : ""}>
              {preview.totalErrors} errors
            </li>
            <li>{preview.totalWarnings} warnings</li>
          </ul>

          {preview.totalErrors > 0 && (
            <details className="mb-3 text-xs" open>
              <summary className="cursor-pointer font-bold text-red-600">Errors</summary>
              <ul className="ml-4 mt-1 list-disc">
                {preview.rows
                  .filter((r) => r.errors.length > 0)
                  .map((r) => (
                    <li key={r.rowNumber}>
                      Row {r.rowNumber}: {r.errors.join("; ")}
                    </li>
                  ))}
              </ul>
            </details>
          )}

          {preview.totalWarnings > 0 && (
            <details className="mb-3 text-xs">
              <summary className="cursor-pointer font-bold text-yellow-700">Warnings</summary>
              <ul className="ml-4 mt-1 list-disc">
                {preview.rows
                  .filter((r) => r.warnings.length > 0)
                  .map((r) => (
                    <li key={r.rowNumber}>
                      Row {r.rowNumber}: {r.warnings.join("; ")}
                    </li>
                  ))}
              </ul>
            </details>
          )}

          <button
            type="button"
            onClick={commitImport}
            disabled={preview.totalErrors > 0 || importing}
            className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {importing
              ? "Importing…"
              : `Import ${preview.totalCreate} new + ${preview.totalUpdate} updates`}
          </button>
        </div>
      )}

      <hr className="my-8 border-border" />

      <h2 className="mb-2 font-bold text-text-primary">Export</h2>
      <p className="mb-3 text-sm text-text-secondary">
        Download the current collection as CSV (backup, bulk-edit in a spreadsheet, then re-import).
      </p>
      <a
        href="/api/cards/export"
        className="inline-block rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium"
      >
        Download CSV
      </a>
    </div>
  );
}
```

- [ ] **Step 4: Add "Import CSV" link to the admin cards page header**

In `/Users/lm/repos/cardfables/src/app/admin/cards/page.tsx`, find the header `<a href="/admin/cards/new">` and add an Import link next to it:

Replace:
```tsx
<a
  href="/admin/cards/new"
  className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-white"
>
  + Add Card
</a>
```
With:
```tsx
<a
  href="/admin/cards/import"
  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary"
>
  Import CSV
</a>
<a
  href="/admin/cards/new"
  className="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-white"
>
  + Add Card
</a>
```

- [ ] **Step 5: Verify build + tests + type-check**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```
Expected: 0 errors, all tests pass (39 + helper tests still green), build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cards/import/route.ts \
        src/app/api/cards/export/route.ts \
        src/app/admin/cards/import/page.tsx \
        src/app/admin/cards/page.tsx
git commit -m "feat(cards): CSV import (with preview) and export"
```

---

## Task 11: Manual browser verification

**Files:** none modified — verification step.

Browser-driven; controller (or user) walks through with `pnpm dev`.

- [ ] **Step 1: Start dev server (if not already running)**

If no `next dev` is on port 3000:
```bash
pnpm dev
```
Wait for `Local: http://localhost:3000`. If there's already a dev server running, use that.

- [ ] **Step 2: Verify `/cards` renders the 3 sample cards**

Visit `http://localhost:3000/cards`. Expect:
- Header "All Cards · 2 of 2 available · 1 sold" (Mismagius is sold in the seed data)
- Grid with 2 visible cards (Charizard, Venusaur). Mismagius hidden by default (sold).
- Each card shows: thumbnail (emoji fallback for Venusaur/Mismagius), name, set/year, struck-through original price + sale price for Charizard, plain price for others.

- [ ] **Step 3: Toggle "Include Sold" filter**

In the Status filter section, click "Include Sold". Expect:
- Mismagius now visible, grayed with red SOLD badge

- [ ] **Step 4: Test filters**

Click the "Fire" type chip. Expect:
- Only Charizard shown.
Click "Fire" again to deselect. All cards return.

- [ ] **Step 5: Test search**

Type "ven" into search. Expect:
- Only Venusaur shown.

- [ ] **Step 6: Test sort**

Choose "Price: high to low". Expect:
- Order: Charizard ($30), Mismagius ($22), Venusaur ($18) when sold included.

- [ ] **Step 7: Test grouping**

Choose "Group by year". Expect:
- Three sections: 2024 (Mismagius), 2023 (Venusaur), 2022 (Charizard).

- [ ] **Step 8: Test URL state sync**

Apply a filter, copy the URL, paste into a new tab. Expect:
- Same filtered view loads from the URL params.

- [ ] **Step 9: Test desktop overlay (≥1024px viewport)**

Click Charizard thumbnail. Expect:
- Floating overlay appears next to the card with full details, Buy button, and a "Read the story" link (Charizard matches an episode).
- Move mouse off the overlay → it fades out.
- Click another card → overlay re-positions.

- [ ] **Step 10: Test mobile modal (<1024px viewport, or DevTools device emulator)**

Resize to iPhone 13 (390×844). Click any thumbnail. Expect:
- Full-screen modal slides up from bottom.
- × in top right and tap-outside both close.

- [ ] **Step 11: Test Buy CTA (clipboard pre-fill)**

In the detail view, click "Message me to buy". Expect:
- New tab opens to `m.me/cardfables?ref=<card-id>`
- Clipboard contains a message like `Hi! I'm interested in: Charizard V (SAR) — VSTAR Universe (2022) — $30` — paste into any text field to verify.
- Browser may show a clipboard permission prompt on first use.

- [ ] **Step 12: Verify "Read the story" cross-link**

In Charizard's detail view, click "📖 Read the story →". Expect:
- Navigates to `/series/flames-of-our-lives/the-nap-that-changed-everything`.

- [ ] **Step 13: Test admin flow**

Visit `http://localhost:3000/admin` → log in. Click "Cards" in the sidebar.
- Expect table of 3 cards with status select per row.
- Change Mismagius status to "available" → page updates, GitHub commit fires.
- Click "+ Add Card" → fill in a test card → save → returns to list, new card present.
- Click "Delete" on the test card → confirm → row disappears.

- [ ] **Step 14: Test CSV import preview**

Click "Import CSV" → paste this CSV:
```csv
name,set,year,type,rarity,price,condition,status
Pikachu V,Vivid Voltage,2020,Electric,SAR,55,NM,available
Eevee,Evolutions,2016,Normal,Holo,12,LP,available
```
Click "Preview import". Expect:
- "2 new cards, 0 updates, 0 errors, 2 warnings (no image)".

Click "Import 2 new + 0 updates". Expect:
- Returns to admin cards list with 2 new entries.

- [ ] **Step 15: Test CSV export**

Click "Import CSV" link → click "Download CSV" at the bottom. Expect:
- Downloads `cards-collection-YYYY-MM-DD.csv` containing all current cards including the imports.

- [ ] **Step 16: Test reduced-motion**

In DevTools → Rendering tab, set "Emulate CSS media feature prefers-reduced-motion" to **reduce**. Reload `/cards` and click a thumbnail. Expect:
- Detail view appears instantly (no slide/fade), or fade only.

- [ ] **Step 17: Stop dev server**

If you started a fresh server, Ctrl+C. If you used an existing one, leave it.

---

## Self-Review Notes

Spec coverage check:

| Spec section | Implementing task |
|---|---|
| Architecture (3-layer JSON, cross-link by name) | Task 1, 2 (helper), 3-5 (consumers) |
| Data schema (`CardCollectionEntry` + enums) | Task 1 |
| Currency from config | Task 1, used in 3 and 5 |
| Grid + filter + sort + group + search + URL sync | Task 3 (grid), Task 4 (filters/sort/group/URL) |
| Card thumbnail (price strikethrough, rarity tag, status badges) | Task 3 |
| Desktop floating overlay | Task 5 |
| Mobile full-screen modal | Task 5 |
| Buy CTA with clipboard pre-fill | Task 5 |
| Episode cross-link badge + link | Task 2 (helper), Task 3 (badge), Task 5 (link) |
| Admin `/admin/cards` list with quick status | Task 8 |
| Add / Delete card | Task 7 (API), Task 8 (delete UI), Task 9 (add UI) |
| Inline edit form | **Partially**: status quick-toggle in Task 8; full edit via delete+re-add. Full inline form deferred per Task 9 note. |
| CSV import with preview | Task 10 |
| CSV export | Task 10 |
| Single-card image upload | Task 7 (API only; not yet wired into UI — see note) |
| Navbar + sitemap entries | Task 6 |
| Manual browser walk-through | Task 11 |

**Acknowledged gaps**:
1. Full inline edit (beyond status toggle) is deferred. Status + delete + add cover the v1 flows; full row-expansion edit is a follow-up. Add to backlog.
2. Image upload UI (the field in the form) is text-path only. The API exists (Task 7) but the form doesn't call it. Wire the upload into both the Add form (Task 9) and any future edit form when added.
3. The image upload API may need a binary-encoding update to `commitFiles` in `src/lib/github.ts` — flagged in Task 7 Step 4. Verify before relying on it.

Type consistency: `CardCollectionEntry`, `CardFilters`, `CardSort`, `CardGrouping`, `CardGroup`, `CSVImportRow`, `CSVImportResult` are defined in Task 1/2 and consumed consistently in Tasks 3-10.

No placeholders. Every step has actual code or commands.
