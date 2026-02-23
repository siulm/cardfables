# CardFables

Original episodic stories inspired by Pokemon trading card artwork. Drama, comedy, mystery — one card, one episode, one fable at a time.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS 4
- **Fonts**: Playfair Display (headings) + DM Sans (body)
- **Deployment**: Static export (SSG)

## Features

### Multi-Card Episodes
Each episode can feature 1-3 Pokemon cards. The sidebar adapts its layout based on card count, showing aspect-ratio placeholders with emoji, "CARD X OF Y" badges, and card info with dividers.

### Junior / Full Fables Toggle
Every episode stores two story versions:
- **Junior Fables** (ages 6-11) — simpler vocabulary, shorter sentences, larger font (16px)
- **Full Fables** (ages 12+) — richer prose, deeper emotions, standard font (15px)

A segmented toggle on the reader page switches between them in real-time.

### Series & Episodes
- **Flames of Our Lives** — Fire-type soap opera (2 live episodes, 1 locked)
  - Ep 1: "The Nap That Changed Everything" (Charizard V SAR)
  - Ep 2: "The Witch Who Knew Too Much" (Mismagius ex + Genesect V)
- **Ocean's Deep**, **Grass Is Greener**, **Thunderstruck**, **Shadow Protocol**, **Iron Will** — Coming soon

### Accessibility & Color System
Colors follow the **60-30-10 rule** for visual hierarchy:
- **60% Dominant**: Dark backgrounds (`#07070d`, `#111122`)
- **30% Secondary**: Text colors tuned for WCAG AA contrast (`#8888a0` secondary, `#6e6e82` dim)
- **10% Accent**: Gold (`#d4a846`) and series-specific colors

All text/background pairings target minimum 4.5:1 contrast ratio (WCAG AA).

### SEO
- Per-page `generateMetadata` with title, description, keywords, canonical URLs
- JSON-LD structured data (TVEpisode, BreadcrumbList)
- OpenGraph and Twitter card metadata
- Sitemap and robots.txt

### Mobile Responsive
- Grid layouts stack to single-column on mobile
- Sidebar drops below story content on small screens
- Touch targets meet 48px minimum
- Explicit viewport configuration

## Project Structure

```
src/
  app/                  # Next.js App Router pages
    series/[seriesSlug]/[episodeSlug]/  # Episode reader
  components/
    cards/              # EpisodeCard, SeriesCard
    episode/            # EpisodeReader, CardSidebar, StoryRenderer, NextEpisodeCTA
    effects/            # EmberParticles
    home/               # Hero
    layout/             # Navbar, Footer, Breadcrumbs
    ui/                 # Button, Field, FilterPills
  lib/
    types.ts            # CardInfo, Episode, Series, StoryData
    data.ts             # All series/episode data + story content
```

## Development

```bash
pnpm install
pnpm dev        # Start dev server on localhost:3000
pnpm build      # Production build
```

Requires Node.js >= 20.9.0.

## License

All rights reserved. Pokemon and all character names are trademarks of Nintendo / Creatures Inc. / GAME FREAK Inc. CardFables is an independent fan project.
