import { describe, expect, it } from 'vitest';
import { toLinkTracking, toShareTracking } from './linkTracking.ts';

describe('util: toLinkTracking', () => {
  it("should name a media page's links as web's media links", () => {
    expect(toLinkTracking('IMDB', false)).toEqual({ source: 'media-links', target: 'imdb-media' });
    expect(toLinkTracking('TMDB', false)).toEqual({ source: 'media-links', target: 'tmdb-media' });
    expect(toLinkTracking('Official Site', false)).toEqual({ source: 'media-links', target: 'homepage' });
    expect(toLinkTracking('Twitter', false)).toEqual({ source: 'media-links', target: 'x' });
    expect(toLinkTracking('Wikipedia', false)).toEqual({ source: 'media-links', target: 'wikipedia' });
  });

  it("should name a person's links as web's person summary does", () => {
    expect(toLinkTracking('IMDB', true)).toEqual({ source: 'person-summary', target: 'imdb' });
    expect(toLinkTracking('Instagram', true)).toEqual({ source: 'person-summary', target: 'instagram' });
    expect(toLinkTracking('TMDB', true)).toBeUndefined();
  });

  it('should skip sites web has no link to', () => {
    expect(toLinkTracking('JustWatch', false)).toBeUndefined();
    expect(toLinkTracking('TVDB', false)).toBeUndefined();
    expect(toLinkTracking('Fanart.tv', false)).toBeUndefined();
  });
});

describe('util: toShareTracking', () => {
  it("should give each summary web's share source", () => {
    expect(toShareTracking('/movies/tron-1982')).toEqual({ source: 'media', type: 'movie' });
    expect(toShareTracking('/shows/severance')).toEqual({ source: 'media', type: 'show' });
    expect(toShareTracking('/shows/severance/seasons/2/episodes/1')).toEqual({ source: 'episode' });
    expect(toShareTracking('/people/rhea-seehorn')).toEqual({ source: 'person' });
  });

  it('should name a season, which web has no share for', () => {
    expect(toShareTracking('/shows/severance/seasons/2')).toEqual({ source: 'season' });
  });
});
