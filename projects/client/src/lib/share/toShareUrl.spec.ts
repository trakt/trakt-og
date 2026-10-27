import { describe, expect, it } from 'vitest';
import { toShareUrl } from './toShareUrl.ts';

describe('util: toShareUrl', () => {
  it('should add the share code', () => {
    expect(toShareUrl({ url: 'https://og.trakt.tv/movies/tron-1982', shareCode: 'Ab12Cd34Ef56' })).toBe(
      'https://og.trakt.tv/movies/tron-1982?share=Ab12Cd34Ef56',
    );
  });

  it('should keep the query and hash', () => {
    expect(
      toShareUrl({ url: 'https://og.trakt.tv/users/sean/lists/heist?sort=rank#top', shareCode: 'Ab12Cd34Ef56' }),
    ).toBe('https://og.trakt.tv/users/sean/lists/heist?sort=rank&share=Ab12Cd34Ef56#top');
  });

  it('should replace a share code already there', () => {
    expect(
      toShareUrl({ url: 'https://og.trakt.tv/people/sean-bean?share=Zz99Zz99Zz99', shareCode: 'Ab12Cd34Ef56' }),
    ).toBe('https://og.trakt.tv/people/sean-bean?share=Ab12Cd34Ef56');
  });

  describe('without a share code', () => {
    it('should leave the link as it is', () => {
      expect(toShareUrl({ url: 'https://og.trakt.tv/movies/tron-1982', shareCode: null })).toBe(
        'https://og.trakt.tv/movies/tron-1982',
      );
      expect(toShareUrl({ url: 'https://og.trakt.tv/movies/tron-1982' })).toBe('https://og.trakt.tv/movies/tron-1982');
    });
  });

  it('should leave a link it cannot parse as it is', () => {
    expect(toShareUrl({ url: '/movies/tron-1982', shareCode: 'Ab12Cd34Ef56' })).toBe('/movies/tron-1982');
  });
});
