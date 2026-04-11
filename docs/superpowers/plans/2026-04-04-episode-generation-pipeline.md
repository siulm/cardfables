# Episode Generation Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a CLI script that takes card images, generates dual-age stories via Claude's vision API, and outputs structured episode JSON with story bible updates.

**Architecture:** Single Node.js script (`scripts/generate-episode.js`) reads client config + story bible, encodes images, calls Claude Sonnet 4.6 with a structured prompt, parses the JSON response, writes the episode file, and updates the story bible. All domain-specific content comes from config files, not hardcoded values.

**Tech Stack:** Node.js, `@anthropic-ai/sdk`, `fs/path/process` built-ins. pnpm for package management (matches existing repo).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `scripts/generate-episode.js` | Create | CLI entry point — orchestrates the full pipeline |
| `clients/pokemon-fables/config.json` | Create | Client config: API key, brand, tone, audiences |
| `clients/pokemon-fables/story-bible.json` | Create | Persistent story state seeded from episodes 1–2 |
| `clients/pokemon-fables/episodes/.gitkeep` | Create | Empty episodes directory |
| `scripts/generate-episode.test.js` | Create | Tests for argument parsing, bible merge, slug generation |
| `package.json` | Modify | Add `@anthropic-ai/sdk` dependency |

---

### Task 1: Initialize Git Repo and Install SDK

**Files:**
- Modify: `package.json` (add `@anthropic-ai/sdk`)

This task initializes the local repo from the existing GitHub remote and adds the Anthropic SDK.

- [ ] **Step 1: Clone the existing repo into the working directory**

The repo exists on GitHub at `siulm/cardfables` but the local working directory only has the project brief. Initialize from the remote:

```bash
cd /Users/lm/repos/cardfables
git init
git remote add origin https://github.com/siulm/cardfables.git
git fetch origin
git reset --hard origin/main
```

- [ ] **Step 2: Install the Anthropic SDK**

```bash
cd /Users/lm/repos/cardfables
pnpm add @anthropic-ai/sdk
```

- [ ] **Step 3: Enable ES modules**

The script uses `import` syntax. Add `"type": "module"` to `package.json` (after `"main": "index.js"`). Next.js works fine with this setting.

- [ ] **Step 4: Verify installation**

```bash
node -e "import('@anthropic-ai/sdk').then(m => console.log('SDK loaded:', typeof m.default))"
```

Expected: `SDK loaded: function`

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add @anthropic-ai/sdk dependency and enable ES modules"
```

---

### Task 2: Create Client Directory and Seed Files

**Files:**
- Create: `clients/pokemon-fables/config.json`
- Create: `clients/pokemon-fables/story-bible.json`
- Create: `clients/pokemon-fables/episodes/.gitkeep`

- [ ] **Step 1: Create the client directory structure**

```bash
mkdir -p clients/pokemon-fables/episodes
touch clients/pokemon-fables/episodes/.gitkeep
```

- [ ] **Step 2: Create config.json**

Create `clients/pokemon-fables/config.json`:

```json
{
  "brand": "Flames of Our Lives",
  "tone": "soap opera, dramatic, funny, age-appropriate",
  "audience_junior": "ages 6-11",
  "audience_full": "ages 12+",
  "output_format": "dual-age episode",
  "anthropic_api_key": "YOUR_API_KEY_HERE",
  "amazon_affiliate_tag": "their-tag-20",
  "deployment": "vercel"
}
```

- [ ] **Step 3: Create story-bible.json**

Create `clients/pokemon-fables/story-bible.json` seeded with the state after episode 2 (from the project brief):

```json
{
  "show_title": "Flames of Our Lives",
  "last_episode": 2,
  "characters": [
    { "name": "Charizard", "card": "Charizard V", "role": "reluctant hero, secretly kind" },
    { "name": "Venusaur", "card": "N/A", "role": "skeptical neighbor, growing to care" },
    { "name": "Mismagius", "card": "Mismagius ex", "role": "dramatic observer, reluctant hero" },
    { "name": "Genesect", "card": "Genesect V", "role": "antagonist, approaching from north" }
  ],
  "current_plot": "Genesect is heading toward the northern caves where Charizard secretly shelters baby Pokemon. Venusaur and Mismagius are racing to warn him.",
  "setting": "Verdant Valley",
  "running_themes": [
    "Charizard secretly helps everyone but is too proud to admit it",
    "Venusaur is judgmental but genuinely cares",
    "Mismagius observes and comments, resists heroism"
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add clients/
git commit -m "feat: add pokemon-fables client directory with config and story bible"
```

---

### Task 3: Write Tests for Utility Functions

**Files:**
- Create: `scripts/generate-episode.test.js`

Before writing the main script, write tests for the three pure-logic pieces: argument parsing, slug generation, and bible merging.

- [ ] **Step 1: Write tests**

Create `scripts/generate-episode.test.js`:

```js
import { describe, it, assert } from "node:test";
import { strict as assertStrict } from "node:assert";

// ── parseArgs ──────────────────────────────────────────────

describe("parseArgs", () => {
  // parseArgs receives process.argv.slice(2) — the args after `node script.js`
  const { parseArgs } = await import("./generate-episode.js");

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
  const { slugify } = await import("./generate-episode.js");

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
  const { mergeBibleUpdates } = await import("./generate-episode.js");

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test scripts/generate-episode.test.js
```

Expected: All tests fail because `generate-episode.js` doesn't exist yet.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-episode.test.js
git commit -m "test: add tests for parseArgs, slugify, and mergeBibleUpdates"
```

---

### Task 4: Implement Utility Functions

**Files:**
- Create: `scripts/generate-episode.js`

Implement the three exported functions that the tests exercise. The main pipeline logic comes in the next task.

- [ ] **Step 1: Create generate-episode.js with utility functions**

Create `scripts/generate-episode.js`:

```js
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

// ── Utility functions (exported for testing) ───────────────

export function parseArgs(args) {
  if (args.length === 0) {
    throw new Error(
      "Usage: node scripts/generate-episode.js <client-name> <image1> [image2] [image3]"
    );
  }

  const clientName = args[0];
  const imagePaths = args.slice(1);

  if (imagePaths.length < 1) {
    throw new Error("You must provide at least 1 image path.");
  }
  if (imagePaths.length > 3) {
    throw new Error("You may provide at most 3 image paths.");
  }

  return { clientName, imagePaths };
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function mergeBibleUpdates(bible, updates) {
  const merged = { ...bible };

  merged.last_episode = updates.last_episode;
  merged.current_plot = updates.current_plot;

  if (updates.new_characters && updates.new_characters.length > 0) {
    merged.characters = [...bible.characters, ...updates.new_characters];
  }

  if (updates.new_themes && updates.new_themes.length > 0) {
    const existingThemes = new Set(bible.running_themes);
    const deduped = updates.new_themes.filter(
      (theme) => !existingThemes.has(theme)
    );
    merged.running_themes = [...bible.running_themes, ...deduped];
  }

  return merged;
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
node --test scripts/generate-episode.test.js
```

Expected: All 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-episode.js
git commit -m "feat: implement parseArgs, slugify, and mergeBibleUpdates utilities"
```

---

### Task 5: Implement the System Prompt Builder

**Files:**
- Modify: `scripts/generate-episode.js` (add `buildSystemPrompt` function)
- Modify: `scripts/generate-episode.test.js` (add test)

- [ ] **Step 1: Write the test**

Append to `scripts/generate-episode.test.js`:

```js
// ── buildSystemPrompt ──────────────────────────────────────

describe("buildSystemPrompt", () => {
  const { buildSystemPrompt } = await import("./generate-episode.js");

  it("includes brand, tone, and audience in the prompt", () => {
    const config = {
      brand: "Test Brand",
      tone: "dramatic, funny",
      audience_junior: "ages 6-11",
      audience_full: "ages 12+",
      output_format: "dual-age episode",
    };
    const prompt = buildSystemPrompt(config);
    assertStrict.ok(prompt.includes("Test Brand"));
    assertStrict.ok(prompt.includes("dramatic, funny"));
    assertStrict.ok(prompt.includes("ages 6-11"));
    assertStrict.ok(prompt.includes("ages 12+"));
  });

  it("includes JSON schema instructions", () => {
    const config = {
      brand: "X",
      tone: "x",
      audience_junior: "x",
      audience_full: "x",
      output_format: "x",
    };
    const prompt = buildSystemPrompt(config);
    assertStrict.ok(prompt.includes('"episode"'));
    assertStrict.ok(prompt.includes('"bible_updates"'));
  });

  it("includes story format rules", () => {
    const config = {
      brand: "X",
      tone: "x",
      audience_junior: "x",
      audience_full: "x",
      output_format: "x",
    };
    const prompt = buildSystemPrompt(config);
    assertStrict.ok(prompt.includes("600"));
    assertStrict.ok(prompt.includes("900"));
    assertStrict.ok(prompt.includes("300"));
    assertStrict.ok(prompt.includes("500"));
  });
});
```

- [ ] **Step 2: Run tests to verify the new tests fail**

```bash
node --test scripts/generate-episode.test.js
```

Expected: The three new `buildSystemPrompt` tests fail; existing tests still pass.

- [ ] **Step 3: Implement buildSystemPrompt**

Add this function to `scripts/generate-episode.js` after the existing utility functions:

```js
export function buildSystemPrompt(config) {
  return `You are a story writer for "${config.brand}".

Tone: ${config.tone}
Output format: ${config.output_format}

You will receive 1-3 trading card images and a story bible with existing characters, plot, and themes. Analyze the card art — the Pokémon, scene, mood, and any text visible — then write the next episode continuing the ongoing story.

## Story Format

Write TWO versions of the same episode:

### Full Fables (${config.audience_full})
- Scene directions in brackets: [Scene opens on...]
- Inner monologue and emotional depth
- Character dialogue with speaker attribution
- Cliffhanger ending: "To be continued..."
- 600–900 words

### Junior Fables (${config.audience_junior})
- Same plot, same characters, same cliffhanger
- Short punchy sentences
- Sound effects: CRUNCH. SNAP.
- More action, less inner monologue
- 300–500 words

## Output Format

Return ONLY valid JSON with this exact structure (no markdown, no code fences):

{
  "episode": {
    "id": <next episode number>,
    "slug": "<title-lowercased-and-hyphenated>",
    "title": "<episode title>",
    "cards": [
      {
        "name": "<card name and set info visible on the card>",
        "set": "<set name if visible>",
        "artist": "<artist name if visible>",
        "emoji": "<one emoji that fits the card>"
      }
    ],
    "status": "live",
    "junior": {
      "scene": "<one-line scene description>",
      "paragraphs": [
        { "t": "p", "c": "<narrative paragraph>" },
        { "t": "q", "speaker": "<Character Name>", "c": "<dialogue in quotes>" },
        { "t": "a", "c": "<action or scene direction>" },
        { "t": "end", "c": "To be continued..." }
      ]
    },
    "full": {
      "scene": "<one-line scene description>",
      "paragraphs": [
        { "t": "p", "c": "<narrative paragraph>" },
        { "t": "q", "speaker": "<Character Name>", "c": "<dialogue in quotes>" },
        { "t": "a", "c": "<action or scene direction>" },
        { "t": "end", "c": "To be continued..." }
      ]
    }
  },
  "bible_updates": {
    "new_characters": [
      { "name": "<name>", "card": "<card name>", "role": "<role description>" }
    ],
    "current_plot": "<updated plot state including cliffhanger>",
    "new_themes": ["<any new running themes>"],
    "last_episode": <episode number>
  }
}

Story block types:
- "p" = narrative paragraph
- "q" = dialogue (MUST include "speaker" field)
- "a" = action/scene direction
- "end" = cliffhanger ending (always "To be continued...")

Each story MUST end with a block of type "end".`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
node --test scripts/generate-episode.test.js
```

Expected: All 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-episode.js scripts/generate-episode.test.js
git commit -m "feat: add buildSystemPrompt function with story format rules and JSON schema"
```

---

### Task 6: Implement the Main Pipeline

**Files:**
- Modify: `scripts/generate-episode.js` (add `main` function and image encoding)

This is the core orchestration: read files, encode images, call Claude, write output, update bible.

- [ ] **Step 1: Add image encoding and main pipeline function**

Add these functions to the bottom of `scripts/generate-episode.js`:

```js
function encodeImage(imagePath) {
  const absolutePath = resolve(imagePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Image not found: ${absolutePath}`);
  }
  const data = readFileSync(absolutePath);
  const ext = extname(absolutePath).toLowerCase();
  const mediaTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  const mediaType = mediaTypes[ext];
  if (!mediaType) {
    throw new Error(
      `Unsupported image format: ${ext}. Use .jpg, .jpeg, .png, .gif, or .webp`
    );
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: data.toString("base64"),
    },
  };
}

async function main() {
  const { clientName, imagePaths } = parseArgs(process.argv.slice(2));

  // Resolve paths
  const clientDir = join(process.cwd(), "clients", clientName);
  const configPath = join(clientDir, "config.json");
  const biblePath = join(clientDir, "story-bible.json");
  const episodesDir = join(clientDir, "episodes");

  // Read config
  if (!existsSync(configPath)) {
    console.error(`Error: config.json not found for client '${clientName}'`);
    console.error(`Expected at: ${configPath}`);
    process.exit(1);
  }
  const config = JSON.parse(readFileSync(configPath, "utf-8"));

  // Read story bible
  if (!existsSync(biblePath)) {
    console.error(
      `Error: story-bible.json not found for client '${clientName}'`
    );
    console.error(`Expected at: ${biblePath}`);
    process.exit(1);
  }
  const bible = JSON.parse(readFileSync(biblePath, "utf-8"));

  // Encode images
  console.log(`Encoding ${imagePaths.length} image(s)...`);
  const imageBlocks = imagePaths.map((p) => encodeImage(p));

  // Build the API request
  const systemPrompt = buildSystemPrompt(config);
  const nextEpisode = bible.last_episode + 1;

  const userContent = [
    ...imageBlocks,
    {
      type: "text",
      text: `Here is the current story bible:\n\n${JSON.stringify(bible, null, 2)}\n\nAnalyze the card image(s) above and write episode ${nextEpisode}. Continue the ongoing story based on the bible context. The new card(s) should introduce or develop characters and advance the plot.`,
    },
  ];

  // Call Claude
  console.log(
    `Calling Claude (claude-sonnet-4-6) for episode ${nextEpisode}...`
  );
  const client = new Anthropic({ apiKey: config.anthropic_api_key });
  let response;
  try {
    response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });
  } catch (err) {
    console.error(`API call failed: ${err.message}`);
    process.exit(1);
  }

  // Parse response
  const responseText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error("Failed to parse Claude response as JSON.");
    console.error("Raw response:");
    console.error(responseText);
    process.exit(1);
  }

  // Validate response has required fields
  if (!parsed.episode || !parsed.bible_updates) {
    console.error(
      "Response missing required fields (episode, bible_updates)."
    );
    console.error("Parsed response:");
    console.error(JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  // Ensure slug is set
  if (!parsed.episode.slug) {
    parsed.episode.slug = slugify(parsed.episode.title);
  }

  // Write episode file
  mkdirSync(episodesDir, { recursive: true });
  const episodeFile = join(episodesDir, `episode-${nextEpisode}.json`);
  writeFileSync(episodeFile, JSON.stringify(parsed.episode, null, 2));
  console.log(`Wrote: ${episodeFile}`);

  // Update story bible
  const updatedBible = mergeBibleUpdates(bible, parsed.bible_updates);
  writeFileSync(biblePath, JSON.stringify(updatedBible, null, 2));
  console.log(`Updated: ${biblePath}`);

  // Summary
  console.log("\n--- Episode Summary ---");
  console.log(`Episode: ${parsed.episode.id}`);
  console.log(`Title: ${parsed.episode.title}`);
  console.log(`Slug: ${parsed.episode.slug}`);
  console.log(
    `Cards: ${parsed.episode.cards.map((c) => c.name).join(", ")}`
  );
  console.log(`Junior paragraphs: ${parsed.episode.junior.paragraphs.length}`);
  console.log(`Full paragraphs: ${parsed.episode.full.paragraphs.length}`);
  console.log(
    `New characters: ${parsed.bible_updates.new_characters.length}`
  );
  console.log("Done!");
}

// Run main only when executed directly (not imported for tests)
const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(process.argv[1], "file://").href;

if (isMainModule) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Run existing tests to verify nothing broke**

```bash
node --test scripts/generate-episode.test.js
```

Expected: All 14 tests still pass.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-episode.js
git commit -m "feat: implement main episode generation pipeline with Claude API call"
```

---

### Task 7: Verify CLI Error Handling End-to-End

**Files:** None (manual verification of existing code)

- [ ] **Step 1: Verify no-args usage error**

```bash
node scripts/generate-episode.js 2>&1; echo "Exit code: $?"
```

Expected: Prints the usage error message and exits with code 1.

- [ ] **Step 2: Verify missing client files error**

```bash
node scripts/generate-episode.js nonexistent-client card.jpg 2>&1; echo "Exit code: $?"
```

Expected: Prints "Error: config.json not found for client 'nonexistent-client'" and exits with code 1.

---

### Task 8: Live Test with Real API Key and Card Image

**Files:** None (manual verification)

This is the end-to-end test — generate an actual episode using a real card image and API key.

- [ ] **Step 1: Set the API key in config.json**

Edit `clients/pokemon-fables/config.json` and replace `YOUR_API_KEY_HERE` with your actual Anthropic API key.

- [ ] **Step 2: Find a test card image**

The repo has card images at `public/images/cards/`. Use one:

```bash
ls public/images/cards/
```

Expected: `charizardVSAR.jpg` and `dugtrio.jpg`

- [ ] **Step 3: Run the pipeline**

```bash
node scripts/generate-episode.js pokemon-fables public/images/cards/dugtrio.jpg
```

Expected output:
- "Encoding 1 image(s)..."
- "Calling Claude (claude-sonnet-4-6) for episode 3..."
- "Wrote: clients/pokemon-fables/episodes/episode-3.json"
- "Updated: clients/pokemon-fables/story-bible.json"
- Episode summary with title, slug, card info, paragraph counts

- [ ] **Step 4: Verify the output files**

Check the generated episode:

```bash
cat clients/pokemon-fables/episodes/episode-3.json | head -20
```

Check the updated story bible:

```bash
cat clients/pokemon-fables/story-bible.json
```

Verify:
- Episode JSON has `id: 3`, valid `slug`, `junior` and `full` story blocks
- Story bible `last_episode` is now `3`
- Story bible `current_plot` has been updated
- Any new characters from the card have been added

- [ ] **Step 5: Commit the generated episode (but not config.json with the API key)**

```bash
git add clients/pokemon-fables/episodes/episode-3.json clients/pokemon-fables/story-bible.json
git commit -m "feat: generate episode 3 (dugtrio) — first pipeline-generated episode"
```
