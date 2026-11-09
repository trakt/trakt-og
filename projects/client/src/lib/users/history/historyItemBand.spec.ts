import { describe, expect, it } from 'vitest';
import { historyItemBand } from './historyItemBand.ts';
import { historyRowsSchema } from './historyRowsSchema.ts';

const [movie, play] = historyRowsSchema.parse([
  {
    id: 1,
    watched_at: '2026-09-29T16:23:00.000Z',
    movie: {
      title: 'Oblivion',
      year: 2013,
      ids: { trakt: 55753, slug: 'oblivion-2013' },
    },
  },
  {
    id: 2,
    watched_at: '2026-09-29T16:23:00.000Z',
    show: {
      title: 'The Office',
      year: 2005,
      ids: { trakt: 2302, slug: 'the-office' },
    },
    episode: {
      ids: { trakt: 182211 },
      season: 9,
      number: 23,
      title: 'Finale',
      episode_type: 'series_finale',
      first_aired: '2013-05-16T21:30:00.000Z',
    },
  },
]);

describe('historyItemBand', () => {
  it('should put a movie or show beside its year, on its fanart', () => {
    expect(historyItemBand({ type: 'movie', id: 55753 }, movie)).toEqual({
      type: 'movie',
      title: 'Oblivion',
      href: '/movies/oblivion-2013',
      image: 'https://media.trakt.tv/movies/55753/thumb/fanart.webp',
      year: '2013',
    });
    expect(historyItemBand({ type: 'show', id: 2302 }, play)).toEqual({
      type: 'show',
      title: 'The Office',
      href: '/shows/the-office',
      image: 'https://media.trakt.tv/shows/2302/thumb/fanart.webp',
      year: '2005',
    });
  });

  it("should name a season's or episode's way up, a season on its show's fanart and an episode on its still", () => {
    const show = { title: 'The Office', item: { type: 'show', id: 2302 } };
    expect(historyItemBand({ type: 'season', id: 7617 }, play, { years: '2012 - 2013' })).toEqual({
      type: 'season',
      title: 'Season 9',
      href: '/shows/the-office/seasons/9',
      image: 'https://media.trakt.tv/shows/2302/thumb/fanart.webp',
      year: '2012 - 2013',
      parents: [show],
    });
    expect(historyItemBand({ type: 'episode', id: 182211 }, play, { id: 7617 })).toMatchObject({
      title: '9x23 Finale',
      href: '/shows/the-office/seasons/9/episodes/23',
      image: `https://media.trakt.tv/episodes/182211/thumb/screenshot.webp#fallback=${encodeURIComponent('https://media.trakt.tv/shows/2302/thumb/fanart.webp')}`,
      year: '2013',
      parents: [show, { title: 'Season 9', item: { type: 'season', id: 7617 } }],
    });
    expect(historyItemBand({ type: 'episode', id: 182211 }, play)?.parents).toEqual([show]);
  });

  it('should leave the band out without a play', () => {
    expect(historyItemBand({ type: 'episode', id: 1 }, undefined)).toBeUndefined();
  });
});
