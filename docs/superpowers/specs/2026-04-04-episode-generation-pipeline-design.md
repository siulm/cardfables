# Episode Generation Pipeline — Design Spec

## Overview

A CLI script that takes 1–3 card images, generates dual-age narrative content using Claude's vision API, and outputs structured episode JSON. Runs locally on Mac. First client: Pokémon card soap opera "Flames of Our Lives."

## Scope

This spec covers **only** the episode generation pipeline (`scripts/generate-episode.js`). It does NOT cover:

- Refactoring the website to read from episode JSON files (separate project)
- Deploy automation / GitHub push (brief item #3)
- Local UI for drag-and-drop (brief item #4)
- Multi-tenant website routing

## File Structure

```
clients/
  pokemon-fables/
    config.json            # Client config (API key, brand, tone, audiences)
    story-bible.json       # Persistent story state, updated each episode
    episodes/
      episode-1.json       # Generated episode output
      episode-2.json
      episode-N.json
scripts/
  generate-episode.js     # The pipeline script
```

## Usage

```bash
node scripts/generate-episode.js pokemon-fables card1.jpg card2.jpg
```

- First argument: client directory name under `clients/`
- Remaining arguments: 1–3 image file paths

## Client Config (`config.json`)

Per the project brief:

```json
{
  "brand": "Flames of Our Lives",
  "tone": "soap opera, dramatic, funny, age-appropriate",
  "audience_junior": "ages 6-11",
  "audience_full": "ages 12+",
  "output_format": "dual-age episode",
  "anthropic_api_key": "client's own key",
  "amazon_affiliate_tag": "their-tag-20",
  "deployment": "vercel"
}
```

The API key is stored in `config.json` as the brief specifies. For v1 this file lives on the owner's local Mac only.

## Story Bible (`story-bible.json`)

Persists story state across episodes. Read at the start of every generation, updated at the end.

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

## Pipeline Data Flow

```
node scripts/generate-episode.js pokemon-fables card1.jpg card2.jpg
                                  |
                                  v
        1. Read clients/pokemon-fables/config.json
        2. Read clients/pokemon-fables/story-bible.json
                                  |
                                  v
        3. Validate image paths exist (1-3 images required)
        4. Encode images as base64
                                  |
                                  v
        5. Build prompt:
           - System prompt from config (brand, tone, audiences, story format rules)
           - Story bible as context
           - Images as vision content blocks
                                  |
                                  v
        6. Single Claude API call (claude-sonnet-4-6)
                                  |
                                  v
        7. Parse JSON response
        8. Write clients/pokemon-fables/episodes/episode-N.json
        9. Merge bible_updates into story-bible.json
                                  |
                                  v
        10. Log success + episode summary to stdout
```

## Claude API Call

**Model:** `claude-sonnet-4-6`

**Single API call** that returns both episode content and story bible updates.

### Input

1. **System prompt** — constructed from `config.json` fields:
   - Brand name, tone, audience definitions
   - Story format rules (word counts, style per age level)
   - Output JSON schema
2. **User message** — contains:
   - Full `story-bible.json` content (characters, plot, themes, last episode)
   - 1–3 card images as base64 image content blocks
   - Instruction to analyze the card art and generate the next episode

### Story Format Rules (embedded in system prompt)

**Full Fables (12+):**
- Scene directions in brackets: `[Scene opens on...]`
- Inner monologue and emotional depth
- Character dialogue with attribution dashes
- Cliffhanger ending: `To be continued...`
- 600–900 words

**Junior Fables (6–11):**
- Same plot, same characters, same cliffhanger
- Short punchy sentences
- Sound effects: `CRUNCH. SNAP.`
- More action, less inner monologue
- 300–500 words

### Expected Response

Claude returns a single JSON object:

```json
{
  "episode": {
    "id": 3,
    "slug": "the-episode-title-lowercased-and-hyphenated",
    "title": "Episode Title",
    "cards": [
      {
        "name": "Pokemon Name (Set)",
        "set": "Set Name",
        "artist": "Artist Name",
        "emoji": "relevant emoji"
      }
    ],
    "status": "live",
    "junior": {
      "scene": "Scene description",
      "paragraphs": [
        { "t": "p", "c": "Narrative paragraph" },
        { "t": "q", "speaker": "Character", "c": "\"Dialogue\"" },
        { "t": "a", "c": "— action description —" },
        { "t": "end", "c": "To be continued..." }
      ]
    },
    "full": {
      "scene": "Scene description",
      "paragraphs": [
        { "t": "p", "c": "Narrative paragraph" },
        { "t": "q", "speaker": "Character", "c": "\"Dialogue\"" },
        { "t": "a", "c": "— action description —" },
        { "t": "end", "c": "To be continued..." }
      ]
    }
  },
  "bible_updates": {
    "new_characters": [
      { "name": "New Character", "card": "Card Name", "role": "role description" }
    ],
    "current_plot": "Updated plot state including cliffhanger setup",
    "new_themes": ["any new running themes"],
    "last_episode": 3
  }
}
```

### Story Block Types

| Type | Key | Description |
|------|-----|-------------|
| `p` | Paragraph | Narrative text |
| `q` | Quote | Dialogue — requires `speaker` field |
| `a` | Action | Scene direction or atmospheric description |
| `end` | Ending | "To be continued..." cliffhanger |

This format matches the existing website's `StoryBlock` type in `src/lib/types.ts`, so episodes will be compatible when the site is later wired to read from these JSON files.

### Cost Estimate

Per the brief: ~$0.034/episode on Claude Sonnet 4.6 ($3/MTok input, $15/MTok output). A single API call with story bible context (~2K tokens), system prompt (~1K tokens), images (~2-4K tokens), and output (~2K tokens) stays well within this estimate.

## Story Bible Update Logic

After a successful API call, the script merges `bible_updates` into `story-bible.json`:

- `last_episode`: overwrite with new value
- `current_plot`: overwrite with new value
- `new_characters`: append to existing `characters` array
- `new_themes`: append to existing `running_themes` array (deduplicate)

The bible grows organically. It stays small enough to fit in Claude's context window for every future episode.

## Error Handling

Minimal, no retries:

- **Missing config or bible file:** Exit with error message ("config.json not found for client 'pokemon-fables'")
- **Missing or invalid images:** Exit with error if paths don't exist or fewer than 1 / more than 3 provided
- **API failure:** Log error, exit without writing any files (no partial updates)
- **Invalid JSON response:** Log the raw response for debugging, exit without writing

If something fails, run it again.

## Episode Numbering

Derived from `story-bible.json`'s `last_episode + 1`. No auto-detection from filesystem.

## Dependencies

- `@anthropic-ai/sdk` — Anthropic's official Node.js SDK
- Node.js built-ins: `fs`, `path`, `process`

No other dependencies.

## Seeding the First Client

The `pokemon-fables` client needs to be seeded with:

1. `config.json` — filled in with the owner's Anthropic API key and Pokémon-specific settings
2. `story-bible.json` — pre-populated with existing characters and plot from episodes 1–2 (as shown in the brief)
3. `episodes/` directory — empty (existing episodes live in the website's `data.ts` for now)

## Domain-Agnostic Design

Nothing in `generate-episode.js` is hardcoded to Pokémon or soap operas. All domain-specific content comes from:

- `config.json` — brand, tone, audience definitions
- `story-bible.json` — characters, plot, setting, themes
- The system prompt — constructed from config fields

A future client (e.g., real estate, e-commerce) would have different config values and a different story bible structure, potentially with a different output format. That's a future concern — for now the script serves the Pokémon use case via config.
