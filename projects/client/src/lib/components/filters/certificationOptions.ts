import type { FilterOption } from './filterOptions.ts';

const rated = (ratings: readonly (readonly [string, string])[]): readonly FilterOption[] =>
  ratings.map(([value, label]) => ({ value, label }));

/** OG's `MOVIE_CERTIFICATIONS` and `TV_CERTIFICATIONS`: the US sets, in the API's order. */
export const certificationOptions: Readonly<Record<'shows' | 'movies', readonly FilterOption[]>> = {
  movies: rated([
    ['g', 'G'],
    ['pg', 'PG'],
    ['pg-13', 'PG-13'],
    ['r', 'R'],
    ['nr', 'Not Rated'],
  ]),
  shows: rated([
    ['tv-y', 'TV-Y'],
    ['tv-y7', 'TV-Y7'],
    ['tv-g', 'TV-G'],
    ['tv-pg', 'TV-PG'],
    ['tv-14', 'TV-14'],
    ['tv-ma', 'TV-MA'],
    ['nr', 'Not Rated'],
  ]),
};
