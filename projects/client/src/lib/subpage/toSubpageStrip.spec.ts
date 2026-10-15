import { describe, expect, it } from 'vitest';
import type { SubpageMedia } from './toSubpageMedia.ts';
import { toSubpageStrip } from './toSubpageStrip.ts';

const media: SubpageMedia = {
  item: { type: 'movie', id: 1, title: 'Fight Club (1999)' },
  title: 'Fight Club',
  href: '/movies/fight-club-1999',
  released: '1999-10-15',
  parents: [],
  links: [],
};
const reads = {
  ratings: {
    trakt: { rating: 8.8, votes: 100, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 100 } },
    imdb: { rating: 8.8, votes: 1, link: 'https://www.imdb.com/title/tt0137523' },
  },
  stats: { watchers: 1, plays: 1, collectors: 1, comments: 1, lists: 1, votes: 100, favorited: 6 },
  letterboxd: { rating: 4.3, votes: 1, link: 'https://letterboxd.com/film/fight-club' },
};
const params = { media, reads, rank: null, otherSiteRatings: true, now: new Date('2026-10-15T00:00:00Z') };

describe('toSubpageStrip', () => {
  it('should carry the summary strip to the stats page', () => {
    const strip = toSubpageStrip(params);
    expect(strip).toMatchObject({
      rating: { value: 8.8, votes: 100, href: '/movies/fight-club-1999/stats' },
      rateLabel: 'movie',
      counts: [{ count: 6, label: 'favorited' }],
    });
    expect(strip?.external.map(({ title }) => title)).toEqual(['IMDb', 'Letterboxd']);
  });

  it('should hide the rating, other sites and favorites before release', () => {
    const strip = toSubpageStrip({ ...params, media: { ...media, released: '2027-01-01' } });
    expect(strip).toMatchObject({ rating: undefined, external: [], counts: [] });
  });

  it('should leave the other sites off when the viewer turns them off', () => {
    expect(toSubpageStrip({ ...params, otherSiteRatings: false })?.external).toEqual([]);
  });
});
