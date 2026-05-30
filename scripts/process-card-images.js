/**
 * Process camera photos of Pokémon cards:
 *   0. If the photo is a RAW file (CR2/CR3/NEF/ARW/DNG/…), convert it to a
 *      downscaled JPEG first via macOS `sips` (no extra dependency)
 *   1. Identify each card via Claude Vision (claude-sonnet-4-6)
 *   2. Cross-check metadata against the public Pokémon TCG API
 *   3. Remove the yellow background
 *   4. Auto-crop + resize to 1200x1680 max
 *   5. Save as <slug>.png to public/images/cards-collection/
 *   6. Emit a starter CSV ready for /admin/cards/import
 *
 * Usage:
 *   node --env-file=.env.local scripts/process-card-images.js path/to/photos [--dry-run]
 *
 * Environment:
 *   ANTHROPIC_API_KEY must be set (already required for episode generation).
 *   `node --env-file=.env.local` loads it from the project's .env.local.
 *
 * RAW support note:
 *   RAW conversion shells out to `sips`, which ships with macOS and carries
 *   Apple's Canon/Nikon/Sony RAW codecs. On non-macOS hosts, convert RAW to
 *   JPEG yourself first and point this script at the JPEG folder.
 */

import { readdir, readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, dirname, basename, extname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import Anthropic from "@anthropic-ai/sdk";
import { removeBackground } from "@imgly/background-removal-node";

const execFileP = promisify(execFile);

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const inputDir = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!inputDir) {
  console.error("Usage: node scripts/process-card-images.js <photo-dir> [--dry-run]");
  process.exit(1);
}

const OUTPUT_IMAGE_DIR = join(ROOT, "public", "images", "cards-collection");
const OUTPUT_CSV = join(ROOT, "cards-import.csv");
const FAILURES_FILE = join(ROOT, "cards-failures.txt");

// RAW formats that `sips` can rasterize to JPEG before the pipeline runs.
const RAW_EXTS = new Set([
  ".cr2", ".cr3", ".nef", ".arw", ".raf", ".dng", ".orf", ".rw2", ".srw",
]);
// Long edge (px) of the JPEG we hand to the pipeline. Big enough for a crisp
// 1200px final crop, small enough to stay under Claude's 5MB image limit.
const RAW_JPEG_MAX_EDGE = 2400;

const IDENTIFY_PROMPT = `You are analyzing a photograph of a Pokémon trading card on a yellow background. Return ONLY valid JSON (no other text, no markdown fences) with this exact structure:

{
  "name": "Charizard V (SAR)",
  "set": "VSTAR Universe",
  "setNumber": "018/172",
  "year": 2022,
  "type": "Fire",
  "rarity": "SAR",
  "artist": "Oswaldo KATO",
  "confidence": "high"
}

Rules:
- "name" includes subtitles like V, VMAX, ex, EX, GX, (SAR), (RR)
- "type" MUST be one of: Fire, Water, Grass, Electric, Dark, Steel, Psychic, Fighting, Normal, Dragon, Fairy
- "rarity": Common, Uncommon, Rare, Holo, Promo, Full Art, SAR, or "Other" if unsure
- "year" is the set release year (4-digit number)
- "confidence" is high/medium/low based on how clearly the card is identifiable

If you cannot identify the card, return: {"error": "unable to identify", "reason": "..."}
`;

const anthropic = new Anthropic();

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Returns a path to a pipeline-ready raster image. For RAW inputs, converts to
 * a downscaled JPEG in `tmpDir` via sips and returns { path, isTemp: true }.
 * For already-raster inputs, returns the original path unchanged.
 */
async function toProcessableImage(photoPath, tmpDir) {
  const ext = extname(photoPath).toLowerCase();
  if (!RAW_EXTS.has(ext)) return { path: photoPath, isTemp: false };

  const outPath = join(tmpDir, `${basename(photoPath, extname(photoPath))}.jpg`);
  try {
    await execFileP("sips", [
      "-s", "format", "jpeg",
      "-Z", String(RAW_JPEG_MAX_EDGE),
      photoPath,
      "--out", outPath,
    ]);
  } catch (e) {
    throw new Error(`sips RAW→JPEG conversion failed: ${e.message}`);
  }
  return { path: outPath, isTemp: true };
}

async function identifyCard(imagePath) {
  const buf = await readFile(imagePath);
  const base64 = buf.toString("base64");
  const ext = extname(imagePath).toLowerCase();
  const mediaType =
    ext === ".png" ? "image/png" :
    ext === ".webp" ? "image/webp" :
    "image/jpeg";

  const resp = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: IDENTIFY_PROMPT },
        ],
      },
    ],
  });

  const text = resp.content[0].type === "text" ? resp.content[0].text.trim() : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("no JSON in response");
  return JSON.parse(jsonMatch[0]);
}

async function lookupPokemonTcg(name, setNumber) {
  // Query the free Pokémon TCG API for canonical metadata. Best-effort —
  // if it 404s or returns nothing, fall back to Claude's identification.
  if (!name || !setNumber) return null;
  const number = setNumber.split("/")[0];
  const q = encodeURIComponent(`name:"${name}" number:"${number}"`);
  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

async function processOne(photoPath, tmpDir) {
  console.log(`\n→ ${basename(photoPath)}`);

  // 0. Convert RAW → JPEG if needed
  let work;
  try {
    work = await toProcessableImage(photoPath, tmpDir);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
    return { error: "raw_conversion_failed", photo: basename(photoPath) };
  }
  const imagePath = work.path;
  const cleanup = async () => {
    if (work.isTemp) await rm(imagePath, { force: true });
  };

  try {
    // 1. Identify via Claude
    let cardInfo;
    try {
      cardInfo = await identifyCard(imagePath);
    } catch (e) {
      console.log(`  ❌ identification failed: ${e.message}`);
      return { error: "identification_failed", photo: basename(photoPath) };
    }
    if (cardInfo.error) {
      console.log(`  ❌ unable to identify: ${cardInfo.reason ?? ""}`);
      return { error: cardInfo.error, reason: cardInfo.reason, photo: basename(photoPath) };
    }

    console.log(`  identified: ${cardInfo.name} · ${cardInfo.set} (${cardInfo.confidence})`);

    // 2. Cross-check with Pokémon TCG API (optional)
    const canonical = await lookupPokemonTcg(cardInfo.name, cardInfo.setNumber);
    if (canonical) {
      cardInfo.artist = canonical.artist ?? cardInfo.artist;
      cardInfo.set = canonical.set?.name ?? cardInfo.set;
      cardInfo.year = canonical.set?.releaseDate ? Number(canonical.set.releaseDate.slice(0, 4)) : cardInfo.year;
      console.log(`  ✓ confirmed via Pokémon TCG API`);
    }

    const slug = slugify(`${cardInfo.name}-${cardInfo.set}`);

    if (dryRun) {
      console.log(`  [dry-run] would save as ${slug}.png`);
      return { ok: true, slug, ...cardInfo };
    }

    // 3. Background remove
    let cutoutBuf;
    try {
      const blob = await removeBackground(imagePath);
      cutoutBuf = Buffer.from(await blob.arrayBuffer());
    } catch (e) {
      console.log(`  ❌ background removal failed: ${e.message}`);
      return { error: "bg_removal_failed", photo: basename(photoPath) };
    }

    // 4. Trim + resize
    const outputPath = join(OUTPUT_IMAGE_DIR, `${slug}.png`);
    await sharp(cutoutBuf)
      .trim()
      .resize({ width: 1200, height: 1680, fit: "inside", withoutEnlargement: true })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);
    console.log(`  ✓ saved ${slug}.png`);

    return {
      ok: true,
      slug,
      ...cardInfo,
      image: `/images/cards-collection/${slug}.png`,
    };
  } finally {
    await cleanup();
  }
}

function escapeCSV(v) {
  if (v === undefined || v === null) return "";
  const s = String(v);
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  await mkdir(OUTPUT_IMAGE_DIR, { recursive: true });
  const tmpDir = await mkdtemp(join(tmpdir(), "card-raw-"));

  const photos = (await readdir(inputDir))
    .filter((f) => /\.(jpg|jpeg|png|webp|heic|cr2|cr3|nef|arw|raf|dng|orf|rw2|srw)$/i.test(f))
    .sort();

  console.log(`Processing ${photos.length} photo(s) from ${inputDir}`);

  const results = [];
  try {
    for (const f of photos) {
      const result = await processOne(join(inputDir, f), tmpDir);
      results.push(result);
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  // Write CSV of successes
  const successes = results.filter((r) => r.ok);
  const columns = [
    "id", "name", "set", "setNumber", "year", "type", "rarity",
    "artist", "image", "price", "condition", "status",
  ];
  const lines = [
    columns.join(","),
    ...successes.map((r) =>
      columns
        .map((c) => {
          if (c === "id") return escapeCSV(r.slug);
          if (c === "price") return ""; // user fills in
          if (c === "condition") return "NM"; // sensible default
          if (c === "status") return "available";
          return escapeCSV(r[c]);
        })
        .join(",")
    ),
  ];
  await writeFile(OUTPUT_CSV, lines.join("\n"));
  console.log(`\n✓ Wrote ${successes.length} card(s) to ${OUTPUT_CSV}`);

  // Write failures report
  const failures = results.filter((r) => r.error);
  if (failures.length > 0) {
    const report = failures
      .map((f) => `${f.photo}: ${f.error}${f.reason ? " — " + f.reason : ""}`)
      .join("\n");
    await writeFile(FAILURES_FILE, report);
    console.log(`⚠ ${failures.length} photo(s) failed — see ${FAILURES_FILE}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
