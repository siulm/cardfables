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

    // Status filter (default: include all non-hidden)
    const statusFilter = filters.status ?? "include-sold";
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
