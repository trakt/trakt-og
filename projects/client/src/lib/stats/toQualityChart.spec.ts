import { describe, expect, it } from 'vitest';
import type { QualityRead } from './QualityRead.ts';
import { toQualityChart } from './toQualityChart.ts';

const now = new Date('2026-06-01T00:00:00Z');

const seasons: QualityRead = {
  type: 'show',
  seasons: [
    { number: 0, ids: { trakt: 10 }, rating: 7.5, votes: 100, aired_episodes: 3 },
    { number: 1, ids: { trakt: 11 }, rating: 8.99, votes: 5000, aired_episodes: 10 },
    { number: 2, ids: { trakt: 12 }, rating: 4, votes: 9, aired_episodes: 10 },
    { number: 3, ids: { trakt: 13 }, rating: 0, votes: 0, aired_episodes: 0 },
    { number: 4, ids: { trakt: 14 }, rating: 7, votes: 10, episode_count: 8 },
  ],
};

const episodes: QualityRead = {
  type: 'season',
  season: 8,
  episodes: [
    { number: 1, title: 'Winterfell', ids: { trakt: 1 }, rating: 8.1, votes: 900, first_aired: '2026-01-01T00:00:00Z' },
    { season: 8, number: 2, title: null, ids: { trakt: 2 }, rating: 7, votes: 3, first_aired: '2026-01-08T00:00:00Z' },
    { number: 3, title: 'Later', ids: { trakt: 3 }, rating: 0, votes: 0, first_aired: '2027-01-01T00:00:00Z' },
    { number: 4, title: 'Unscheduled', ids: { trakt: 4 }, rating: 6.5, votes: 40 },
  ],
};

describe('util: toQualityChart', () => {
  describe('for a show', () => {
    it('should make one point per aired season, without specials', () => {
      const chart = toQualityChart({ read: seasons, href: '/shows/got', now });
      expect(chart?.unit).toBe('season');
      expect(chart?.points.map(({ label }) => label)).toEqual(['Season 1', 'Season 2', 'Season 4']);
    });

    it('should round percents down and leave a gap under 10 votes', () => {
      const chart = toQualityChart({ read: seasons, href: '/shows/got', now });
      expect(chart?.points.map(({ percent, votes }) => [percent, votes])).toEqual([
        [89, 5000],
        [null, 9],
        [70, 10],
      ]);
    });

    it('should link each season to its stats page', () => {
      const chart = toQualityChart({ read: seasons, href: '/shows/got', now });
      expect(chart?.points.at(0)).toMatchObject({
        href: '/shows/got/seasons/1/stats',
        traktId: 11,
        number: 1,
        axis: 'S1',
        name: 'Season 1',
      });
    });
  });

  describe('for a season', () => {
    it('should make one point per aired episode, named like OG', () => {
      const chart = toQualityChart({ read: episodes, href: '/shows/got/seasons/8', now });
      expect(chart?.unit).toBe('episode');
      expect(chart?.points.map(({ label, name, title }) => [label, name, title])).toEqual([
        ['E1', '8x01', 'Winterfell'],
        ['E2', '8x02', undefined],
        ['E4', '8x04', 'Unscheduled'],
      ]);
    });

    it('should link each episode to its stats page', () => {
      const chart = toQualityChart({ read: episodes, href: '/shows/got/seasons/8', now });
      expect(chart?.points.at(0)?.href).toBe('/shows/got/seasons/8/episodes/1/stats');
    });

    it('should carry the season rating as a labeled reference', () => {
      const chart = toQualityChart({ read: episodes, href: '/shows/got/seasons/8', reference: { percent: 59 }, now });
      expect(chart?.reference).toEqual({ percent: 59, label: 'Season' });
    });

    it('should leave the reference out when the season has no rating', () => {
      const chart = toQualityChart({ read: episodes, href: '/shows/got/seasons/8', reference: { percent: 0 }, now });
      expect(chart?.reference).toBeUndefined();
    });
  });

  it('should return null under two points', () => {
    const one: QualityRead = { type: 'show', seasons: seasons.type === 'show' ? seasons.seasons.slice(1, 2) : [] };
    expect(toQualityChart({ read: one, href: '/shows/got', now })).toBeNull();
  });

  it('should return null when no point has enough votes', () => {
    const quiet: QualityRead = {
      type: 'show',
      seasons: [
        { number: 1, ids: { trakt: 1 }, rating: 8, votes: 2, aired_episodes: 8 },
        { number: 2, ids: { trakt: 2 }, rating: 8, votes: 1, aired_episodes: 8 },
      ],
    };
    expect(toQualityChart({ read: quiet, href: '/shows/got', now })).toBeNull();
  });
});
