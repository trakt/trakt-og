import { describe, expect, it } from 'vitest';
import { officialOnlyPath } from './officialOnlyPath.ts';

describe('officialOnlyPath', () => {
  it.each([
    '/v3/users/me/lists',
    '/movies/fight-club-1999/watchnow/us',
    '/shows/x/seasons/1/episodes/1/watchnow/favorites/us',
    '/watchnow/sources/us',
    '/watchnow/countries',
    '/users/sean/progress/watched/added/desc',
    '/lists/12/collaborators',
    '/lists/12/collaborators/sean',
  ])('should keep %s for Trakt’s own apps', (path) => {
    expect(officialOnlyPath(path)).toBe(true);
  });

  it.each([
    '/movies/fight-club-1999',
    '/sync/watchlist/movies',
    '/users/me/lists',
    '/users/me/lists/collaborations',
    '/users/sean/watched/shows',
    '/shows/x/progress/watched',
    '/calendars/my/shows/2026-10-24/7',
  ])('should open %s to every app', (path) => {
    expect(officialOnlyPath(path)).toBe(false);
  });
});
