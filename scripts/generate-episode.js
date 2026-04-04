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
