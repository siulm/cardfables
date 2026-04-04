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
