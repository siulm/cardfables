# Card Image Processing

Pipeline that takes camera photos of Pokémon cards (on a yellow background) and produces:
- Processed WebP images (background removed, auto-cropped, resized) saved to `public/images/cards-collection/`
- A `cards-import.csv` ready to drop into `/admin/cards/import`
- A `cards-failures.txt` for any photos that couldn't be identified

## Prerequisites

- `ANTHROPIC_API_KEY` available (it lives in `.env.local`; pass `--env-file=.env.local`)
- Dependencies installed (`pnpm install`)
- Photos in a single folder

## Supported input formats

- **JPEG / PNG / WebP / HEIC** — used directly
- **RAW: CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2, SRW** — converted to a downscaled
  JPEG automatically via macOS `sips` before processing (no extra dependency)

> **RAW is macOS-only.** Conversion shells out to `sips`, which ships with macOS
> and carries Apple's RAW codecs. On Linux/Windows, convert RAW → JPEG yourself
> first and point the script at the JPEG folder.

## Usage

```bash
# Dry run (identify only, no image processing) — note the spaces in the path are quoted
node --env-file=.env.local scripts/process-card-images.js "/Volumes/T9/PokemonCards 05172026" --dry-run

# Full run
node --env-file=.env.local scripts/process-card-images.js "/Volumes/T9/PokemonCards 05172026"
```

## Cost & timing (≈240 cards estimate)

- Claude Vision API: ~$1.50–2.50 total (claude-sonnet-4-6, ~$0.005–0.01 per image)
- RAW→JPEG conversion: local via `sips`, no cost (~1–2s per file)
- Background removal: local, no cost
- Total time: ~20–35 minutes (sequential, no rate limit hit at this scale)

## Workflow

1. Point the script at your photo folder (RAW is fine — see above)
2. Run `--dry-run` first to sanity-check identification
3. Run for real
4. Open `cards-import.csv` in Excel/Numbers
5. Fill in the `price` column (the script can't read this from the photo)
6. Adjust `condition` if not NM
7. Upload via Admin → Cards → Import CSV
8. Manually handle any rows in `cards-failures.txt`

## Tips

- Run `--dry-run` first to sanity-check identification without spending time on image processing
- Claude Vision's confidence score is in the script output — re-take photos of any `low` confidence cards
- The Pokémon TCG API is best-effort; if it's down or returns nothing, the script uses Claude's identification as-is
- RAW files are downscaled to a 2400px-long-edge JPEG for processing — plenty for the 1200px final crop, and small enough to stay under Claude's image-size limit
