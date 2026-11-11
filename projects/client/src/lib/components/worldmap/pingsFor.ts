import type { HomeLiveCountry } from '#lib/home/live/toHomeLive.ts';

/** One ping on the map: which country, when in the refresh it shows (0 to 1), and whether it's new to the map. */
export type MapPing = { readonly code: string; readonly delay: number; readonly big: boolean };

/** The most pings one country gets in one refresh. */
const MOST = 4;
/** Each ping takes this much growth in a country's share of everyone on the map: a tenth of a point. */
const GROWTH_PER_PING = 0.001;
/** A country new to the map gets this many, drawn bigger. */
const ARRIVALS = 2;

interface PingsForParams {
  before: readonly HomeLiveCountry[];
  after: readonly HomeLiveCountry[];
  random: () => number;
}

const pings = (code: string, count: number, big: boolean, random: () => number): MapPing[] =>
  Array.from({ length: count }, () => ({ code, delay: random(), big }));

/**
 * Where to ping after a refresh: each country whose share grew, one ping per tenth of a point it gained, so a big
 * country pings as often as people arrive there. A country that just arrived gets bigger ones. Countries with only a few people (no `watching`) never ping, so a ping can't point at
 * one person.
 */
export function pingsFor({ before, after, random }: PingsForParams): MapPing[] {
  const was = new Map(before.map(({ code, share }) => [code, share]));
  return after
    .filter(({ watching }) => watching)
    .flatMap(({ code, share }) => {
      const old = was.get(code);
      if (old === undefined) return pings(code, ARRIVALS, true, random);
      if (share <= old) return [];
      return pings(code, Math.min(MOST, Math.max(1, Math.round((share - old) / GROWTH_PER_PING))), false, random);
    });
}
