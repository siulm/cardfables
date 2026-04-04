import { describe, it } from "node:test";
import { strict as assertStrict } from "node:assert";

const { parseArgs, slugify, mergeBibleUpdates } = await import("./generate-episode.js");

// ── parseArgs ──────────────────────────────────────────────

describe("parseArgs", () => {
  // parseArgs receives process.argv.slice(2) — the args after `node script.js`

  it("parses client name and one image path", () => {
    const result = parseArgs(["pokemon-fables", "card1.jpg"]);
    assertStrict.deepStrictEqual(result, {
      clientName: "pokemon-fables",
      imagePaths: ["card1.jpg"],
    });
  });

  it("parses client name and three image paths", () => {
    const result = parseArgs(["pokemon-fables", "a.jpg", "b.png", "c.jpg"]);
    assertStrict.deepStrictEqual(result, {
      clientName: "pokemon-fables",
      imagePaths: ["a.jpg", "b.png", "c.jpg"],
    });
  });

  it("throws when no arguments provided", () => {
    assertStrict.throws(() => parseArgs([]), {
      message: /Usage:/,
    });
  });

  it("throws when no image paths provided", () => {
    assertStrict.throws(() => parseArgs(["pokemon-fables"]), {
      message: /at least 1/i,
    });
  });

  it("throws when more than 3 image paths provided", () => {
    assertStrict.throws(
      () => parseArgs(["client", "a.jpg", "b.jpg", "c.jpg", "d.jpg"]),
      { message: /at most 3/i }
    );
  });
});

// ── slugify ────────────────────────────────────────────────

describe("slugify", () => {
  it("lowercases and hyphenates a title", () => {
    assertStrict.equal(
      slugify("The Nap That Changed Everything"),
      "the-nap-that-changed-everything"
    );
  });

  it("strips non-alphanumeric characters", () => {
    assertStrict.equal(
      slugify("Who's Afraid of the Big Bad Wolf?"),
      "whos-afraid-of-the-big-bad-wolf"
    );
  });

  it("collapses multiple hyphens", () => {
    assertStrict.equal(slugify("Hello   World"), "hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    assertStrict.equal(slugify("  Hello World  "), "hello-world");
  });
});

// ── mergeBibleUpdates ──────────────────────────────────────

describe("mergeBibleUpdates", () => {
  it("updates last_episode and current_plot", () => {
    const bible = {
      show_title: "Test Show",
      last_episode: 2,
      characters: [],
      current_plot: "old plot",
      setting: "Test",
      running_themes: [],
    };
    const updates = {
      last_episode: 3,
      current_plot: "new plot",
      new_characters: [],
      new_themes: [],
    };
    const result = mergeBibleUpdates(bible, updates);
    assertStrict.equal(result.last_episode, 3);
    assertStrict.equal(result.current_plot, "new plot");
  });

  it("appends new characters", () => {
    const bible = {
      show_title: "Test",
      last_episode: 1,
      characters: [{ name: "A", card: "A Card", role: "hero" }],
      current_plot: "plot",
      setting: "Test",
      running_themes: [],
    };
    const updates = {
      last_episode: 2,
      current_plot: "plot",
      new_characters: [{ name: "B", card: "B Card", role: "villain" }],
      new_themes: [],
    };
    const result = mergeBibleUpdates(bible, updates);
    assertStrict.equal(result.characters.length, 2);
    assertStrict.equal(result.characters[1].name, "B");
  });

  it("appends new themes without duplicates", () => {
    const bible = {
      show_title: "Test",
      last_episode: 1,
      characters: [],
      current_plot: "plot",
      setting: "Test",
      running_themes: ["theme A"],
    };
    const updates = {
      last_episode: 2,
      current_plot: "plot",
      new_characters: [],
      new_themes: ["theme A", "theme B"],
    };
    const result = mergeBibleUpdates(bible, updates);
    assertStrict.deepStrictEqual(result.running_themes, [
      "theme A",
      "theme B",
    ]);
  });

  it("preserves show_title and setting", () => {
    const bible = {
      show_title: "My Show",
      last_episode: 1,
      characters: [],
      current_plot: "old",
      setting: "Valley",
      running_themes: [],
    };
    const updates = {
      last_episode: 2,
      current_plot: "new",
      new_characters: [],
      new_themes: [],
    };
    const result = mergeBibleUpdates(bible, updates);
    assertStrict.equal(result.show_title, "My Show");
    assertStrict.equal(result.setting, "Valley");
  });
});
