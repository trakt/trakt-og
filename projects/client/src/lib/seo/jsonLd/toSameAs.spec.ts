import { describe, expect, it } from 'vitest';
import { toSameAs } from './toSameAs.ts';

describe('seo: toSameAs', () => {
  it('should keep IMDb and TMDB pages and drop searches and the rest', () => {
    const links = [
      { href: 'https://www.inception.com' },
      { href: 'https://www.imdb.com/title/tt1375666' },
      { href: 'https://www.themoviedb.org/movie/27205' },
      { href: 'https://www.imdb.com/find?q=Adam+Scott&s=nm' },
      { href: 'https://www.imdb.com/name/nm0779084' },
      { href: 'https://fanart.tv/movie/27205' },
    ];

    expect(toSameAs(links)).toEqual([
      'https://www.imdb.com/title/tt1375666',
      'https://www.themoviedb.org/movie/27205',
      'https://www.imdb.com/name/nm0779084',
    ]);
  });
});
