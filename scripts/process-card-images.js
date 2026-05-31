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
import { fileURLToPath, pathToFileURL } from "node:url";
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
  "name": "Charizard V",
  "set": "VSTAR Universe",
  "setNumber": "018/172",
  "year": 2022,
  "type": "Fire",
  "rarity": "SAR",
  "artist": "Oswaldo KATO",
  "language": "jp",
  "confidence": "high"
}

Rules:
- "name": the Pokémon/card name plus gameplay subtitles only (V, VMAX, VSTAR, ex, EX, GX). Do NOT put rarity codes (RR, RRR, SR, SAR, AR, UR) or the language in the name — those have their own fields.
- "set": the commonly-used set name ONLY. Do NOT include the set code (e.g. s12a, sv2a, sp6, m2a), the language, or the rarity. For Japanese sets, give the romanized/English set name (e.g. "VSTAR Universe", "Shiny Treasure ex").
- "language": "jp" if it is a Japanese card, otherwise "en". (English is the default; only mark "jp" when the card is clearly Japanese.)
- "type" MUST be one of: Fire, Water, Grass, Electric, Dark, Steel, Psychic, Fighting, Normal, Dragon, Fairy
- "rarity": Common, Uncommon, Rare, Holo, Promo, Full Art, SAR, RR, RRR, SR, AR, UR, or "Other" if unsure
- "year" is the set release year (4-digit number)
- "confidence" is high/medium/low based on how clearly the card is identifiable

If you cannot identify the card, return: {"error": "unable to identify", "reason": "..."}
`;

const anthropic = new Anthropic();

export function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

// Tokens that occasionally leak into name/set despite the prompt. Stripped from
// ids as a safety net. Language is encoded separately (see the -jp suffix), and
// rarity lives in its own field, so neither belongs in the slug.
const NOISE_TOKENS = new Set([
  "japanese", "japan", "jpn", "english", "eng", "en", "jp",
  "rr", "rrr", "sr", "ssr", "sar", "ar", "ur", "hr", "csr", "chr",
]);

// Slugify then drop noise tokens (kept as whole hyphen-segments only).
function cleanSegment(s) {
  return slugify(String(s ?? ""))
    .split("-")
    .filter((tok) => tok && !NOISE_TOKENS.has(tok))
    .join("-");
}

/**
 * Build a stable, collision-resistant id: name + set + discriminator + lang.
 * - name/set are normalized (set codes / rarity / language stripped)
 * - discriminator: full card number ("018/172" -> "018-172") so the denominator
 *   marks the set/version group; falls back to year, then to nothing
 * - "-jp" suffix only for Japanese cards (English is the understood default)
 */
export function buildId(cardInfo) {
  const base = [cleanSegment(cardInfo.name), cleanSegment(cardInfo.set)]
    .filter(Boolean)
    .join("-");
  const num = cardInfo.setNumber ? slugify(String(cardInfo.setNumber)) : "";
  const disc = num || (cardInfo.year ? String(cardInfo.year) : "");
  const lang = cardInfo.language === "jp" ? "jp" : "";
  return [base, disc, lang].filter(Boolean).join("-");
}

/**
 * Guarantee global uniqueness. If buildId still collides (e.g. two genuine
 * copies of the exact same card), append -2, -3, … rather than overwrite.
 */
export function uniqueId(cardInfo, usedIds) {
  const base = buildId(cardInfo);
  let id = base;
  let n = 2;
  while (usedIds.has(id)) id = `${base}-${n++}`;
  usedIds.add(id);
  return id;
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
  //
  // Matching on the numerator alone is unsafe: "Charizard #3" exists in many
  // sets. We require the set size (denominator of "3/70") to match too, so we
  // only ever confirm a card from the SAME set — otherwise we keep Claude's id.
  if (!name || !setNumber) return null;
  const [num, denom] = String(setNumber).split("/").map((s) => s.trim());
  if (!num) return null;
  const q = encodeURIComponent(`name:"${name}" number:"${num}"`);
  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=50`);
    if (!res.ok) return null;
    const data = await res.json();
    const cards = data.data ?? [];
    if (cards.length === 0) return null;
    if (!denom) return null; // no set size to verify against — don't risk a wrong match
    const d = Number(denom);
    return (
      cards.find(
        (c) => Number(c.set?.printedTotal) === d || Number(c.set?.total) === d
      ) ?? null
    );
  } catch {
    return null;
  }
}

// Find the small rotation (degrees) that best axis-aligns the cutout
// silhouette, by minimizing the alpha bounding-box area over a ±8° search.
async function deskewAngle(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .resize({ width: 300 })
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = [], py = [];
  let sx = 0, sy = 0, n = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x] > 128) { px.push(x); py.push(y); sx += x; sy += y; n++; }
    }
  }
  if (n === 0) return 0;
  const cx = sx / n, cy = sy / n;
  for (let i = 0; i < n; i++) { px[i] -= cx; py[i] -= cy; }
  let best = 0, bestArea = Infinity;
  for (let a = -8; a <= 8; a += 0.25) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
    for (let i = 0; i < n; i++) {
      const xr = px[i] * c - py[i] * s, yr = px[i] * s + py[i] * c;
      if (xr < mnx) mnx = xr; if (xr > mxx) mxx = xr;
      if (yr < mny) mny = yr; if (yr > mxy) mxy = yr;
    }
    const area = (mxx - mnx) * (mxy - mny);
    if (area < bestArea) { bestArea = area; best = a; }
  }
  return best;
}

async function processOne(photoPath, tmpDir, usedIds) {
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

    const slug = uniqueId(cardInfo, usedIds);

    if (dryRun) {
      console.log(`  [dry-run] id=${slug}  (#${cardInfo.setNumber ?? "?"}, ${cardInfo.year ?? "?"}, ${cardInfo.language ?? "?"})`);
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

    // 3b. Auto-straighten (deskew): cards photographed at a slight angle would
    // otherwise stay tilted inside their crop. Find the rotation that minimizes
    // the silhouette's bounding box, then straighten before trimming.
    const angle = await deskewAngle(cutoutBuf);
    const straightened =
      Math.abs(angle) >= 0.5
        ? await sharp(cutoutBuf)
            .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .toBuffer()
        : cutoutBuf;

    // 4. Trim + resize → WebP (smaller than PNG, keeps transparency)
    const outputPath = join(OUTPUT_IMAGE_DIR, `${slug}.webp`);
    await sharp(straightened)
      .trim()
      .resize({ width: 1200, height: 1680, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);
    console.log(`  ✓ saved ${slug}.webp${Math.abs(angle) >= 0.5 ? ` (deskewed ${angle.toFixed(1)}°)` : ""}`);

    return {
      ok: true,
      slug,
      ...cardInfo,
      image: `/images/cards-collection/${slug}.webp`,
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
  const usedIds = new Set();
  try {
    for (const f of photos) {
      const result = await processOne(join(inputDir, f), tmpDir, usedIds);
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

// Only auto-run when invoked directly as a CLI (so helpers can be imported
// by tooling — e.g. regenerating ids — without kicking off a full run).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
