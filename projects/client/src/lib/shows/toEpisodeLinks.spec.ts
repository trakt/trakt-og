import { describe, expect, it } from 'vitest';
import { toEpisodeLinks } from './toEpisodeLinks.ts';

const show = { title: 'Breaking Bad', year: 2008, ids: { imdb: 'tt0903747', tmdb: 1396, tvdb: 81189 } };
const episode = { season: 1, number: 2, title: " Cat's in the Bag... ", ids: { imdb: 'tt1054724' } };

describe('toEpisodeLinks', () => {
  it('should link the episode on IMDB and TMDB, and a Wikipedia search', () => {
    expect(toEpisodeLinks({ show, episode }).map(({ label, href }) => ({ label, href }))).toEqual([
      { label: 'IMDB', href: 'https://www.imdb.com/title/tt1054724' },
      { label: 'TMDB', href: 'https://www.themoviedb.org/tv/1396/season/1/episode/2' },
      {
        label: 'Wikipedia',
        href: `https://duckduckgo.com/?q=${encodeURIComponent(
          "!wikipedia Breaking Bad 2008 TV Series Cat's in the Bag...",
        )}`,
      },
    ]);
  });

  it('should search IMDB without an id and leave out the links it has no ids for', () => {
    const links = toEpisodeLinks({ show: { title: 'Breaking Bad', ids: {} }, episode: { ...episode, ids: {} } });
    expect(links.map(({ label }) => label)).toEqual(['IMDB', 'Wikipedia']);
    expect(links.at(0)?.href).toBe(
      `https://www.imdb.com/find?${new URLSearchParams({ q: "Breaking Bad Cat's in the Bag...", s: 'ep' })}`,
    );
  });

  it('should search by the show alone for an untitled episode', () => {
    const links = toEpisodeLinks({ show, episode: { season: 1, number: 3, title: null, ids: {} } });
    expect(links.at(0)?.href).toBe('https://www.imdb.com/find?q=Breaking+Bad&s=ep');
    expect(links.at(-1)?.href).toBe(
      `https://duckduckgo.com/?q=${encodeURIComponent('!wikipedia Breaking Bad 2008 TV Series')}`,
    );
  });
});
