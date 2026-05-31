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
  formatPrice,
  isComingSoon,
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

  it("update row preserves existing fields absent from CSV (status not wiped)", () => {
    const soldCard: CardCollectionEntry = {
      ...baseCard,
      status: "sold",
      addedAt: "2024-01-15",
    };
    // CSV row omits status and addedAt — only updates price
    const result = validateCSVRows(
      [
        {
          id: soldCard.id,
          name: soldCard.name,
          set: soldCard.set,
          year: String(soldCard.year),
          type: soldCard.type,
          rarity: soldCard.rarity,
          price: "99",
          condition: soldCard.condition,
          // status intentionally absent
          // addedAt intentionally absent
        },
      ],
      [soldCard]
    );
    expect(result.rows[0].action).toBe("update");
    expect(result.rows[0].entry?.status).toBe("sold");
    expect(result.rows[0].entry?.addedAt).toBe("2024-01-15");
    expect(result.rows[0].entry?.price).toBe(99);
  });

  it("update row with empty status cell preserves existing status", () => {
    const soldCard: CardCollectionEntry = {
      ...baseCard,
      status: "sold",
    };
    const result = validateCSVRows(
      [
        {
          id: soldCard.id,
          name: soldCard.name,
          set: soldCard.set,
          year: String(soldCard.year),
          type: soldCard.type,
          rarity: soldCard.rarity,
          price: "50",
          condition: soldCard.condition,
          status: "", // empty string = column present but blank → preserve existing
        },
      ],
      [soldCard]
    );
    expect(result.rows[0].action).toBe("update");
    expect(result.rows[0].entry?.status).toBe("sold");
  });
});

describe("formatPrice", () => {
  it("drops decimals when the price is a whole number", () => {
    expect(formatPrice(27)).toBe("$27");
    expect(formatPrice(27.0)).toBe("$27");
  });
  it("shows cents when the price has a fractional part", () => {
    expect(formatPrice(3.5)).toBe("$3.50");
    expect(formatPrice(0.9)).toBe("$0.90");
    expect(formatPrice(19.8)).toBe("$19.80");
  });
  it("respects the currency", () => {
    expect(formatPrice(5, "EUR")).toBe("€5");
  });
});

describe("isComingSoon", () => {
  it("is true when price is missing or zero", () => {
    expect(isComingSoon({ price: 0 })).toBe(true);
    expect(isComingSoon({})).toBe(true);
    expect(isComingSoon({ price: undefined })).toBe(true);
  });
  it("is false when there is a real price (including under $1)", () => {
    expect(isComingSoon({ price: 0.9 })).toBe(false);
    expect(isComingSoon({ price: 27 })).toBe(false);
  });
});

describe("filterCards — language", () => {
  const en = { ...baseCard, id: "en-card" };
  const jp = { ...baseCard, id: "jp-card", language: "jp" as const };
  it("treats cards without a language as English", () => {
    expect(filterCards([en, jp], { language: "en" }).map((c) => c.id)).toEqual(["en-card"]);
  });
  it("shows only Japanese cards when jp is selected", () => {
    expect(filterCards([en, jp], { language: "jp" }).map((c) => c.id)).toEqual(["jp-card"]);
  });
});
