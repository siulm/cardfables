/**
 * Release marker — the single source of truth for the site's version and
 * release date.
 *
 * Serves two audiences from one place:
 *   - Developer: glance at the deployed site (or this file) to know exactly
 *     WHAT version is live and WHEN it shipped.
 *   - Readers: the About page shows a friendly "last updated" line so visitors
 *     know the site is alive and maintained.
 *
 * Bump BOTH on every shipped update:
 *   - VERSION:     bump patch / minor / major to match the size of the change
 *   - RELEASED_AT: ISO date (YYYY-MM-DD) the update went live
 */
export const VERSION = "1.0.0";
export const RELEASED_AT = "2026-05-29";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Format RELEASED_AT as e.g. "May 29, 2026".
 * Parses the ISO parts manually to stay timezone-safe (avoids the UTC-midnight
 * off-by-one that `new Date("2026-05-29")` can cause in negative-offset zones).
 */
export function formatReleaseDate(): string {
  const [year, month, day] = RELEASED_AT.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}
