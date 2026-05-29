# `/cards` Marketplace — Design

> Status: Proposed
> Date: 2026-05-29
> Scope: New `/cards` page on cardfables.com listing ~500 personal Pokémon cards for direct sale via Messenger. Plus admin tooling with CSV bulk import. Architecture is Option C (flat route, client-scoped data).

---

## Context

The owner sells Pokémon cards from his personal Facebook account. He wants the website to serve as the **catalog** for his collection — a "see all the cards I'm selling" link he can drop in his Facebook posts. Buying happens via Messenger (m.me/cardfables), already wired up by the conversion-improvements work earlier this month.

This is the **first surface that combines the narrative platform with direct commerce**. Stories live on cardfables.com; some of those story-cards plus another ~500 unrelated cards are for sale. The two layers cross-link automatically: a card that appears in a fable shows a "Read the story" badge; a card in an episode shows an "Available to buy" link when it's also in the collection.

**Distribution flywheel**:
```
Personal FB post: "Selling this Charizard 🐉. See all my cards: cardfables.com/cards"
  ↓
Browse 500-card catalog with filters
  ↓
Click thumbnail → enlarged view
  ↓
"Message me to buy" → m.me/cardfables (clipboard pre-filled)
  ↓
DM → negotiation → payment → ship
  ↓
Buyer also discovers the fables → reads → invested in next card
```

---

## Architecture

Three data layers, three jobs:

| File | Purpose | Status |
|---|---|---|
| `shop.json` | Curated affiliate gear (booster boxes, sleeves, featured items) | exists |
| `cards-collection.json` | Owner's ~500 cards for direct sale via Messenger | **new** |
| `episode.cards[]` (per episode) | Cards referenced in stories | exists |

**Cross-linking** is derived at render time, not stored:
- Card on `/cards` matches an episode card by `name` → shows "📖 Story" badge linking to the episode
- Episode card matches a collection card by `name` → optional "Also for sale →" link in the sidebar/spotlight

No manual `episodeId` field on collection cards — the `name` field already bridges both directions, avoiding drift when names change.

**URL strategy** (Option C):
- `/cards` is a flat route (simple URL for FB shares)
- Data file at `clients/pokemon-fables/cards-collection.json` — client-scoped from day one
- When the multi-tenant SaaS work happens later, the route migrates to `/c/pokemon-fables/cards` with a 301; no data restructuring required

**Build pipeline**: `scripts/build-data.js` reads `cards-collection.json` alongside existing JSONs and emits the typed `CARDS` array into the auto-generated `src/lib/data.ts`. Same pattern as `SERIES` and `SHOP`.

---

## Data Schema

```ts
interface CardCollectionEntry {
  // Identity
  id: string;                    // slug, e.g. "charizard-v-sar-vstar-universe"
  name: string;                  // "Charizard V (SAR)"

  // Card info
  set: string;                   // "VSTAR Universe"
  setNumber?: string;            // "018/172"
  year: number;                  // 2022 (used for filter + group)
  type: PokemonType;             // "Fire" | "Water" | "Grass" | "Electric" | "Dark"
                                 //  | "Steel" | "Psychic" | "Fighting" | "Normal"
                                 //  | "Dragon" | "Fairy"
  rarity: string;                // "SAR" | "Holo" | "Common" | "Promo" | etc.
  artist?: string;               // "Oswaldo KATO"

  // Visual + copy
  image: string;                 // "/images/cards-collection/charizard-v-sar.jpg"
  description?: string;          // 1-3 sentences shown in the enlarged view

  // Pricing (numbers for filter/sort)
  price: number;                 // 30 (current sale price)
  originalPrice?: number;        // 45 (optional, for strikethrough)

  // Inventory
  condition: "NM" | "LP" | "MP" | "HP" | "DMG";
  stock?: number;                // undefined or 1 = single copy; >1 = duplicates
  status: "available" | "sold" | "reserved" | "hidden";

  // Metadata
  addedAt?: string;              // ISO date — used for "Recently added" sort
}
```

**Currency**: stored as `number`; symbol/locale set once in `clients/pokemon-fables/config.json` (default `"USD"`). All filtering/sorting uses the number directly.

**Status rules**:
- `available` (default) — listed for sale, normal display
- `sold` — grayed-out with SOLD badge, no Buy button, still in grid for social proof
- `reserved` — lighter gray + RESERVED badge, no Buy button (held for a buyer who's DM'd)
- `hidden` — admin draft, not rendered on `/cards` (visible only in admin)

`stock` is independent of `status`. A card with `stock: 3, status: "available"` shows "3 available" badge. Setting `status: "sold"` overrides regardless of stock count.

**Example entry**:
```json
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
}
```

---

## UI — Grid, Filter, Sort, Group, Search

### Page structure

```
[Header]
  All Cards · 487 available · 13 sold
  [Sort ▾]  [Group ▾]

[Filter bar — sticky desktop sidebar | mobile bottom drawer]
  [Search input]
  Type:       [Fire] [Water] [Grass] ...
  Set:        [VSTAR Universe] [Crown Zenith] ...
  Year:       [2024] [2023] [2022] ...
  Condition:  [NM] [LP] [MP] ...
  Rarity:     [SAR] [Holo] [Common] ...
  Status:     ⦿ Available only  ○ Include sold
  [Clear all filters]

[Card grid — responsive columns]
```

### Card thumbnail

- Lazy-loaded image (`loading="lazy"`)
- Name + set + year below
- Price: `~~$45~~ $30` (strikethrough original first, bold sale price second — standard Western convention)
- **Rarity tag** in top-right corner, color-coded (SAR=gold, Holo=silver, Common=muted)
- **Status badges** (top-left):
  - `SOLD` (gray overlay + badge, fully grayed out)
  - `RESERVED` (lighter gray + badge)
  - `N AVAILABLE` (only if `stock > 1`)
  - `📖 Story` (when card name matches an episode card; links to the episode)
- Hover (desktop): subtle lift + shadow via existing `.hover-lift` utility
- Tap/click → opens enlarged view (see § Enlarge Interaction below)

### Filter UI

- **Desktop**: sticky left sidebar, full filter panel
- **Mobile**: hidden by default; "Filter" button at top opens bottom drawer

Filter types:
- **Search** (debounced 200ms; matches name + set + artist; updates URL `?q=`)
- **Type, Set, Year, Condition, Rarity**: multi-select chip groups; multiple chips within a group OR together; chips across groups AND together
- **Status**: defaults "Available only"; toggle "Include sold" surfaces sold cards as social proof; "Hidden" never visible publicly; "Reserved" treated like Available for visibility
- **"Clear all filters"**: visible when any filter is active

All filter state reflects in URL params for shareable, bookmarkable filtered views.

### Sort dropdown (top right of header)

- **Recently added** (newest first) — default
- Price: low to high
- Price: high to low
- Rarity: rare first

### Group dropdown (next to sort)

- **None** (flat grid) — default
- **By Year** (collapsible sections per year, desc)
- **By Set** (collapsible sections per set)

When grouped, sort applies within each group. Group headings show count: "VSTAR Universe (42 cards)".

### Performance

- All ~500 cards rendered in DOM, no pagination — modern browsers handle this well
- `loading="lazy"` on every `<img>` so only nearby thumbnails fetch eagerly
- Filtering/sorting/grouping done client-side (instant)
- Filter state derived from URL on mount; mutations push state to URL (history-friendly back button)

### Responsive grid

| Viewport | Columns |
|---|---|
| <640px | 1 |
| 640-768 | 2 |
| 768-1024 | 3 |
| 1024-1280 | 4 |
| >1280 | 5+ |

---

## Enlarge Interaction

### Desktop: floating overlay (click to open, mouseleave to close)

Click thumbnail → enlarged "card detail" panel pops out as a **floating overlay** positioned near the thumbnail (not a centered modal — keeps spatial connection to where the user clicked).

**Layout**:
```
┌──────────────────────────┐
│ [larger image ~280x392]  │
│                          │
│ Charizard V (SAR)        │
│ VSTAR Universe · 2022    │
│ NM · SAR · Oswaldo KATO  │
│                          │
│ Description (1-3 lines)  │
│                          │
│ ~~$45~~  $30             │
│                          │
│ [Message me to buy ↗]    │
│ 📖 Read the story →      │
└──────────────────────────┘
```

**Behavior**:
- Click thumbnail → overlay fades in next to it (~200ms ease-out)
- Smart positioning: prefers right-of-thumbnail; flips left if near right edge; flips above if near bottom of viewport
- Mouse leaves overlay → fades out + collapses
- Click anywhere outside or scroll the page → also closes (defensive)
- One overlay open at a time
- Width: ~360px (about 2× thumbnail). Image inside ~280×392.
- The original thumbnail stays in place; nothing in the grid shifts

**Fallback**: viewport width <1024px OR no hover capability → use mobile modal instead.

### Mobile: full-screen modal

Tap thumbnail → backdrop fade in + modal slide up from bottom (300ms).

**Layout** (mobile-optimized vertical):
```
┌──────────────────┐ ← sticky × in top-right
│  [LARGE image,   │
│   fills width,   │
│   2.5/3.5 aspect]│
├──────────────────┤
│ Charizard V (SAR)│
│ VSTAR Universe   │
│ 2022 · NM · SAR  │
│ ──────────────── │
│ Description...   │
│ ──────────────── │
│ ~~$45~~ $30      │
│                  │
│ ┌──────────────┐ │
│ │Message me ↗  │ │
│ └──────────────┘ │
│ 📖 Read story →  │
└──────────────────┘
```

**Behavior**:
- Tap backdrop, tap ×, or swipe down → close
- Body scroll locked while open
- Reuses the same detail content as the desktop overlay (one component, two render styles)

### Buy CTA — Messenger flow

The Buy button links to `https://m.me/cardfables?ref=<card-id>`.

**Honest caveat**: the `?ref=` parameter is for Facebook's analytics, **not** message pre-fill — m.me doesn't support pre-populating the chat input.

**Mitigation**: when the Buy button is clicked, **also copy a pre-formatted message to the clipboard** before navigating:
```
Hi! I'm interested in: Charizard V (SAR) — VSTAR Universe (2022) — $30
```
Plus a brief toast: "Message copied — paste into Messenger". User taps paste in the chat input. Faster than typing, especially for cards with long names.

### Reduced motion

`prefers-reduced-motion: reduce` → skip scale/slide animations; opacity fade only. Same pattern as the visual-polish pass.

---

## Admin Tooling

### `/admin/cards` page

Modeled after `/admin/shop`. List view + per-card edit + bulk operations.

**List view**:
- Compact rows: thumbnail (40×56), name, set/year, price (current + strikethrough original), condition, status badge, stock count
- Sticky header with: search bar, filter chips (status, set, year), "+ Add card", "Import CSV", "Export CSV"
- Status badges color-coded: green=available, gray=sold, yellow=reserved, dotted=hidden
- Click row → expands inline edit form

**Quick actions per row** (no edit form needed):
- ⚡ "Mark Sold" / "Mark Available" toggle (1 tap, auto-saves)
- 🚧 "Reserve" toggle
- ✏️ Edit full → expands inline form

**Full edit form**:
- All schema fields editable
- Image upload via existing upload pattern (saves to `public/images/cards-collection/<id>.jpg`)
- Save commits to GitHub via existing API pattern
- "Delete" button → confirm → removes entry from JSON + deletes image file

### Bulk CSV import

Critical for the initial 500-card load.

**CSV format** (header row + data rows):
```csv
id,name,set,setNumber,year,type,rarity,artist,image,description,price,originalPrice,condition,stock,status
charizard-v-sar-vstar-universe,Charizard V (SAR),VSTAR Universe,018/172,2022,Fire,SAR,Oswaldo KATO,/images/cards-collection/charizard-v-sar.jpg,Special Art Rare.,30,45,NM,1,available
```

**Required columns**: `name`, `price`, `condition`. All others optional.

**Auto-fill rules** (when import sees empty cells):
- Empty `id` → `slugify(name + "-" + set)` → e.g., `charizard-v-sar-vstar-universe`
- Empty `status` → `"available"`
- Empty `stock` → `1`
- Empty `addedAt` → today's date (set at import time)
- Empty `image` → warning, not error (rendered with emoji fallback in grid)

**Preview screen** before commit:
```
[Preview]
- 487 new cards
- 13 updates (matched by id)
- 5 errors:
  • Row 23: missing required "name"
  • Row 88: invalid condition "Excellent" (must be NM/LP/MP/HP/DMG)
- 14 warnings:
  • 13 cards have no image — will show emoji fallback
  • 1 card has price 0
[Cancel] [Import 487 + 13]
```

Errors block import; warnings don't. Confirm → single GitHub commit writes the new `cards-collection.json`.

### CSV export

"Export CSV" downloads current state as CSV (same format). Use cases: backups, bulk-edit in a spreadsheet then re-import, audit prices over time.

### Image management

For the first batch of 500: owner uploads images to `public/images/cards-collection/` via git directly, OR via the per-card admin upload one-at-a-time. CSV references images by path.

**Image fallback**: cards without an image render the existing emoji-on-gradient placeholder (same as episode thumbnails). No broken images.

### API routes

New endpoints under `src/app/api/cards/`:
- `GET /api/cards` — list (admin only, behind session cookie)
- `POST /api/cards` — create one
- `PUT /api/cards/[id]` — update one
- `DELETE /api/cards/[id]` — delete one + cleanup image
- `POST /api/cards/import` — bulk CSV import (parse + validate + write)
- `GET /api/cards/export` — CSV download
- `POST /api/cards/upload-image` — single card image upload

All gated by the existing `ADMIN_PASSWORD` session cookie. All write paths commit to GitHub via `src/lib/github.ts`.

### Admin nav integration

Add "Cards" entry to the admin sidebar between Shop and Series. Selected-series context not needed (cards are per-client, not per-series).

---

## Out of Scope (explicit non-goals)

- **Per-card detail pages** (`/cards/[slug]`) — desktop overlay + mobile modal cover the v1 detail UX. Defer to a follow-up spec for SEO surface expansion.
- Wishlist / save-for-later (would require auth flow)
- Sale countdown timers, urgency banners
- Reviews / testimonials
- Bundle pricing ("buy 3 from same set, save 10%")
- Bulk image upload tool (v1 uses git for first batch, per-card upload for ongoing)
- Multi-currency (single currency from config)
- Payment processing on the site (Messenger handles checkout)
- Auto-sync with FB inventory
- Auto-import on a schedule

---

## Implementation Sequencing

For the writing-plans skill to consume. Each step is shippable independently.

1. **Data foundation** — schema additions in `types.ts`, `cards-collection.json` stub, `build-data.js` extension, `data.ts` exports `CARDS`
2. **Helper library** — `cardsCollection.ts` (filter, sort, group, search, slug, episode-link) with vitest unit tests
3. **`/cards` page MVP** — grid with all cards, no filters yet, sort dropdown only
4. **Filters + search + group** — layered onto the MVP grid; URL state sync
5. **Card detail overlay** — `CardDetailOverlay` (desktop overlay + mobile modal); clipboard pre-fill
6. **Cross-link with episodes** — auto-detect by name match; "📖 Story" badge + link
7. **`/admin/cards` CRUD** — list, edit, create, delete (single-card)
8. **CSV import + export** — bulk operations + preview screen
9. **Polish + verification** — navbar entry, sitemap entry, manual browser walk-through

Each step results in a working surface. The owner can pause after any step and have something demoable.

---

## File Structure

| File | Status | Layer | Responsibility |
|---|---|---|---|
| `clients/pokemon-fables/cards-collection.json` | new | data | Source of truth for ~500 cards |
| `clients/pokemon-fables/config.json` | modify | data | Add `currency: "USD"` field |
| `src/lib/types.ts` | modify | types | Add `CardCollectionEntry` interface |
| `src/lib/data.ts` | modify (auto) | data | Export `CARDS` (from build script) |
| `scripts/build-data.js` | modify | build | Read `cards-collection.json` |
| `src/lib/cardsCollection.ts` | new | helpers | Filter, sort, group, search, episode-link |
| `src/lib/cardsCollection.test.ts` | new | tests | Vitest unit tests for helpers + CSV parser |
| `src/app/cards/page.tsx` | new | route | The `/cards` page (server component) |
| `src/components/cards/CardCollectionGrid.tsx` | new | UI | Client component with filter/sort state |
| `src/components/cards/CardCollectionItem.tsx` | new | UI | Thumbnail + badges + click handler |
| `src/components/cards/CardCollectionFilters.tsx` | new | UI | Filter bar (sidebar / drawer) |
| `src/components/cards/CardDetailOverlay.tsx` | new | UI | Enlarged view (desktop overlay + mobile modal) |
| `src/app/admin/cards/page.tsx` | new | admin | List + edit + import UI |
| `src/app/api/cards/route.ts` | new | API | GET list, POST create |
| `src/app/api/cards/[id]/route.ts` | new | API | PUT update, DELETE delete |
| `src/app/api/cards/import/route.ts` | new | API | POST bulk CSV import |
| `src/app/api/cards/export/route.ts` | new | API | GET CSV download |
| `src/app/api/cards/upload-image/route.ts` | new | API | POST single-card image upload |
| `src/components/layout/Navbar.tsx` | modify | nav | Add "Cards" link (between Shop and Submit) |
| `src/app/admin/context.tsx` or layout | modify | admin nav | Add "Cards" sidebar entry |
| `src/app/sitemap.ts` | modify | SEO | Add `/cards` |

---

## Testing

- **Pure helpers in `cardsCollection.ts`** → full vitest coverage:
  - Filter combinations (single, multi, cross-group AND/OR)
  - Sort orders (price asc/desc, recently-added, rarity)
  - Group keys (by year, by set)
  - CSV parse + validate (valid, missing-required, invalid-enum, malformed)
  - Slug generation (collision handling)
  - Episode linking (exact match, short-name match, no match)
- **API routes** → smoke tests for happy path + auth gate
- **UI** → manual browser walk-through with the user (no UI test framework currently in this project)
- **CSV import** → fixture-based parser/validator tests

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| 500 thumbnails strain initial page load | `loading="lazy"` on every image; modern browsers handle 500 lazy-loaded images cleanly |
| Filter state gets messy in URL with many active filters | Use minimal param encoding (`?type=Fire,Water&year=2022,2023`) — readable + bookmark-friendly |
| Card name collisions break episode auto-linking | Helper returns first match; flag duplicates in admin warnings; rare in practice |
| Owner edits cards-collection.json directly in git, bypassing admin | Admin reads from GitHub on each operation; manual edits respected (single source of truth) |
| CSV import overwrites existing cards by accident | Preview screen shows updates vs new; user confirms before commit |
| Messenger clipboard pre-fill doesn't work on iOS Safari (permission) | Soft-fail: navigate to m.me anyway; user types manually |
| Mobile users without Messenger app installed | m.me link opens Messenger web in browser; works without app |

---

## Open Questions (None blocking)

- Currency display format: `$30` vs `USD 30` vs `30 USD`? Default to `$30` (USD locale) but make formatter swap-friendly when a non-USD currency is configured.
- "Recently added" sort tie-break: by id alphabetically (stable).
- Hover overlay edge case: thumbnail at viewport bottom-right corner where overlay can't fit anywhere — fall through to mobile modal style as the third fallback.
