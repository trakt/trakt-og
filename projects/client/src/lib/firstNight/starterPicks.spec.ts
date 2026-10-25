import { describe, expect, it, vi } from 'vitest';
import { fetchStarterPicks } from './starterPicks.ts';

const now = new Date('2026-10-24T00:00:00Z');
const respond = (body: unknown) => vi.fn<typeof globalThis.fetch>(() => Promise.resolve(Response.json(body)));
const breakingBad = {
  title: 'Breaking Bad',
  year: 2008,
  ids: { trakt: 1388, slug: 'breaking-bad' },
  images: { poster: ['media.trakt.tv/images/shows/1388/posters/medium/a.jpg.webp'], fanart: null },
  rating: 9.2,
  runtime: 47,
  aired_episodes: 62,
  first_aired: '2008-01-21T02:00:00.000Z',
};
const pick = (chart: 'popular' | 'trending', body: unknown, type: 'shows' | 'movies' = 'shows') =>
  fetchStarterPicks({ fetch: respond(body), chart, type, limit: 12, now });

describe('fetchStarterPicks', () => {
  it('should map a chart of bare titles', async () => {
    expect(await pick('popular', [breakingBad])).toEqual([
      {
        key: 'show:1388',
        type: 'show',
        id: 1388,
        href: '/shows/breaking-bad',
        title: 'Breaking Bad',
        year: 2008,
        image: 'https://media.trakt.tv/images/shows/1388/posters/medium/a.jpg.webp',
        fanart: undefined,
        released: true,
        rating: 9.2,
        runtime: 47,
        airedEpisodes: 62,
      },
    ]);
  });

  it('should unwrap a chart that wraps each title with its counts', async () => {
    const movie = { title: 'Dune: Part Three', ids: { trakt: 9, slug: 'dune-part-three' }, released: '2026-12-18' };
    const picks = await pick('trending', [{ watchers: 40, movie }], 'movies');
    expect(picks).toMatchObject([{ key: 'movie:9', href: '/movies/dune-part-three', released: false }]);
  });

  it('should show no picks for a malformed body', async () => {
    expect(await pick('popular', [{ title: 'No ids' }])).toEqual([]);
    expect(await pick('popular', { error: 'nope' })).toEqual([]);
  });
});
