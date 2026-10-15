import type { RatingsResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import type { SubpageMedia } from '../subpage/toSubpageMedia.ts';
import { toMediaStats } from './toMediaStats.ts';

const media: SubpageMedia = {
  item: { type: 'movie', id: 1, title: 'Fight Club' },
  title: 'Fight Club',
  href: '/movies/fight-club-1999',
  released: '1999-10-15',
  parents: [],
  links: [],
};
const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 1, 7: 2, 8: 9, 9: 50, 10: 105 };
const ratings: RatingsResponse = {
  trakt: { rating: 8.999, votes: 2723, distribution },
  imdb: { rating: 8.8, votes: 1000000, link: 'https://www.imdb.com/title/tt0137523' },
};
const stats = { watchers: 1, plays: 2, collectors: 3, comments: 4, lists: 5, favorited: 6, votes: 2723 };
const params = {
  media,
  ratings,
  stats,
  rank: { rank: 10, delta: 1, link: 'https://www.justwatch.com/us/movie/fight-club' },
  otherSiteRatings: true,
  now: new Date('2026-09-30T00:00:00Z'),
};

describe('toMediaStats', () => {
  it('should use extended Trakt ratings, truncate the percent and keep API totals independent of the distribution', () => {
    const view = toMediaStats(params);
    expect(view).toMatchObject({ percent: 89, level: 8, votes: 2723 });
    expect(view.ratings.chart?.bars).toHaveLength(10);
    expect(view.ratings.chart?.unit).toBe('vote');
    expect(view.ratings.keys.map(({ name }) => name)).toEqual(['Rating', 'Votes', 'Most given', 'Liked it']);
    expect(view.strip.rating).toEqual({ value: 8.999, votes: 2723, href: `${media.href}/stats` });
  });

  it('should keep only favorites on the strip and move the rest into the community tiles, favorites first', () => {
    const view = toMediaStats(params);
    expect(view.strip.counts).toEqual([{ count: 6, label: 'favorited' }]);
    expect(view.community.map(({ kind }) => kind)).toEqual([
      'favorited',
      'watchers',
      'plays',
      'libraries',
      'lists',
      'comments',
    ]);
  });

  it('should compare the other sites with a score to Trakt, leaving JustWatch on the strip', () => {
    const view = toMediaStats(params);
    expect(view.strip.external.map(({ title }) => title)).toEqual(['IMDb', 'JustWatch']);
    expect(view.sites.map(({ title, score, diff }) => [title, score, diff.text])).toEqual([['IMDb', 88, '−1']]);
  });

  it('should key the chart with the rating in its color, the vote total, the most given rating and the share who liked it', () => {
    const view = toMediaStats({
      ...params,
      stats: { ...stats, watchers: 89_734 },
      ratings: { trakt: { rating: 7.1, votes: 17_976, distribution } },
    });
    expect(view.ratings.keys).toEqual([
      { name: 'Rating', rating: 7, share: '71%', counts: ['Good'] },
      { name: 'Votes', share: '17,976', counts: ['20% of watchers'] },
      { name: 'Most given', rating: 10, share: '10 · Totally Ninja!', counts: ['63% of 17,976 votes'] },
      { name: 'Liked it', rating: 7, share: '99%', counts: ['gave it 7 or higher'] },
    ]);
    expect(toMediaStats({ ...params, stats: { ...stats, watchers: 0 } }).ratings.keys.at(1)?.counts).toEqual([]);
  });

  it('should add Letterboxd to the strip and the other sites, and hide it with them', () => {
    const letterboxd = { rating: 4.2, votes: 10, link: 'https://letterboxd.com/film/fight-club' };
    const view = toMediaStats({ ...params, letterboxd });
    expect(view.sites.map(({ title }) => title)).toEqual(['IMDb', 'Letterboxd']);
    expect(view.strip.external.map(({ title }) => title)).toEqual(['IMDb', 'Letterboxd', 'JustWatch']);
    expect(toMediaStats({ ...params, letterboxd, otherSiteRatings: false }).sites).toEqual([]);
  });

  it('should leave the chart out when no one has voted', () => {
    const view = toMediaStats({ ...params, ratings: { rating: 0, votes: 0 } });
    expect(view.ratings.chart).toBeNull();
    expect(view.votes).toBe(0);
  });

  it('should omit external ratings and favorites for seasons, and target the season for viewer writes', () => {
    const season: SubpageMedia = {
      ...media,
      item: { type: 'season', id: 3950, title: 'Breaking Bad Season 1', show: 1388, number: 1 },
      href: '/shows/breaking-bad/seasons/1',
    };
    const view = toMediaStats({ ...params, media: season });
    expect(view.strip.external).toEqual([]);
    expect(view.sites).toEqual([]);
    expect(view.strip.counts).toEqual([]);
    expect(view.community.map(({ kind }) => kind)).not.toContain('favorited');
    expect(view.community.find(({ kind }) => kind === 'comments')?.href).toBe(`${season.href}/comments`);
    expect(view.strip.ratingTarget).toEqual({ type: 'season', id: 3950, title: 'Breaking Bad Season 1' });
  });

  it('should show no ratings and only the list count before release', () => {
    const future = { ...media, released: '2027-01-01' };
    const view = toMediaStats({ ...params, media: future, otherSiteRatings: false });
    expect(view.strip.rating).toBeUndefined();
    expect(view.strip.external).toEqual([]);
    expect(view.strip.counts).toEqual([]);
    expect(view.ratings.chart).toBeNull();
    expect(view.votes).toBe(0);
    expect(view.community.map(({ kind }) => kind)).toEqual(['lists']);
    expect(toMediaStats({ ...params, media: { ...media, released: undefined } }).strip.rating).toBeUndefined();
  });
});
