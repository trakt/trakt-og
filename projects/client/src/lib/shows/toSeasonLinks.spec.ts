import { describe, expect, it } from 'vitest';
import { toSeasonLinks } from './toSeasonLinks.ts';

const show = {
  title: 'Breaking Bad',
  year: 2008,
  ids: { imdb: 'tt0903747', tmdb: 1396, tvdb: 81189 },
  social_ids: { twitter: 'BreakingBad', wikipedia: 'Breaking_Bad' },
};

describe('toSeasonLinks', () => {
  it('should link the season on IMDB and TMDB, JustWatch and a Wikipedia search', () => {
    const justwatch = 'https://www.justwatch.com/us/tv-show/breaking-bad/season-1';
    expect(toSeasonLinks({ show, number: 1, justwatch }).map(({ label, href }) => ({ label, href }))).toEqual([
      { label: 'IMDB', href: 'https://www.imdb.com/title/tt0903747/episodes?season=1' },
      { label: 'TMDB', href: 'https://www.themoviedb.org/tv/1396/season/1' },
      { label: 'JustWatch', href: justwatch },
      {
        label: 'Wikipedia',
        href: `https://duckduckgo.com/?q=${encodeURIComponent('!wikipedia Breaking Bad 2008 TV Series Season 1')}`,
      },
    ]);
  });

  it('should search IMDB without an id and leave out the links it has no ids for', () => {
    const links = toSeasonLinks({ show: { title: 'Breaking Bad', ids: {} }, number: 0 });
    expect(links.map(({ label }) => label)).toEqual(['IMDB', 'Wikipedia']);
    expect(links.at(0)?.href).toBe('https://www.imdb.com/find?q=Breaking+Bad+season+0&s=tt');
    expect(links.at(1)?.href).toContain(encodeURIComponent('Breaking Bad TV Series Season 0'));
  });
});
