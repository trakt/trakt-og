import type { ListFilterKey, RangeFilterKey } from '../../components/filters/advancedFilters.ts';
import type { SmartListFilters } from './SmartList.ts';

type SmartListKey = keyof SmartListFilters;

/**
 * The smart list's name for each advanced filter OG's chart panel has. Episode types are calendar-only and the terms
 * search isn't a chart filter, so neither saves.
 */
export const smartListFilterKeys = {
  lists: {
    genres: 'genres',
    certifications: 'certifications',
    languages: 'languages',
    countries: 'countries',
    networks: 'networks',
    status: 'statuses',
  },
  ranges: {
    years: 'years',
    runtimes: 'runtimes',
    ratings: 'ratings',
    imdb_ratings: 'imdb_ratings',
    tmdb_ratings: 'tmdb_ratings',
    rt_meters: 'rt_meters',
    rt_user_meters: 'rt_user_meters',
    letterboxd_ratings: 'letterboxd_ratings',
    mal_ratings: 'mal_ratings',
  },
} as const satisfies {
  lists: Partial<Record<ListFilterKey, SmartListKey>>;
  ranges: Record<RangeFilterKey, SmartListKey>;
};
