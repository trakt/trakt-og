import { describe, expect, it } from 'vitest';
import { signInHref } from './signInHref.ts';

describe('auth: signInHref', () => {
  it('should return the path to come back to', () => {
    expect(signInHref(new URL('https://og.trakt.tv/calendars/my/shows-movies'))).toBe(
      '/signin?redirect_to=%2Fcalendars%2Fmy%2Fshows-movies',
    );
  });

  it('should keep the query string', () => {
    expect(signInHref(new URL('https://og.trakt.tv/users/tester/progress?page=2&sort=title'))).toBe(
      '/signin?redirect_to=%2Fusers%2Ftester%2Fprogress%3Fpage%3D2%26sort%3Dtitle',
    );
  });
});
