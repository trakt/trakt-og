import type { LiveNow } from '../../charts/fetchLiveNow.ts';
import { countryOfLocation } from './countryOfLocation.ts';

export type HomeMediaType = 'shows' | 'movies';

/** One trending title and the people watching it right now, as `/{type}/{id}/watching?extended=full` returns them. */
export type HomeWatchingSource = {
  readonly type: HomeMediaType;
  readonly title: string;
  readonly year?: number;
  readonly href: string;
  readonly watchers: readonly { readonly username: string; readonly location?: string | null }[];
};

export type HomeLiveTitle = {
  readonly type: HomeMediaType;
  readonly title: string;
  readonly year?: number;
  readonly href: string;
};

export type HomeLiveCountry = {
  /** ISO 3166 alpha-2, as the map's dots are keyed. */
  readonly code: string;
  readonly name: string;
  /** Of everyone on the map, 0 to 1. */
  readonly share: number;
  /** Left out under `QUIET` people, since with so few it could point at one of them. */
  readonly watching?: {
    /** Of the people there, the share on shows, 0 to 1. */
    readonly shows: number;
    /** What most people there are watching. */
    readonly top: HomeLiveTitle;
  };
};

export type HomeLive = {
  /** Everyone watching each type right now, as Trending's Live now counts them. */
  readonly shows: number;
  readonly movies: number;
  /** Most watchers first. */
  readonly countries: readonly HomeLiveCountry[];
};

type Seen = { readonly type: HomeMediaType; readonly code: string | null; readonly source: HomeWatchingSource };

/** Fewer people than this in a country and the page shows only how big a share they are. */
const QUIET = 5;

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const topTitle = (seen: readonly Seen[]): HomeLiveTitle => {
  const counts = Map.groupBy(seen, ({ source }) => source);
  const [source] = [...counts].reduce((best, entry) => (entry[1].length > best[1].length ? entry : best));
  return { type: source.type, title: source.title, year: source.year, href: source.href };
};

interface ToCountryParams {
  code: string;
  seen: readonly Seen[];
  /** Everyone on the map. */
  located: number;
}

const toCountry = ({ code, seen, located }: ToCountryParams): HomeLiveCountry => ({
  code,
  name: regionNames.of(code) ?? code,
  share: seen.length / located,
  ...(seen.length >= QUIET && {
    watching: { shows: seen.filter(({ type }) => type === 'shows').length / seen.length, top: topTitle(seen) },
  }),
});

/**
 * Where the people watching the trending titles right now are, counted once each, as each country's share of everyone
 * whose profile names one. Private profiles come back without a location, so they never reach the map. Only shares
 * leave the server, never head counts; the totals are Trending's, a different count, so a share can't be turned back
 * into people.
 */
export function toHomeLive(total: LiveNow, sources: readonly HomeWatchingSource[]): HomeLive {
  const people = new Map<string, Seen>(
    sources.flatMap((source) =>
      source.watchers.map(
        ({ username, location }) =>
          [username, { type: source.type, code: countryOfLocation(location), source }] as const,
      ),
    ),
  );
  const located = [...people.values()].filter(({ code }) => code !== null);
  const byCountry = Map.groupBy(located, ({ code }) => code ?? '');

  return {
    shows: total.shows,
    movies: total.movies,
    countries: [...byCountry]
      .map(([code, seen]) => toCountry({ code, seen, located: located.length }))
      .toSorted((a, b) => b.share - a.share || a.name.localeCompare(b.name)),
  };
}
