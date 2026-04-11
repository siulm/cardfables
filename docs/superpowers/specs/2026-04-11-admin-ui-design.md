# Admin UI — Design Spec

## Overview

A `/admin` page in the existing Next.js app that provides a browser-based workflow for generating and publishing episodes. Replaces the CLI script with a UI: upload card images, generate via Claude, preview/edit, publish to GitHub (which triggers Vercel redeploy).

## Scope

This spec covers:
- Admin page with password protection
- API routes for auth, episode generation, and publishing
- GitHub API integration for reading/writing repo files

This spec does NOT cover:
- Per-client auth (login per company) — future SaaS feature
- Database storage — using GitHub-as-storage for now
- Subdomain routing or billing

## Page States & Flow

```
[Locked] → enter password → [Ready] → upload 1-3 images + click Generate
  → [Generating] → loading spinner (15-30s) → [Preview] → edit text, then Publish or Regenerate
  → [Publishing] → committing to GitHub → [Ready] with success message
```

### Locked
- Password input field + submit button
- Password checked against `ADMIN_PASSWORD` env var via `POST /api/admin/auth`
- On success, sets HTTP-only cookie for session persistence
- On failure, shows error message

### Ready
- Drag-and-drop zone or file picker for 1-3 card images (jpg, png, webp)
- "Generate Episode" button (disabled until at least 1 image selected)
- Shows current episode count (from story bible via GitHub API)

### Generating
- Loading spinner with "Generating Episode N..." message
- Calls `POST /api/generate-episode` with image files as FormData
- 15-30 second wait for Claude API response

### Preview
- Displays generated episode: title, slug, cards, junior story, full story
- All text fields are editable (title, paragraphs, dialogue, etc.)
- Two buttons: "Publish" and "Regenerate"
- Regenerate discards current preview and re-runs generation with same images

### Publishing
- Brief loading state while committing to GitHub
- On success, returns to Ready state with success message showing episode title
- On failure, shows error and stays in Preview state (data not lost)

## API Routes

### `POST /api/admin/auth`

- **Input:** `{ password: string }`
- **Logic:** Compare against `ADMIN_PASSWORD` env var
- **Success:** Set HTTP-only cookie `admin_session` with a signed value, return `{ ok: true }`
- **Failure:** Return 401 `{ error: "Invalid password" }`

### `POST /api/generate-episode`

- **Auth:** Check `admin_session` cookie, return 401 if missing/invalid
- **Input:** FormData with 1-3 image files (field name: `images`)
- **Logic:**
  1. Read `clients/pokemon-fables/config.json` from GitHub API
  2. Read `clients/pokemon-fables/story-bible.json` from GitHub API
  3. Encode uploaded images as base64
  4. Build system prompt from config (reuse `buildSystemPrompt` logic)
  5. Call Claude Sonnet 4.6 with images + story bible context
  6. Parse JSON response, strip code fences if present
  7. Validate response has `episode` and `bible_updates` fields
- **Output:** `{ episode: {...}, bible_updates: {...}, nextEpisode: N }`
- **Does NOT write anything** — returns data for preview only

### `POST /api/publish-episode`

- **Auth:** Check `admin_session` cookie, return 401 if missing/invalid
- **Input:** `{ episode: {...}, bible_updates: {...} }`
- **Logic:**
  1. Read current `story-bible.json` from GitHub (get latest SHA for update)
  2. Merge `bible_updates` into story bible (reuse `mergeBibleUpdates` logic)
  3. Commit `clients/pokemon-fables/episodes/episode-N.json` to GitHub
  4. Commit updated `clients/pokemon-fables/story-bible.json` to GitHub
  5. Both commits in a single GitHub API call (create tree + commit)
- **Output:** `{ ok: true, episodeId: N }`
- Vercel auto-redeploys from the commit

## GitHub API Integration

Helper module `src/lib/github.ts` with two functions:

### `readFile(path: string): Promise<{ content: string, sha: string }>`
- `GET /repos/{owner}/{repo}/contents/{path}`
- Returns decoded content (base64 → UTF-8) and SHA (needed for updates)
- Uses `GITHUB_TOKEN` for auth

### `commitFiles(files: { path: string, content: string }[], message: string): Promise<void>`
- Uses the Git Data API to create a single commit with multiple file changes:
  1. `GET /repos/{owner}/{repo}/git/ref/heads/main` — get current HEAD SHA
  2. `GET /repos/{owner}/{repo}/git/commits/{sha}` — get current tree SHA
  3. `POST /repos/{owner}/{repo}/git/blobs` — create blobs for each file
  4. `POST /repos/{owner}/{repo}/git/trees` — create new tree with file changes
  5. `POST /repos/{owner}/{repo}/git/commits` — create commit
  6. `PATCH /repos/{owner}/{repo}/git/ref/heads/main` — update branch ref
- Uses `GITHUB_TOKEN` for auth

Constants: `REPO_OWNER = "siulm"`, `REPO_NAME = "cardfables"`.

## Environment Variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `ADMIN_PASSWORD` | `.env.local` (local) + Vercel dashboard (prod) | Admin page access |
| `GITHUB_TOKEN` | `.env.local` (local) + Vercel dashboard (prod) | GitHub API read/write |
| `ANTHROPIC_API_KEY` | `.env.local` (local) + Vercel dashboard (prod) | Claude API calls |

Note: For API routes, the Anthropic API key comes from env var instead of `config.json` (which is gitignored and not available via GitHub API). The CLI script (`scripts/generate-episode.js`) continues to use `config.json` for local use.

## File Structure

```
src/app/admin/page.tsx                  ← Admin page (client component)
src/app/api/admin/auth/route.ts         ← Password auth endpoint
src/app/api/generate-episode/route.ts   ← Claude API call, returns preview
src/app/api/publish-episode/route.ts    ← Commits to GitHub
src/lib/github.ts                       ← GitHub API helper (read/write files)
```

## UI Style

Matches the existing site theme — dark background, gold accents, Playfair Display headings, DM Sans body text. Reuses existing components (Button, Field) and Tailwind classes from the site. The admin page should feel like part of the same app, not a separate tool.

## Dependencies

No new packages. Uses:
- `@anthropic-ai/sdk` (already installed) for Claude API
- `fetch` for GitHub API (built into Node.js)
- `cookies()` from `next/headers` for session management

## Error Handling

- **Auth failure:** 401 response, redirect to password screen
- **GitHub API failure:** Show error message, don't lose preview data
- **Claude API failure:** Show error message with raw response for debugging
- **Invalid JSON from Claude:** Strip code fences and retry parse, show error if still fails
- **Publish failure:** Stay in preview state, show error, user can retry

## Excluded from v1

- Image preview thumbnails in the upload zone (just show file names)
- Episode history / list of past episodes
- Story bible viewer/editor
- Multiple series support (hardcoded to pokemon-fables)
- Rate limiting
