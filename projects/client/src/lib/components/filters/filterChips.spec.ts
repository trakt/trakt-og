import { describe, expect, it } from 'vitest';
import { emptyFilters } from './advancedFilters.ts';
import { filterChips } from './filterChips.ts';

const sources = new Map([['netflix', { name: 'Netflix', color: '#e50914' }]]);

describe('util: filterChips', () => {
  it('should lead with the watch-now bundles and services, then the other filters', () => {
    const chips = filterChips({
      filters: { ...emptyFilters, watchnow: ['netflix', 'free'], genres: { values: ['drama'], mode: 'any' } },
      sources,
      country: 'us',
      favorites: [],
    });

    expect(chips).toEqual([
      { id: 'watchnow-free', text: 'Streaming Free', without: false },
      { id: 'watchnow-netflix', text: 'Netflix', without: false },
      { id: 'genres-drama', text: 'Drama', without: false },
    ]);
  });

  it('should show the favorites themselves for "All Favorites"', () => {
    const chips = filterChips({
      filters: { ...emptyFilters, watchnow: ['favorites'] },
      sources,
      country: 'us',
      favorites: ['netflix'],
    });

    expect(chips.map(({ text }) => text)).toEqual(['Netflix']);
  });

  it('should have no chips with no filters on', () => {
    expect(filterChips({ filters: emptyFilters, sources, country: 'us', favorites: [] })).toEqual([]);
  });
});
