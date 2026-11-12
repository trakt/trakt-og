import type { Promotion } from './Promotion.ts';

const KNOWN_THEME = 'tickets';

/** The first promotion running at `now` (start inclusive, end exclusive) in a theme the site draws. */
export function activePromotion(promotions: readonly Promotion[], now: number): Promotion | null {
  const at = now;
  return (
    promotions.find(
      ({ theme, starts_at, ends_at }) =>
        theme === KNOWN_THEME && Date.parse(starts_at) <= at && at < Date.parse(ends_at),
    ) ?? null
  );
}
