import { describe, expect, it } from 'vitest';
import { ogLabel, ogPath } from './ogPath.ts';

describe('ogPath', () => {
  it('should turn a Trakt link into its path and query', () => {
    expect(ogPath('https://trakt.tv/users/lish408/lists/37478474')).toBe('/users/lish408/lists/37478474');
    expect(ogPath('http://www.trakt.tv/movies/tron-1982?mode=x')).toBe('/movies/tron-1982?mode=x');
    expect(ogPath('https://og.trakt.tv/shows/mobland')).toBe('/shows/mobland');
    expect(ogPath('https://app.trakt.tv/movies/tron-1982')).toBe('/movies/tron-1982');
    expect(ogPath('https://tvtime.trakt.tv/shows/mobland')).toBe('/shows/mobland');
    expect(ogPath('http://trakt.tv/')).toBe('/');
  });

  it('should leave other hosts alone', () => {
    expect(ogPath('https://support.trakt.tv/hc')).toBeUndefined();
    expect(ogPath('https://www.imdb.com/title/tt0084827')).toBeUndefined();
    expect(ogPath('not a url')).toBeUndefined();
  });
});

describe('ogLabel', () => {
  it('should swap only the host, keeping the scheme and path as typed', () => {
    expect(ogLabel('https://trakt.tv/users/lish408/lists/37478474')).toBe(
      'https://og.trakt.tv/users/lish408/lists/37478474',
    );
    expect(ogLabel('www.trakt.tv/movies/tron-1982')).toBe('og.trakt.tv/movies/tron-1982');
    expect(ogLabel('http://app.trakt.tv?x=1')).toBe('http://og.trakt.tv?x=1');
    expect(ogLabel('tvtime.trakt.tv')).toBe('og.trakt.tv');
  });
});
