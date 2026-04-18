/**
 * Generate a social media teaser image + caption for an episode.
 *
 * Usage: node scripts/generate-teaser.js <client-name> <episode-number>
 * Output: clients/<client>/teasers/episode-<N>-teaser.jpg + episode-<N>-caption.txt
 *
 * Image: 1080x1350 (4:5 portrait) — works on Instagram, TikTok, YouTube
 * Caption: Story excerpt + hashtags
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Parse args
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Usage: node scripts/generate-teaser.js <client-name> <episode-number>");
  process.exit(1);
}

const clientName = args[0];
const episodeNum = parseInt(args[1]);
const clientDir = join(ROOT, "clients", clientName);
const episodePath = join(clientDir, "episodes", `episode-${episodeNum}.json`);

if (!existsSync(episodePath)) {
  console.error(`Episode not found: ${episodePath}`);
  process.exit(1);
}

const episode = JSON.parse(readFileSync(episodePath, "utf-8"));

// Find the card image
const card = episode.cards[0];
const cardImagePath = card?.image ? join(ROOT, "public", card.image) : null;

// Output directory
const teasersDir = join(clientDir, "teasers");
mkdirSync(teasersDir, { recursive: true });

// ── Generate teaser image (1080x1350) ──────────────────────

const WIDTH = 1080;
const HEIGHT = 1350;

async function generateImage() {
  // Create the text overlay as SVG
  const title = episode.title;
  const episodeLabel = `Episode ${episode.id}`;
  const cardName = card?.name || "";
  const emoji = card?.emoji || "📖";

  // Escape XML entities
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const svg = `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)" />
          <stop offset="40%" stop-color="rgba(0,0,0,0)" />
          <stop offset="70%" stop-color="rgba(0,0,0,0.6)" />
          <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
        </linearGradient>
      </defs>

      <!-- Dark gradient overlay -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlay)" />

      <!-- NEW EPISODE banner -->
      <rect x="40" y="40" width="220" height="36" rx="18" fill="rgba(212,137,58,0.9)" />
      <text x="150" y="64" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="white" letter-spacing="2">NEW EPISODE</text>

      <!-- Episode label -->
      <text x="54" y="${HEIGHT - 220}" font-family="sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="3">${esc(episodeLabel.toUpperCase())}</text>

      <!-- Title -->
      <text x="54" y="${HEIGHT - 170}" font-family="Georgia, serif" font-size="48" font-weight="700" fill="white">
        ${wrapText(esc(title), 20).map((line, i) => `<tspan x="54" dy="${i === 0 ? 0 : 56}">${line}</tspan>`).join("")}
      </text>

      <!-- Card name -->
      <text x="54" y="${HEIGHT - 60}" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.5)">${esc(cardName)}</text>

      <!-- CardFables branding -->
      <text x="${WIDTH - 54}" y="${HEIGHT - 60}" text-anchor="end" font-family="Georgia, serif" font-size="18" font-weight="700" fill="rgba(212,137,58,0.8)">CardFables.com</text>
    </svg>
  `;

  let image;

  if (cardImagePath && existsSync(cardImagePath)) {
    // Resize card image to fill the canvas
    const cardImage = await sharp(cardImagePath)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .toBuffer();

    // Composite: card image + SVG overlay
    image = await sharp(cardImage)
      .composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();
  } else {
    // No card image — use a gradient background
    const bg = await sharp({
      create: {
        width: WIDTH,
        height: HEIGHT,
        channels: 3,
        background: { r: 74, g: 64, b: 53 },
      },
    })
      .jpeg()
      .toBuffer();

    image = await sharp(bg)
      .composite([
        { input: Buffer.from(svg), top: 0, left: 0 },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();
  }

  const outputPath = join(teasersDir, `episode-${episodeNum}-teaser.jpg`);
  writeFileSync(outputPath, image);
  console.log(`Image: ${outputPath}`);
}

// Simple text wrapping for SVG
function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

// ── Generate caption ───────────────────────────────────────

function generateCaption() {
  // Pull first 2-3 paragraphs from Junior Fables (punchier)
  const story = episode.junior || episode.full;
  if (!story) {
    console.error("No story content found in episode");
    process.exit(1);
  }

  const excerptBlocks = story.paragraphs
    .filter((b) => b.t === "p")
    .slice(0, 3);

  const excerpt = excerptBlocks.map((b) => b.c).join("\n\n");

  const slug = episode.slug;
  const url = `cardfables.com/series/flames-of-our-lives/${slug}`;

  const caption = `${card?.emoji || "📖"} **Episode ${episode.id}: "${episode.title}"**

${excerpt}

📖 Read the full episode → ${url}

#CardFables #PokemonStories #PokemonTCG #PokemonCards #FanFiction`;

  const outputPath = join(teasersDir, `episode-${episodeNum}-caption.txt`);
  writeFileSync(outputPath, caption, "utf-8");
  console.log(`Caption: ${outputPath}`);
}

// ── Run ────────────────────────────────────────────────────

await generateImage();
generateCaption();
console.log("\nDone! Files ready for social media posting.");
