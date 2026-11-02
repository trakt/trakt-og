import { describe, expect, it } from 'vitest';
import { fromSavedFilter } from './fromSavedFilter.ts';

const now = new Date('2026-11-02T12:00:00Z');

describe('mapper: fromSavedFilter', () => {
  it("should make a private smart list from a chart's saved filter", () => {
    const saved = { name: 'Action 2010s', path: '/shows/trending', query: 'genres=action&years=2010-2019&page=2' };
    expect(fromSavedFilter(saved, now)).toEqual({
      name: 'Action 2010s',
      privacy: 'private',
      source: 'trending',
      mediaType: 'shows',
      filters: { genres: ['action'], years: [2010, 2019] },
    });
  });

  it("should keep OG's match-all genres", () => {
    const saved = { name: 'Both', path: '/movies/popular', query: 'genres=+crime,+mystery' };
    expect(fromSavedFilter(saved, now)?.filters).toEqual({ genres: ['crime', 'mystery'], genres_operator: 'and' });
  });

  it.each([
    ['a calendar', { path: '/calendars/my/shows', query: 'genres=drama' }],
    ['a period chart', { path: '/shows/watched/weekly', query: '' }],
    ['a search', { path: '/search/shows', query: 'query=lost' }],
    ["OG's network ids", { path: '/shows/trending', query: 'network_ids=16' }],
    ['the terms search', { path: '/shows/popular', query: 'query=dragon' }],
  ])('should leave out %s', (_, saved) => {
    expect(fromSavedFilter({ name: 'x', ...saved }, now)).toBeNull();
  });
});
