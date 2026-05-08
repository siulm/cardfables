# Plan: Visual Polish Pass (Layered)

## Context

The episode-page conversion improvements have shipped (commits `416830d` through `7e1dff0` on `main`). The user wants a separate, queued visual-polish pass to make the site feel premium — described as "like a Ghibli kids' magazine, not a Next.js template." All four polish dimensions matter: typography, motion/atmosphere, depth/microinteractions, and the episode reader experience.

Approach chosen during brainstorming: **A — Layered all-in-one.** A single coherent spec, implemented in three sequenced layers. Layer 1 builds reusable foundations (tokens, motion utilities). Layers 2 and 3 consume Layer 1.

Why this is one project, not three: the four dimensions are interdependent. Typography choices affect how motion fades read; microinteractions need depth tokens; the reader uses everything. Splitting them produces inconsistent visual decisions.

## Approach

### Layer 1 — Foundation

`src/app/globals.css` — add to `@theme`:
- Depth tokens: `--shadow-soft`, `--shadow-warm`, `--shadow-deep`
- Parchment-noise CSS custom prop (subtle SVG noise data-URI, ~3% opacity)
- Type-scale tokens: refine font-size + line-height pairs at h1/h2/h3/body/caption levels; tune letter-spacing for parchment

Keep existing keyframes (`fade-up`, `ember`, `shimmer`, `pulse-glow`). Add:
- `curtain-drop` keyframe for "To be continued..." reveal
- `parallax-slow` keyframe for cloud drift

Add utility classes:
- `.hover-lift` — `translateY(-2px)` + warmer shadow on hover
- `.press-shadow` — subtle inset shadow on `:active` for buttons

`src/components/effects/FadeUpOnScroll.tsx` (new) — small client component wrapping `children`, uses IntersectionObserver to apply `fade-up` animation on first viewport entry. Honors `prefers-reduced-motion` (no-op when reduce). Single-fire, not repeated.

### Layer 2 — Episode reader (uses Layer 1)

`src/components/episode/StoryRenderer.tsx`:
- Drop cap on first `t:"p"` block: 3-line first-letter cap in Playfair Display, series color, slight margin-right
- Scene heading: italic + flanking ornaments (· text ·)
- Dialogue (`q` blocks): refine left-border to a 2px gradient fade; tighten italic restraint
- "To be continued..." (`end` block): apply `curtain-drop` animation on mount

`src/components/episode/EpisodeReader.tsx`:
- Wrap story `<div>` in `<FadeUpOnScroll>` for staggered entrance
- Optional ember-drift overlay on episode pages — only when `series.color` matches the fire palette (`#E8651A` or `#e8651a`). Reuses existing `<EmberParticles>` from `src/components/effects/EmberParticles.tsx`.

`src/components/episode/EpisodeCardSpotlight.tsx`:
- Add `<FadeUpOnScroll>` wrapper
- `.hover-lift` on card thumbnails

### Layer 3 — Cross-cutting

`src/components/effects/HeroClouds.tsx` (new) — simple SVG cloud layer with `parallax-slow` translate driven by scroll position. Client component.

`src/components/home/Hero.tsx`:
- Insert `<HeroClouds />` behind hero content

`src/components/home/HowItWorks.tsx`, `src/components/home/SeriesRow.tsx`:
- Wrap each in `<FadeUpOnScroll>`

`src/components/cards/EpisodeCard.tsx`, `SeriesCard.tsx`, `ShopCard.tsx`:
- Apply `.hover-lift` utility
- Replace ad-hoc inline `boxShadow` with `--shadow-soft` / `--shadow-warm` tokens

`src/components/ui/Button.tsx`:
- `.press-shadow` on `:active`
- Refine resting shadow with new tokens

`src/components/episode/CardSidebar.tsx`:
- Replace inline `0 0 40px ${seriesColor}10, 0 16px 48px rgba(0,0,0,0.08)` shadow with token-based equivalent that still tints by series color

## Files to Modify

| File | Status | Change |
|---|---|---|
| `src/app/globals.css` | modify | Type-scale tokens, depth shadows, parchment-noise, new keyframes (`curtain-drop`, `parallax-slow`), utility classes (`.hover-lift`, `.press-shadow`) |
| `src/components/effects/FadeUpOnScroll.tsx` | new | IntersectionObserver wrapper for fade-up on viewport entry |
| `src/components/effects/HeroClouds.tsx` | new | SVG cloud parallax layer |
| `src/components/episode/StoryRenderer.tsx` | modify | Drop cap, refined scene/dialogue/end styling, `curtain-drop` on `end` block |
| `src/components/episode/EpisodeReader.tsx` | modify | FadeUpOnScroll wrapper; ember overlay for fire-series episodes |
| `src/components/episode/EpisodeCardSpotlight.tsx` | modify | FadeUpOnScroll wrapper, hover-lift on thumbnails |
| `src/components/episode/CardSidebar.tsx` | modify | Token-based shadows |
| `src/components/cards/EpisodeCard.tsx` | modify | hover-lift, token shadows |
| `src/components/cards/SeriesCard.tsx` | modify | hover-lift, token shadows |
| `src/components/cards/ShopCard.tsx` | modify | hover-lift, token shadows |
| `src/components/ui/Button.tsx` | modify | press-shadow on :active, token resting shadow |
| `src/components/home/Hero.tsx` | modify | Insert `<HeroClouds />` |
| `src/components/home/HowItWorks.tsx` | modify | FadeUpOnScroll wrapper |
| `src/components/home/SeriesRow.tsx` | modify | FadeUpOnScroll wrapper |

## Existing Code to Reuse

- `src/components/effects/EmberParticles.tsx` — already exists, used by Layer 2 for fire-series episode atmosphere
- `globals.css` keyframes `fade-up`, `ember`, `shimmer`, `pulse-glow` — keep, extend; do not replace
- `prefers-reduced-motion` handler in `globals.css` lines 113-119 — preserve; new animations must respect it (which they will automatically because the global rule disables them)

## Verification

1. `pnpm tsc --noEmit` — clean
2. `pnpm test` — 28 still pass (no helper logic changes)
3. `pnpm build` — clean, 51 static pages
4. Manual browser walk-through (controller + user):
   - Home page: cloud parallax visible, sections fade up on scroll, cards lift on hover
   - Episode reader page: drop cap on first paragraph, scene/dialogue/end refined, "To be continued..." curtain-drops, fire-series episodes show subtle ember drift, card thumbnails in spotlight lift on hover
   - Buttons: press shadow on :active visible
   - DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" → all new animations skip cleanly
   - All three card components retain layout integrity (no shifted content from new shadows/hover-lift)

## Out of scope

- New colors or theme palette changes (Ghibli theme stays)
- New icons or illustrations beyond `<HeroClouds>`
- Removing existing animations
- Visual-regression testing infrastructure (Percy/Chromatic) — too heavyweight for current pace
- Migrating `<img>` → `next/image` (separate concern)
- CardSidebar decomposition into 5 sub-components (deferred from prior code-review feedback; not blocking polish work)
- Event-bus → context refactor for the chip focus mechanism (deferred from prior code review)

## Sequencing notes for the plan

The implementation plan (next step, via `writing-plans` skill) should sequence:
1. Layer 1 first (no consumers yet, safe to land in isolation)
2. Layer 2 (builds on Layer 1, episode reader is the highest-traffic page)
3. Layer 3 (cross-cutting; safe to land last since it's the broadest surface area)

Each layer should be its own commit. After each layer ships, the user can preview in `pnpm dev` and decide whether to push.
