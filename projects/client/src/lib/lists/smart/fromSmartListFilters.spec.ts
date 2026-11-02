import { describe, expect, it } from 'vitest';
import { emptyFilters } from '../../components/filters/advancedFilters.ts';
import { fromSmartListFilters } from './fromSmartListFilters.ts';
import { toSmartListFilters } from './toSmartListFilters.ts';

describe('util: fromSmartListFilters', () => {
  it('should read back every filter the panel saves', () => {
    const filters = {
      ...emptyFilters,
      watchnow: ['netflix'],
      genres: { values: ['crime', 'mystery'], mode: 'all' as const, excluded: ['animation'] },
      certifications: { values: ['tv-y'], mode: 'none' as const },
      networks: { values: ['HBO'], mode: 'any' as const },
      years: [2010, 2026] as const,
      rt_meters: [80, 100] as const,
      letterboxd_ratings: [3.5, 5] as const,
      parental: { violence: 1, frightening: 0 } as const,
    };
    expect(fromSmartListFilters(toSmartListFilters(filters))).toEqual(filters);
  });

  it("should read a real list's filters", () => {
    const filters = fromSmartListFilters({
      genres: ['action'],
      certifications: ['tv-ma'],
      countries: ['us'],
      watchnow: ['favorites'],
      years: [2010, 2024],
      ratings: [80, 100],
    });
    expect(filters?.genres).toEqual({ values: ['action'], mode: 'any' });
    expect(filters?.watchnow).toEqual(['favorites']);
    expect(filters?.ratings).toEqual([80, 100]);
  });

  it("should ignore the owner's streaming region and switches left off", () => {
    expect(fromSmartListFilters({ watchnow_country: 'gb', ignore_watched: false, keywords: [] })).toEqual(emptyFilters);
  });

  describe('for a filter the panel has no control for', () => {
    it.each([
      ['keywords', { keywords: ['time-travel'] }],
      ['studios', { studios: ['a24'] }],
      ['people', { people: ['christopher-nolan'] }],
      ['a hide switch', { ignore_watched: true }],
      ['a range with one end', { years: [2010] }],
      ['a left-out service', { watchnow: ['-netflix'] }],
      ['a parental guide floor', { parental_violence: [2, 3] }],
      ['keeping titles with no parental guide', { parental_violence: [0, 1], parental_include_unrated: true }],
    ])('should give null for %s', (_, filters) => {
      expect(fromSmartListFilters(filters)).toBeNull();
    });
  });
});
