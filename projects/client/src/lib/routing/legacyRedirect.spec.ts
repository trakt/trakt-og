import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { legacyRedirect } from './legacyRedirect.ts';

function thrown(fn: () => never) {
  try {
    fn();
  } catch (error) {
    if (isRedirect(error)) return error;
    throw error;
  }
  throw new Error('did not redirect');
}

describe('routing: legacyRedirect', () => {
  describe('legacyRedirect', () => {
    it('should keep the status and join the segments', () => {
      const result = thrown(() =>
        legacyRedirect(302, ['users', 'tester', 'library'], new URL('https://og.trakt.tv/x'))
      );
      expect(result.status).toBe(302);
      expect(result.location).toBe('/users/tester/library');
    });

    it('should keep the query string', () => {
      const result = thrown(() =>
        legacyRedirect(301, ['movies', 'tron'], new URL('https://og.trakt.tv/movie/tron?a=1'))
      );
      expect(result.status).toBe(301);
      expect(result.location).toBe('/movies/tron?a=1');
    });

    it('should encode each segment', () => {
      const result = thrown(() => legacyRedirect(301, ['users', 'a?b#c/d'], new URL('https://og.trakt.tv/x')));
      expect(result.location).toBe('/users/a%3Fb%23c%2Fd');
    });
  });
});
