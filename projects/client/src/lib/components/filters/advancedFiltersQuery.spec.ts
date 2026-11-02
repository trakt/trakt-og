import { describe, expect, it } from 'vitest';
import { emptyFilters } from './advancedFilters.ts';
import { advancedFiltersQuery } from './advancedFiltersQuery.ts';

const filters = {
  ...emptyFilters,
  watchnow: ['netflix'],
  genres: { values: ['drama', 'comedy'], mode: 'all' as const },
  certifications: { values: ['tv-ma'], mode: 'none' as const },
  status: { values: ['ended'], mode: 'any' as const },
  years: [2000, 2010] as const,
  imdb_ratings: [7.5, 10] as const,
};

describe('util: advancedFiltersQuery', () => {
  it("should spell the filters the API's way", () => {
    expect(advancedFiltersQuery(filters)).toEqual({
      watchnow: 'netflix',
      genres: 'drama,comedy',
      genres_operator: 'and',
      certifications: '-tv-ma',
      statuses: 'ended',
      years: '2000-2010',
      imdb_ratings: '7.5-10',
    });
  });

  it('should leave out the excluded values of a mixed list with a dash', () => {
    const mixed = { ...emptyFilters, genres: { values: ['drama'], mode: 'any' as const, excluded: ['crime'] } };
    expect(advancedFiltersQuery(mixed)).toEqual({ genres: 'drama,-crime' });
  });

  it('should send nothing for no filters', () => {
    expect(advancedFiltersQuery(emptyFilters)).toEqual({});
  });

  it('should send the parental guide as ranges from None', () => {
    const parental = { ...emptyFilters, parental: { violence: 1, alcohol: 0, frightening: 3 } as const };
    expect(advancedFiltersQuery(parental)).toEqual({
      parental_violence: '0-1',
      parental_alcohol: '0-0',
      parental_frightening: '0-3',
    });
  });

  it('should send the TMDB, Letterboxd and MyAnimeList ratings', () => {
    const ratings = {
      ...emptyFilters,
      tmdb_ratings: [7.5, 10] as const,
      letterboxd_ratings: [3.5, 5] as const,
      mal_ratings: [8, 10] as const,
    };
    expect(advancedFiltersQuery(ratings)).toEqual({
      tmdb_ratings: '7.5-10',
      letterboxd_ratings: '3.5-5',
      mal_ratings: '8-10',
    });
  });
});
