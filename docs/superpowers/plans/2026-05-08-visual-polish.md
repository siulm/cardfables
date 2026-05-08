# Visual Polish Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Layered visual polish across the CardFables Next.js site — typography refinement, motion utilities, depth tokens, episode-reader treatment, hero parallax, hover/press microinteractions — to make the site feel like a Ghibli kids' magazine instead of a stock Next.js template.

**Architecture:** Three sequenced layers. Layer 1 ships reusable foundations (CSS tokens, keyframes, utility classes, a `<FadeUpOnScroll>` wrapper component). Layer 2 consumes Layer 1 to polish the episode reader (drop caps, refined dialogue, curtain-drop end, fade-up entrance, optional fire-series ember overlay). Layer 3 consumes Layer 1 to polish cross-cutting surfaces (hero clouds, card hover-lift, button press, home-section fade-ups). Each layer ships as its own commit; layers can be deployed independently.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4 (`@theme` block), CSS custom properties, IntersectionObserver, vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-08-visual-polish-design.md`

---

## File structure

| File | Status | Layer | Responsibility |
|---|---|---|---|
| `src/app/globals.css` | modify | 1 | New `@theme` tokens (depth shadows, parchment-noise), new keyframes (`curtain-drop`), new utility classes (`.hover-lift`, `.press-shadow`, `.story-paragraph`, `.drop-cap`), animate-* helpers for new keyframes |
| `src/components/effects/FadeUpOnScroll.tsx` | new | 1 | Client component; IntersectionObserver-driven fade-up wrapper, supports `animation="fade-up" \| "curtain-drop"` and optional `delay`. Honors `prefers-reduced-motion` |
| `src/components/effects/HeroClouds.tsx` | new | 3 | Client component; replaces three hardcoded cloud divs in Hero with scroll-driven parallax |
| `src/components/episode/StoryRenderer.tsx` | modify | 2 | Drop cap on first `t:"p"` paragraph; refined scene/dialogue blockquote styling; wrap `t:"end"` in `<FadeUpOnScroll animation="curtain-drop">` |
| `src/components/episode/EpisodeReader.tsx` | modify | 2 | Wrap story container in `<FadeUpOnScroll>`; render `<EmberParticles>` overlay when episode's series color is the fire palette |
| `src/components/episode/EpisodeCardSpotlight.tsx` | modify | 2 | Wrap section in `<FadeUpOnScroll>`; add `.hover-lift` class to card thumbnails |
| `src/components/cards/EpisodeCard.tsx` | modify | 3 | Add `.hover-lift`; remove inline `hover:-translate-y-1` (utility supersedes) |
| `src/components/cards/SeriesCard.tsx` | modify | 3 | Add `.hover-lift`; replace inline boxShadow JS handler with token-based hover shadow via CSS |
| `src/components/cards/ShopCard.tsx` | modify | 3 | Add `.hover-lift` (only when `hasUrl`); minor border-color adjustment |
| `src/components/ui/Button.tsx` | modify | 3 | Add `.press-shadow` to base styles |
| `src/components/home/Hero.tsx` | modify | 3 | Remove three hardcoded cloud divs; insert `<HeroClouds />` |
| `src/components/home/HowItWorks.tsx` | modify | 3 | Wrap section in `<FadeUpOnScroll>` |
| `src/components/home/SeriesRow.tsx` | modify | 3 | Wrap section in `<FadeUpOnScroll>` |

---

## Layer 1 — Foundation

### Task 1: Add tokens, keyframes, utility classes to `globals.css`

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add depth shadow tokens to `@theme`**

Open `src/app/globals.css`. Inside the `@theme { ... }` block, after the `--color-footer-copyright: #8A7E6E;` line and before the `--color-fire: #e8651a;` line, insert:

```css
  /* Depth tokens */
  --shadow-soft: 0 4px 14px rgba(74, 64, 53, 0.06);
  --shadow-warm: 0 12px 32px rgba(212, 137, 58, 0.10);
  --shadow-deep: 0 20px 60px rgba(74, 64, 53, 0.16);

```

- [ ] **Step 2: Add curtain-drop keyframe + animate utility**

Inside the `@theme { ... }` block, after the existing `--animate-pulse-glow:` line (around line 39), add:

```css
  --animate-curtain-drop: curtain-drop 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
```

After the existing `@keyframes pulse-glow { ... }` block (around line 83), inside `@theme`, add:

```css
  @keyframes curtain-drop {
    0% {
      opacity: 0;
      transform: scaleY(0.4);
      transform-origin: top center;
    }
    100% {
      opacity: 1;
      transform: scaleY(1);
      transform-origin: top center;
    }
  }
```

- [ ] **Step 3: Add `.hover-lift` and `.press-shadow` utility classes**

After the existing `.fade-d4 { ... }` block (around line 134), add:

```css
/* Hover lift — translateY + warmer shadow on hover */
.hover-lift {
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 250ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-warm), var(--shadow-soft);
}

/* Press shadow — subtle inset on :active for buttons */
.press-shadow:active {
  transform: translateY(1px);
  box-shadow: inset 0 2px 6px rgba(74, 64, 53, 0.18);
}
```

- [ ] **Step 4: Add story-paragraph + drop-cap classes**

After the `.press-shadow` block, add:

```css
/* Story prose — first paragraph drop cap */
.story-paragraph + .story-paragraph {
  /* default story spacing; future-friendly hook */
}

.drop-cap::first-letter {
  float: left;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 3.4em;
  line-height: 0.9;
  margin: 0.08em 0.08em 0 0;
  color: var(--series-color, #D4893A);
}
```

- [ ] **Step 5: Type-check & build**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors, 51 static pages built.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(polish): foundation tokens, curtain-drop keyframe, hover-lift utilities"
```

---

### Task 2: Create `<FadeUpOnScroll>`

**Files:**
- Create: `src/components/effects/FadeUpOnScroll.tsx`

- [ ] **Step 1: Create the component**

Create `/Users/lm/repos/cardfables/src/components/effects/FadeUpOnScroll.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface FadeUpOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  animation?: "fade-up" | "curtain-drop";
  className?: string;
  threshold?: number;
}

export function FadeUpOnScroll({
  children,
  delay = 0,
  animation = "fade-up",
  className = "",
  threshold = 0.15,
}: FadeUpOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setAnimate(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setAnimate(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const animationClass =
    animation === "curtain-drop" ? "animate-curtain-drop" : "animate-fade-up";

  return (
    <div
      ref={ref}
      className={`${animate ? animationClass : ""} ${className}`}
      style={animate ? { animationDelay: `${delay}s` } : { opacity: 0 }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/effects/FadeUpOnScroll.tsx
git commit -m "feat(polish): add FadeUpOnScroll wrapper"
```

---

## Layer 2 — Episode reader

### Task 3: Drop cap + refined story styling in `<StoryRenderer>`

**Files:**
- Modify: `src/components/episode/StoryRenderer.tsx`

- [ ] **Step 1: Replace the file**

Open `src/components/episode/StoryRenderer.tsx` and replace its contents with:

```tsx
import type { CardInfo, StoryData } from "@/lib/types";
import { splitParagraph } from "@/lib/cardMentions";
import { CardChip } from "./CardChip";
import { FadeUpOnScroll } from "@/components/effects/FadeUpOnScroll";

type TextSize = "normal" | "large" | "xl";

const SIZE_MAP: Record<TextSize, Record<"junior" | "full", { fontSize: string; lineHeight: string }>> = {
  normal: { junior: { fontSize: "16px", lineHeight: "1.9" }, full: { fontSize: "15px", lineHeight: "1.85" } },
  large:  { junior: { fontSize: "19px", lineHeight: "2.0" }, full: { fontSize: "18px", lineHeight: "1.95" } },
  xl:     { junior: { fontSize: "22px", lineHeight: "2.1" }, full: { fontSize: "21px", lineHeight: "2.05" } },
};

interface StoryRendererProps {
  story: StoryData;
  seriesColor: string;
  mode: "junior" | "full";
  textSize?: TextSize;
  cards: CardInfo[];
}

function renderWithChips(
  text: string,
  cards: CardInfo[],
  seriesColor: string
): React.ReactNode {
  const segments = splitParagraph(text, cards);
  return segments.map((seg, i) => {
    if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
    return (
      <CardChip key={i} cardIndex={seg.cardIndex} seriesColor={seriesColor}>
        {seg.value}
      </CardChip>
    );
  });
}

export function StoryRenderer({
  story,
  seriesColor,
  mode,
  textSize = "normal",
  cards,
}: StoryRendererProps) {
  const { fontSize, lineHeight } = SIZE_MAP[textSize][mode];
  const firstProseIndex = story.paragraphs.findIndex((b) => b.t === "p");

  return (
    <article
      className="max-w-2xl"
      style={{ ["--series-color" as string]: seriesColor }}
    >
      {/* Scene heading — italic with flanking ornaments */}
      <p className="mb-8 flex items-center justify-center gap-3 text-sm italic text-text-secondary">
        <span aria-hidden="true" style={{ color: seriesColor, opacity: 0.5 }}>·</span>
        <span>{story.scene}</span>
        <span aria-hidden="true" style={{ color: seriesColor, opacity: 0.5 }}>·</span>
      </p>

      <div className="space-y-6">
        {story.paragraphs.map((block, i) => {
          switch (block.t) {
            case "p":
              return (
                <p
                  key={i}
                  className={`text-text-story story-paragraph ${i === firstProseIndex ? "drop-cap" : ""}`}
                  style={{ fontSize, lineHeight }}
                >
                  {renderWithChips(block.c, cards, seriesColor)}
                </p>
              );
            case "q":
              return (
                <blockquote
                  key={i}
                  className="rounded-xl py-1 pl-5"
                  style={{
                    borderLeft: `2px solid ${seriesColor}`,
                    borderImage: `linear-gradient(180deg, ${seriesColor}, ${seriesColor}33) 1`,
                  }}
                >
                  {block.speaker && (
                    <span
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: seriesColor }}
                    >
                      {block.speaker}
                    </span>
                  )}
                  <p className="text-base italic leading-[1.85] text-text-primary">
                    {renderWithChips(block.c, cards, seriesColor)}
                  </p>
                </blockquote>
              );
            case "a":
              return (
                <p
                  key={i}
                  className="text-center text-sm italic text-text-secondary"
                >
                  {block.c}
                </p>
              );
            case "end":
              return (
                <FadeUpOnScroll key={i} animation="curtain-drop" threshold={0.4}>
                  <p
                    className="mt-8 text-center font-heading text-xl font-bold italic"
                    style={{ color: seriesColor }}
                  >
                    {block.c}
                  </p>
                </FadeUpOnScroll>
              );
            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}
```

Notes:
- `firstProseIndex` is computed once per render and used to apply `.drop-cap` to the first `t:"p"` block. This handles episodes whose first block is `"a"` or `"q"` correctly.
- `--series-color` CSS custom property is set on the `<article>` so `.drop-cap::first-letter` can use it.
- Scene heading gains flanking series-color "·" ornaments at 50% opacity. Aria-hidden so screen readers ignore them.
- Blockquote left border uses a subtle gradient via `border-image` (modern browsers; falls back to flat color in IE which we don't support).
- The `t:"end"` block is wrapped in `<FadeUpOnScroll animation="curtain-drop" threshold={0.4}>`. Higher threshold than default so the curtain doesn't drop too early.

- [ ] **Step 2: Type-check & test**

```bash
pnpm tsc --noEmit
pnpm test
```
Expected: 0 errors, 28 tests pass.

- [ ] **Step 3: Skip commit**

Layer 2 has 3 interrelated tasks. Single commit at end of Task 5.

---

### Task 4: `<EpisodeReader>` — fade-up wrapper + fire-series ember overlay

**Files:**
- Modify: `src/components/episode/EpisodeReader.tsx`

- [ ] **Step 1: Edit imports**

Open `src/components/episode/EpisodeReader.tsx`. Find:
```tsx
import { CardSidebar } from "./CardSidebar";
import { StoryRenderer } from "./StoryRenderer";
import { NextEpisodeCTA } from "./NextEpisodeCTA";
import { EpisodeCardSpotlight } from "./EpisodeCardSpotlight";
import type { Episode, Series } from "@/lib/types";
```

Replace with:
```tsx
import { CardSidebar } from "./CardSidebar";
import { StoryRenderer } from "./StoryRenderer";
import { NextEpisodeCTA } from "./NextEpisodeCTA";
import { EpisodeCardSpotlight } from "./EpisodeCardSpotlight";
import { FadeUpOnScroll } from "@/components/effects/FadeUpOnScroll";
import { EmberParticles } from "@/components/effects/EmberParticles";
import type { Episode, Series } from "@/lib/types";
```

- [ ] **Step 2: Add fire-series check**

Find the function signature `export function EpisodeReader({ episode, series }: EpisodeReaderProps) {`. Inside the function body, after the existing `const story = mode === "junior" ? episode.junior : episode.full;` line, add:

```tsx
  const isFireSeries =
    series.color.toLowerCase() === "#e8651a" ||
    series.type === "Fire";
```

- [ ] **Step 3: Wrap story content in FadeUpOnScroll + add ember overlay**

Find the JSX block:
```tsx
        <div>
          <StoryRenderer
            story={story}
            seriesColor={series.color}
            mode={mode}
            textSize={textSize}
            cards={episode.cards}
          />
          <EpisodeCardSpotlight
            cards={episode.cards}
            seriesColor={series.color}
          />
          <NextEpisodeCTA
            series={series}
            currentEpisodeId={episode.id}
            currentEpisodeIndex={episodeIndex}
          />
        </div>
```

Replace with:
```tsx
        <div className="relative">
          {isFireSeries && (
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{ opacity: 0.35 }}
            >
              <EmberParticles />
            </div>
          )}
          <div className="relative z-10">
            <FadeUpOnScroll>
              <StoryRenderer
                story={story}
                seriesColor={series.color}
                mode={mode}
                textSize={textSize}
                cards={episode.cards}
              />
            </FadeUpOnScroll>
            <FadeUpOnScroll delay={0.1}>
              <EpisodeCardSpotlight
                cards={episode.cards}
                seriesColor={series.color}
              />
            </FadeUpOnScroll>
            <NextEpisodeCTA
              series={series}
              currentEpisodeId={episode.id}
              currentEpisodeIndex={episodeIndex}
            />
          </div>
        </div>
```

- [ ] **Step 2: Type-check & test**

```bash
pnpm tsc --noEmit
pnpm test
```
Expected: 0 errors, 28 tests pass.

- [ ] **Step 3: Skip commit**

Single commit at end of Task 5.

---

### Task 5: `<EpisodeCardSpotlight>` — hover-lift on thumbnails

**Files:**
- Modify: `src/components/episode/EpisodeCardSpotlight.tsx`

- [ ] **Step 1: Add `.hover-lift` class to the per-card wrapper div**

Open `src/components/episode/EpisodeCardSpotlight.tsx`. Find the `cards.map` JSX, locate the outermost `<div>` per card (the one with `className="flex flex-col items-center"`).

Find:
```tsx
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ width: w }}
            >
```

Replace with:
```tsx
            <div
              key={i}
              className="hover-lift flex flex-col items-center rounded-xl"
              style={{ width: w, padding: 4 }}
            >
```

(`padding: 4` gives the hover-lift box something to expand into so the shadow doesn't get clipped by the parent flex.)

- [ ] **Step 2: Type-check, test, build**

```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```
Expected: 0 errors, 28 tests pass, build succeeds.

- [ ] **Step 3: Commit Layer 2 (Tasks 3-5 together)**

```bash
git add src/components/episode/StoryRenderer.tsx \
        src/components/episode/EpisodeReader.tsx \
        src/components/episode/EpisodeCardSpotlight.tsx
git commit -m "feat(polish): episode reader — drop cap, dialogue gradient, curtain-drop end, fade-up entrance, fire ember overlay"
```

---

## Layer 3 — Cross-cutting

### Task 6: Card hover-lift (Episode + Series + Shop)

**Files:**
- Modify: `src/components/cards/EpisodeCard.tsx`
- Modify: `src/components/cards/SeriesCard.tsx`
- Modify: `src/components/cards/ShopCard.tsx`

- [ ] **Step 1: Edit `EpisodeCard.tsx`**

Open `src/components/cards/EpisodeCard.tsx`. Find:
```tsx
      className="group block overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:-translate-y-1"
```

Replace with:
```tsx
      className="hover-lift group block overflow-hidden rounded-2xl border border-border"
```

(`hover-lift` supersedes the inline `hover:-translate-y-1` and adds the warm shadow. The existing `transition-all duration-300` is replaced by `hover-lift`'s own transition timing.)

- [ ] **Step 2: Edit `SeriesCard.tsx`**

Open `src/components/cards/SeriesCard.tsx`. Find:
```tsx
      className="group block w-full min-w-[280px] overflow-hidden rounded-2xl border border-border transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01]"
```

Replace with:
```tsx
      className="hover-lift group block w-full min-w-[280px] overflow-hidden rounded-2xl border border-border"
```

Then find the `onMouseEnter`/`onMouseLeave` handlers:
```tsx
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = `${series.color}44`;
        el.style.boxShadow = `0 20px 50px rgba(0,0,0,0.10), 0 0 30px ${series.color}15`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "";
        el.style.boxShadow = "";
      }}
```

Replace with:
```tsx
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${series.color}44`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
      }}
```

(Drop the boxShadow JS — `.hover-lift` provides it via CSS.)

- [ ] **Step 3: Edit `ShopCard.tsx`**

Open `src/components/cards/ShopCard.tsx`. Find:
```tsx
      className={`group overflow-hidden rounded-2xl border border-border transition-all duration-300 ${hasUrl ? "hover:-translate-y-1 cursor-pointer" : ""}`}
```

Replace with:
```tsx
      className={`group overflow-hidden rounded-2xl border border-border ${hasUrl ? "hover-lift cursor-pointer" : ""}`}
```

- [ ] **Step 4: Type-check & build**

```bash
pnpm tsc --noEmit
pnpm build
```
Expected: 0 errors, build succeeds.

- [ ] **Step 5: Skip commit**

Single Layer 3 commit at end of Task 9.

---

### Task 7: Button press shadow

**Files:**
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Add `press-shadow` to baseStyles**

Open `src/components/ui/Button.tsx`. Find:
```tsx
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer";
```

Replace with:
```tsx
  const baseStyles =
    "press-shadow inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer";
```

- [ ] **Step 2: Type-check**

```bash
pnpm tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 3: Skip commit**

Single Layer 3 commit at end of Task 9.

---

### Task 8: `<HeroClouds>` parallax + `<Hero>` integration

**Files:**
- Create: `src/components/effects/HeroClouds.tsx`
- Modify: `src/components/home/Hero.tsx`

- [ ] **Step 1: Create `HeroClouds.tsx`**

Create `/Users/lm/repos/cardfables/src/components/effects/HeroClouds.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface CloudShape {
  top: string;
  left?: string;
  right?: string;
  width: number;
  height: number;
  opacity: number;
  blur: number;
  rate: number;
}

const CLOUDS: CloudShape[] = [
  { top: "8%", right: "15%", width: 180, height: 50, opacity: 0.35, blur: 8, rate: -0.18 },
  { top: "12%", right: "25%", width: 120, height: 35, opacity: 0.25, blur: 6, rate: -0.10 },
  { top: "6%", left: "10%", width: 140, height: 40, opacity: 0.20, blur: 10, rate: 0.12 },
  { top: "18%", left: "30%", width: 90, height: 28, opacity: 0.15, blur: 5, rate: 0.06 },
];

export function HeroClouds() {
  const [scrollY, setScrollY] = useState(0);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) {
      setEnabled(false);
      return;
    }
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: c.top,
            left: c.left,
            right: c.right,
            width: c.width,
            height: c.height,
            background: `rgba(255,255,255,${c.opacity})`,
            borderRadius: c.height,
            filter: `blur(${c.blur}px)`,
            transform: enabled
              ? `translate3d(${scrollY * c.rate}px, 0, 0)`
              : "none",
            willChange: enabled ? "transform" : "auto",
          }}
        />
      ))}
    </div>
  );
}
```

Notes:
- Four clouds (one more than the original three) for richer parallax depth.
- Negative `rate` moves clouds left as the user scrolls down; positive moves right.
- `prefers-reduced-motion` disables all transform updates.

- [ ] **Step 2: Edit `Hero.tsx`**

Open `src/components/home/Hero.tsx`. Find the import block at the top:
```tsx
import { Button } from "@/components/ui/Button";
import { SERIES } from "@/lib/data";
```

Replace with:
```tsx
import { Button } from "@/components/ui/Button";
import { SERIES } from "@/lib/data";
import { HeroClouds } from "@/components/effects/HeroClouds";
```

Then find the JSX block from the comment `{/* Subtle cloud shapes */}` through the third hardcoded cloud div (lines ~19-55):

```tsx
        {/* Subtle cloud shapes */}
        <div
          className="absolute"
          style={{
            top: "8%",
            right: "15%",
            width: 180,
            height: 50,
            background: "rgba(255,255,255,0.35)",
            borderRadius: 40,
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "12%",
            right: "25%",
            width: 120,
            height: 35,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 30,
            filter: "blur(6px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "6%",
            left: "10%",
            width: 140,
            height: 40,
            background: "rgba(255,255,255,0.20)",
            borderRadius: 35,
            filter: "blur(10px)",
          }}
        />
```

Replace with:
```tsx
        {/* Parallax cloud layer */}
        <HeroClouds />
```

- [ ] **Step 3: Type-check**

```bash
pnpm tsc --noEmit
```
Expected: 0 errors.

- [ ] **Step 4: Skip commit**

Single Layer 3 commit at end of Task 9.

---

### Task 9: Home sections fade-up + Layer 3 commit

**Files:**
- Modify: `src/components/home/HowItWorks.tsx`
- Modify: `src/components/home/SeriesRow.tsx`

- [ ] **Step 1: Edit `HowItWorks.tsx`**

Open `src/components/home/HowItWorks.tsx`. Add the import at the top:
```tsx
import { FadeUpOnScroll } from "@/components/effects/FadeUpOnScroll";
```

Then wrap the entire `<section>` body in `<FadeUpOnScroll>`. Find:
```tsx
export function HowItWorks() {
  return (
    <section className="py-16">
```

Replace with:
```tsx
export function HowItWorks() {
  return (
    <FadeUpOnScroll>
      <section className="py-16">
```

Then find the closing `</section>` at the bottom of the function and replace `</section>` with:
```tsx
      </section>
    </FadeUpOnScroll>
```

- [ ] **Step 2: Edit `SeriesRow.tsx`**

Open `src/components/home/SeriesRow.tsx`. Add the import at the top:
```tsx
import { FadeUpOnScroll } from "@/components/effects/FadeUpOnScroll";
```

Find:
```tsx
export function SeriesRow({ title, emoji, series }: SeriesRowProps) {
  return (
    <section className="py-6">
      <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-text-primary">
        <span>{emoji}</span> {title}
      </h2>
      <div className="hrow">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </section>
  );
}
```

Replace with:
```tsx
export function SeriesRow({ title, emoji, series }: SeriesRowProps) {
  return (
    <FadeUpOnScroll>
      <section className="py-6">
        <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-text-primary">
          <span>{emoji}</span> {title}
        </h2>
        <div className="hrow">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      </section>
    </FadeUpOnScroll>
  );
}
```

- [ ] **Step 3: Final verification — type-check, test, build**

```bash
pnpm tsc --noEmit
pnpm test
pnpm build
```
Expected: 0 errors, 28 tests pass, build succeeds (51 static pages).

- [ ] **Step 4: Commit Layer 3 (Tasks 6-9)**

```bash
git add src/components/cards/EpisodeCard.tsx \
        src/components/cards/SeriesCard.tsx \
        src/components/cards/ShopCard.tsx \
        src/components/ui/Button.tsx \
        src/components/effects/HeroClouds.tsx \
        src/components/home/Hero.tsx \
        src/components/home/HowItWorks.tsx \
        src/components/home/SeriesRow.tsx
git commit -m "feat(polish): cross-cutting — hero parallax, card hover-lift, button press, home section fade-ups"
```

---

## Task 10: Manual browser verification

This task cannot be done by a subagent. The controller (or user) drives the browser.

- [ ] **Step 1: Start dev server**

Run from `/Users/lm/repos/cardfables`:
```bash
pnpm dev
```
Wait for `Local: http://localhost:3000`.

If port 3000 is in use by an existing dev server, use that one — its hot-reload will already have the new code.

Tip: hard-refresh the browser (Cmd+Shift+R) before verification — turbopack hot-reload usually works but caching can confuse things.

- [ ] **Step 2: Home page checks**

Visit `http://localhost:3000`.

- Hero section: clouds should drift slightly when you scroll down (parallax). Different clouds drift at different rates.
- Scroll past the hero. The "How It Works" and series rows should fade up as they enter the viewport (one-time, single fire).
- Hover on any episode card or series card — should lift slightly with a warmer shadow.
- Hover on a button — should lift slightly. Click and HOLD a button — should sink with an inset shadow.

- [ ] **Step 3: Episode page checks**

Visit `http://localhost:3000/series/flames-of-our-lives/the-nap-that-changed-everything`.

- First paragraph in Junior mode: the "C" of "Charizard was the biggest..." should be a large drop-cap in series red/orange (Playfair Display).
- Scene heading: italic "A sunny meadow in Verdant Valley" with flanking · ornaments in series color.
- Dialogue (Venusaur quote): left border has a gradient fade from solid color at top to faded at bottom.
- Scroll to the end: when "To be continued..." enters the viewport, it should drop in with a curtain animation (scaleY 0.4 → 1, ~900ms).
- Background: subtle ember particles drifting upward (only on this fire-series episode; check a non-fire episode to confirm they're absent).
- "Cards from this episode" panel: card thumbnail should hover-lift on hover.

- [ ] **Step 4: Reduced-motion verification**

In DevTools → Rendering tab → set "Emulate CSS media feature prefers-reduced-motion" to **reduce**.

Reload the home page:
- Clouds should NOT parallax (stay still).
- Section fade-ups should appear immediately, no animation.
- Curtain drop on episode end should appear immediately.

If all the above hold, polish pass is verified.

- [ ] **Step 5: Stop dev server**

If you started a fresh server in step 1, Ctrl+C it. If you used an existing server, leave it.

---

## Self-Review Notes

Spec coverage check:

| Spec section | Implementing task |
|---|---|
| Layer 1 — depth tokens, parchment-noise, type scale, motion utilities | Task 1 |
| Layer 1 — `<FadeUpOnScroll>` | Task 2 |
| Layer 2 — drop cap on first paragraph | Task 3 |
| Layer 2 — scene heading ornaments | Task 3 |
| Layer 2 — dialogue gradient border | Task 3 |
| Layer 2 — curtain-drop end | Tasks 1 (keyframe) + 3 (wiring) |
| Layer 2 — episode reader fade-up + ember overlay | Task 4 |
| Layer 2 — spotlight hover-lift + fade-up | Tasks 4-5 |
| Layer 3 — `<HeroClouds>` parallax | Task 8 |
| Layer 3 — card hover-lift across 3 components | Task 6 |
| Layer 3 — button press-shadow | Task 7 |
| Layer 3 — home section fade-ups | Task 9 |
| `prefers-reduced-motion` everywhere | Tasks 1, 2, 8 (and global rule in `globals.css` lines 113-119 covers Tasks 3-7, 9) |

Spec said "type-scale tokens (h1/h2/h3/body/caption font-size + line-height pairs)" but Task 1 doesn't add explicit `--text-h1` etc. tokens. **Reasoning:** Tailwind 4 already exposes `text-xl`, `text-2xl`, etc. utilities the codebase uses everywhere. Adding a parallel `--text-*` token system would create two ways to do the same thing. The spec's underlying need — "tune typography for parchment feel" — is partially handled by Hero's `letterSpacing: -1.5` adjustment (already in the codebase) and the new drop-cap treatment in Task 3. If a future polish pass calls for system-wide type-scale rebalancing, that's a separate spec. **No task added; documenting the deviation here.**

Spec said "parchment-noise CSS custom prop". Task 1 does NOT add this. **Reasoning:** A subtle SVG-noise data URI adds visual richness but at noticeable bandwidth cost on the bg layer (~5-15kb base64), and Ghibli illustrations rely on flat color far more than texture. The rest of Task 1 (depth tokens + hover-lift + drop-cap + curtain-drop) already meaningfully shifts the feel without it. **Deferred.** If the user requests texture in browser verification, we can add it as a follow-up token in 5 lines.

Type consistency: `FadeUpOnScroll` props (`children`, `delay`, `animation`, `className`, `threshold`) are consistent across all 8 callsites in Tasks 3-9. `animate-curtain-drop` matches the keyframe name in `globals.css`. `--series-color` CSS variable is set in StoryRenderer (Task 3) and consumed by `.drop-cap::first-letter` (Task 1).

No placeholders. Every step has actual code or commands.
