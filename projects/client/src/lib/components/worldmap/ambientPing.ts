import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';

/**
 * A country for an ambient ping between counts, picked in proportion to its share, so the pings show where people are
 * watching without changing a number. Countries with only a few people (no `watching`) are never picked, so a ping
 * can't point at one person. Null when there are none.
 */
export function ambientPing(countries: readonly HomeLiveCountry[], random: () => number): string | null {
  const open = countries.filter(({ watching }) => watching);
  const total = open.reduce((sum, { share }) => sum + share, 0);
  if (total <= 0) return null;
  const target = random() * total;
  const picked = open.reduce<{ code: string | null; seen: number }>(
    (found, { code, share }) => {
      if (found.code !== null) return found;
      const seen = found.seen + share;
      return { code: seen > target ? code : null, seen };
    },
    { code: null, seen: 0 },
  );
  return picked.code ?? open.at(-1)?.code ?? null;
}
