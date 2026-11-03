import { describe, expect, it } from 'vitest';
import { type AdvancedFilters, emptyFilters } from './advancedFilters.ts';
import { filterChanges } from './filterChanges.ts';

const filters = (patch: Partial<AdvancedFilters>): AdvancedFilters => ({ ...emptyFilters, ...patch });

describe('filterChanges', () => {
  it('should find nothing when the filters match', () => {
    const same = filters({ genres: { values: ['drama'], mode: 'any' }, years: [2000, 2010] });
    expect(filterChanges(same, { ...same })).toEqual([]);
  });

  it('should set a filter that gains a value or changes it, and reset one that loses it', () => {
    const before = filters({ years: [2000, 2010], ratings: [50, 100] });
    const after = filters({ genres: { values: ['drama'], mode: 'any' }, years: [1990, 2010] });
    expect(filterChanges(before, after)).toEqual([
      { id: 'genres', action: 'set' },
      { id: 'years', action: 'set' },
      { id: 'ratings', action: 'reset' },
    ]);
  });

  it("should use trakt-web's ids, and og's own key where web has none", () => {
    const after = filters({
      status: { values: ['ended'], mode: 'any' },
      languages: { values: ['en'], mode: 'any' },
      watchnow: ['netflix'],
      tmdb_ratings: [5, 10],
      parental: { violence: 1 },
    });
    expect(filterChanges(emptyFilters, after).map(({ id }) => id)).toEqual([
      'watchnow',
      'languages',
      'statuses',
      'tmdb_ratings',
      'parental_violence',
    ]);
  });

  it('should count a new mode or left-out value as a change', () => {
    const any = filters({ genres: { values: ['drama'], mode: 'any' } });
    expect(filterChanges(any, filters({ genres: { values: ['drama'], mode: 'all' } }))).toEqual([
      { id: 'genres', action: 'set' },
    ]);
    expect(filterChanges(any, filters({ genres: { values: ['drama'], mode: 'any', excluded: ['crime'] } }))).toEqual([
      { id: 'genres', action: 'set' },
    ]);
  });

  it('should treat an empty list in any mode, or a blank query, as unset', () => {
    expect(filterChanges(emptyFilters, filters({ genres: { values: [], mode: 'none' }, query: '  ' }))).toEqual([]);
  });

  it('should reset each cleared filter', () => {
    const before = filters({ query: 'space', countries: { values: ['us'], mode: 'none' }, parental: { nudity: 0 } });
    expect(filterChanges(before, emptyFilters)).toEqual([
      { id: 'query', action: 'reset' },
      { id: 'countries', action: 'reset' },
      { id: 'parental_nudity', action: 'reset' },
    ]);
  });
});
