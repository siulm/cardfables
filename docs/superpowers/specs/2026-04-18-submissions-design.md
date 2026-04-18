# Submissions — Design Spec

## Overview

Fix the broken submit page to actually save user submissions, add Claude Haiku safety screening for uploaded photos, and add a submissions review tab to the admin page with LIFO ordering.

## Scope

- Fix submit page: wire up photo upload, add email field, validate, save via API
- API route for saving submissions (with safety screening) and listing them
- Admin page: new "Submissions" tab showing submissions newest-first with photo thumbnails
- "Use for Episode" button in admin to pre-load a submission's photo into the generate flow

## Submit Page Changes

**Current state:** Form has name, cardName, series, reason fields. Photo drop zone is a visual placeholder (no file input). Submit button sets local state only — nothing is saved.

**Fixed state:**
- Wire up photo drop zone with actual `<input type="file">` and drag-and-drop
- Add optional email field (for future notification — not required)
- Card name and photo are required; name, series, email, reason are optional
- On submit, send FormData to `POST /api/submissions`
- Show loading state during safety check + save (~3-5 seconds)
- On success: show current success screen
- On failure: show error message ("Submission could not be processed")

## API Routes

### `POST /api/submissions` (public — no auth)

**Input:** FormData with fields: `name`, `email`, `cardName`, `series`, `reason`, `photo` (file)

**Logic:**
1. Validate: `cardName` and `photo` are required
2. Read photo as base64
3. Send photo to Claude Haiku for safety screening:
   - Model: `claude-haiku-4-5-20251001`
   - Prompt: "Does this image contain sexual content, nudity, child abuse/exploitation, extreme violence, or other harmful content? Reply with only YES or NO."
   - If YES: return 400 `{ error: "Submission could not be processed" }`
4. Build submission JSON:
   ```json
   {
     "name": "User Name",
     "email": "user@example.com",
     "cardName": "Charizard V — VSTAR Universe",
     "series": "Flames of Our Lives",
     "reason": "The artwork is dramatic...",
     "photo": "data:image/jpeg;base64,/9j/4AAQ...",
     "timestamp": "2026-04-18T10:30:00.000Z"
   }
   ```
5. Commit to GitHub: `clients/pokemon-fables/submissions/{timestamp}.json`
   - Filename uses ISO timestamp with colons replaced by hyphens for filesystem safety
   - Example: `2026-04-18T10-30-00-000Z.json`
6. Return `{ ok: true }`

**Cost:** ~$0.001 per submission (Haiku vision check). Negligible.

### `GET /api/submissions` (auth required)

**Logic:**
1. Check `admin_session` cookie
2. Read directory listing of `clients/pokemon-fables/submissions/` from GitHub API
   - `GET /repos/{owner}/{repo}/contents/clients/pokemon-fables/submissions`
3. Fetch each JSON file's content
4. Parse and return array sorted by timestamp descending (LIFO)

**Output:** `{ submissions: [...] }`

**Note:** For large numbers of submissions, this will be slow (one GitHub API call per file). Acceptable for v1 — optimize later if needed.

## Admin Page — Submissions Tab

**Tab navigation** at the top of the admin page after login:
- **Generate** tab — current episode generation flow (default)
- **Submissions** tab — submissions review

**Submissions tab UI:**
- Loads submissions on tab switch via `GET /api/submissions`
- Loading spinner while fetching
- Each submission rendered as a card:
  - Photo thumbnail (rendered from base64 data URI, ~150px wide)
  - Name, card name, series, reason
  - Timestamp formatted as readable date
  - "Use for Episode" button
- "Use for Episode" converts the base64 photo back to a File object, switches to Generate tab, and pre-loads it into the upload zone

**Empty state:** "No submissions yet."

## File Structure

```
src/app/api/submissions/route.ts           ← POST (save) + GET (list)
clients/pokemon-fables/submissions/.gitkeep ← empty directory marker
```

**Modified files:**
- `src/app/submit/page.tsx` — fix form, add photo upload, add email, wire to API
- `src/app/admin/page.tsx` — add tabs, add submissions tab UI

## Safety Screening

Claude Haiku vision check on every photo upload. The screening prompt is intentionally simple and binary (YES/NO). If Haiku returns YES or any non-NO response, the submission is rejected.

The user sees a generic error message — never told why specifically. This prevents attackers from probing the filter.

Uses `ANTHROPIC_API_KEY` from environment variable (same key used for episode generation).

## Error Handling

- **Missing required fields:** Return 400 with field-specific error
- **Safety check fails:** Return 400 with generic "Submission could not be processed"
- **GitHub API failure:** Return 500 with error message
- **Claude API failure:** Return 500 — fail closed (reject submission if safety check can't run)
- **Admin list failure:** Show error message in submissions tab, don't crash the page

## Not in Scope

- Email notifications to the user or admin when a submission is received
- Deleting or archiving submissions from the admin UI
- Pagination for large numbers of submissions
- Rate limiting on the submit endpoint
