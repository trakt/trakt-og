import { describe, expect, it } from 'vitest';
import { toShareClick } from './toShareClick.ts';

describe('util: toShareClick', () => {
  it('should credit the share code with the page it opened', () => {
    const url = new URL('https://og.trakt.tv/shows/severance/seasons/2/episodes/1?share=Ab12Cd34Ef56');
    expect(toShareClick(url)).toEqual({
      code: 'Ab12Cd34Ef56',
      url: 'https://og.trakt.tv/shows/severance/seasons/2/episodes/1?share=Ab12Cd34Ef56',
    });
  });

  it('should skip a visit without a share code', () => {
    expect(toShareClick(new URL('https://og.trakt.tv/movies/tron-1982'))).toBeNull();
    expect(toShareClick(new URL('https://og.trakt.tv/movies/tron-1982?share='))).toBeNull();
  });

  it('should skip a malformed share code', () => {
    expect(toShareClick(new URL('https://og.trakt.tv/movies/tron-1982?share=true'))).toBeNull();
    expect(toShareClick(new URL('https://og.trakt.tv/movies/tron-1982?share=Ab12Cd34Ef5!'))).toBeNull();
  });
});
