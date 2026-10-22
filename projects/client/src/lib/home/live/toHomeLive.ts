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

export type HomeLiveCountry = {
  /** ISO 3166 alpha-2, as the map's dots are keyed. */
  readonly code: string;
  readonly name: string;
  readonly shows: number;
  readonly movies: number;
  /** What most people there are watching. */
  readonly top: { readonly type: HomeMediaType; readonly title: string; readonly year?: number; readonly href: string };
};

export type HomeLive = {
  readonly shows: number;
  readonly movies: number;
  /** Most watchers first. */
  readonly countries: readonly HomeLiveCountry[];
};

type Seen = { readonly type: HomeMediaType; readonly code: string | null; readonly source: HomeWatchingSource };

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

const topTitle = (seen: readonly Seen[]) => {
  const counts = Map.groupBy(seen, ({ source }) => source);
  const [source] = [...counts].reduce((best, entry) => (entry[1].length > best[1].length ? entry : best));
  return { type: source.type, title: source.title, year: source.year, href: source.href };
};

const toCountry = (code: string, seen: readonly Seen[]): HomeLiveCountry => ({
  code,
  name: regionNames.of(code) ?? code,
  shows: seen.filter(({ type }) => type === 'shows').length,
  movies: seen.filter(({ type }) => type === 'movies').length,
  top: topTitle(seen),
});

/**
 * Everyone watching the trending titles right now, counted once each: shows against movies, and by country where
 * their profile names one. Private profiles come back without a location, so they count but never reach the map.
 */
export function toHomeLive(sources: readonly HomeWatchingSource[]): HomeLive {
  const people = new Map<string, Seen>(
    sources.flatMap((source) =>
      source.watchers.map(({ username, location }) =>
        [username, { type: source.type, code: countryOfLocation(location), source }] as const
      )
    ),
  );
  const seen = [...people.values()];
  const byCountry = Map.groupBy(seen.filter(({ code }) => code !== null), ({ code }) => code ?? '');

  return {
    shows: seen.filter(({ type }) => type === 'shows').length,
    movies: seen.filter(({ type }) => type === 'movies').length,
    countries: [...byCountry]
      .map(([code, here]) => toCountry(code, here))
      .toSorted((a, b) => b.shows + b.movies - (a.shows + a.movies) || a.name.localeCompare(b.name)),
  };
}
