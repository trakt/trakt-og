import { describe, expect, it } from 'vitest';
import { apiCachePolicy } from './apiCachePolicy.ts';

const shared = (seconds: number) => ({ seconds, signedOutOnly: false });
const signedOut = (seconds: number) => ({ seconds, signedOutOnly: true });

describe('util: apiCachePolicy', () => {
  describe('for charts, search and feeds', () => {
    it.each([
      '/movies/trending',
      '/shows/popular',
      '/movies/favorited/all',
      '/shows/watched/weekly',
      '/shows/anticipated',
      '/movies/boxoffice',
      '/lists/trending',
      '/lists/popular',
      '/comments/trending/all/all',
      '/search/movie,show',
      '/search/list',
    ])('should keep %s for 5 minutes for everyone', (path) => {
      expect(apiCachePolicy(path)).toEqual(shared(300));
    });
  });

  describe('for catalog data', () => {
    it.each([
      '/movies/the-dark-knight-2008',
      '/movies/the-dark-knight-2008/ratings',
      '/movies/the-dark-knight-2008/watchnow/us',
      '/shows/breaking-bad/seasons',
      '/shows/breaking-bad/seasons/1/episodes/1/people',
      '/people/bryan-cranston/',
      '/people/bryan-cranston/known_for',
      '/calendars/all/movies/2026-10-30/1',
      '/calendars/releases/hot/premieres/2026-10-28/60',
    ])('should keep %s for 15 minutes for everyone', (path) => {
      expect(apiCachePolicy(path)).toEqual(shared(900));
    });

    it.each(['/genres/movies', '/networks', '/countries/shows', '/watchnow/sources/us'])(
      'should keep %s for a day for everyone',
      (path) => {
        expect(apiCachePolicy(path)).toEqual(shared(86_400));
      },
    );
  });

  describe('for what members write', () => {
    it.each([
      '/users/justin',
      '/users/justin/stats',
      '/users/justin/lists',
      '/lists/1248149',
      '/lists/29/items/movie',
      '/comments/123/replies',
      '/movies/the-dark-knight-2008/comments/likes',
      '/shows/breaking-bad/seasons/1/episodes/1/comments',
      '/movies/the-dark-knight-2008/lists/personal/popular',
      '/people/bryan-cranston/lists/all/popular',
    ])('should keep %s for 5 minutes, for visitors without a session only', (path) => {
      expect(apiCachePolicy(path)).toEqual(signedOut(300));
    });
  });

  describe('for live and personal reads', () => {
    it.each([
      '/movies/the-dark-knight-2008/watching',
      '/shows/breaking-bad/seasons/1/episodes/1/watching',
      '/users/justin/watching',
      '/users/me/history',
      '/sync/history',
      '/recommendations/movies',
      '/calendars/my/shows/2026-10-28/7',
      '/v3/users/me/lists',
      '/team',
      '/',
    ])('should never keep %s', (path) => {
      expect(apiCachePolicy(path)).toBeNull();
    });
  });
});
