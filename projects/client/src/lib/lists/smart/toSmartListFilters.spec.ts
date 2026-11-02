import { describe, expect, it } from 'vitest';
import { emptyFilters } from '../../components/filters/advancedFilters.ts';
import { toSmartListFilters } from './toSmartListFilters.ts';

describe('util: toSmartListFilters', () => {
  it('should save nothing for an unfiltered chart', () => {
    expect(toSmartListFilters(emptyFilters)).toEqual({});
  });

  it('should save lists as arrays, leaving out values with a dash', () => {
    const filters = {
      ...emptyFilters,
      watchnow: ['netflix', 'max'],
      genres: { values: ['drama'], mode: 'any' as const, excluded: ['animation'] },
      certifications: { values: ['tv-y'], mode: 'none' as const },
      status: { values: ['ended'], mode: 'any' as const },
    };
    expect(toSmartListFilters(filters)).toEqual({
      watchnow: ['netflix', 'max'],
      genres: ['drama', '-animation'],
      certifications: ['-tv-y'],
      statuses: ['ended'],
    });
  });

  it("should spell OG's match-all genres as the and operator", () => {
    const filters = { ...emptyFilters, genres: { values: ['crime', 'mystery'], mode: 'all' as const } };
    expect(toSmartListFilters(filters)).toEqual({ genres: ['crime', 'mystery'], genres_operator: 'and' });
  });

  it('should save ranges as pairs', () => {
    const filters = { ...emptyFilters, years: [2010, 2026] as const, imdb_ratings: [7.5, 10] as const };
    expect(toSmartListFilters(filters)).toEqual({ years: [2010, 2026], imdb_ratings: [7.5, 10] });
  });

  it('should save each parental guide limit as a range from None', () => {
    const filters = { ...emptyFilters, parental: { nudity: 0, violence: 2 } as const };
    expect(toSmartListFilters(filters)).toEqual({ parental_nudity: [0, 0], parental_violence: [0, 2] });
  });

  it('should leave the terms search and episode types behind', () => {
    const filters = { ...emptyFilters, query: 'dragon', episode_types: { values: ['premiere'], mode: 'any' as const } };
    expect(toSmartListFilters(filters)).toEqual({});
  });
});
