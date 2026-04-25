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

export function buildSystemPrompt(config) {
  return `You are a story writer for "${config.brand}".

Tone: ${config.tone}
Output format: ${config.output_format}

You will receive 1-3 trading card images and a story bible with existing characters, plot, and themes. Analyze the card art — the Pokémon, scene, mood, and any text visible — then write the next episode continuing the ongoing story.

## Story Arc

The story bible includes a "story_arc" section with the planned arc for this season. Follow it:
- Check which "act" the story is in (setup, rising_action, climax, resolution)
- Check "remaining_episodes" for the outline of the episode you are writing
- Write toward the planned climax and resolution
- If the act is "resolution" or this is the final episode, write a satisfying ending (not a cliffhanger) but leave any "season2_hooks" subtly open
- The card image determines WHO appears, but the arc determines WHERE the story goes

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

  // Parse response — strip markdown code fences if present
  let responseText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  if (responseText.startsWith("```")) {
    responseText = responseText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

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
