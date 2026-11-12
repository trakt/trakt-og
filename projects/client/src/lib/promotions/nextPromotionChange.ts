import type { Promotion } from './Promotion.ts';

/** The soonest start or end after `now`, so a page can re-check then. Null when nothing is left to change. */
export function nextPromotionChange(promotions: readonly Promotion[], now: number): number | null {
  const at = now;
  const upcoming = promotions
    .flatMap(({ starts_at, ends_at }) => [Date.parse(starts_at), Date.parse(ends_at)])
    .filter((time) => time > at);
  return upcoming.length === 0 ? null : Math.min(...upcoming);
}
