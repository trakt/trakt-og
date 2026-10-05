import { describe, expect, it } from 'vitest';
import { userStatsSchema } from '../stats/userStatsSchema.ts';
import { dashboardFrameFixture } from './dashboardFrameFixture.ts';
import { toStatsBand } from './toStatsBand.ts';

const { stats: heavy, newStats, collected } = dashboardFrameFixture;
const loading = { episodes: undefined, shows: undefined, movies: undefined };

describe('mapper: toStatsBand', () => {
  describe('the headline', () => {
    it('should show years from a year of minutes up, with the exact time', () => {
      expect(toStatsBand(heavy, collected).time).toEqual({ value: '4.6', unit: 'years', exact: '1668d 4h 52m' });
    });

    it('should drop to days under a year, and to hours under a day', () => {
      expect(toStatsBand({ ...heavy, total_minutes: 436_144 }, collected).time)
        .toEqual({ value: '303', unit: 'days', exact: '302d 21h 4m' });
      expect(toStatsBand(newStats, collected).time).toEqual({ value: '3', unit: 'hours', exact: '3h 20m' });
    });

    it('should say one hour, not one hours', () => {
      expect(toStatsBand({ ...newStats, total_minutes: 60 }, collected).time.unit).toBe('hour');
    });

    it('should count plays and whole days', () => {
      const band = toStatsBand(heavy, collected);

      expect(band.plays).toEqual({ text: '68.1k', exact: '68,083' });
      expect(band.days).toEqual({ text: '1,668', exact: null });
    });
  });

  it('should round from 10,000 up and keep smaller counts exact', () => {
    const band = toStatsBand(heavy, collected);

    expect(band.library?.episodes).toEqual({ text: '19.8k', exact: '19,760' });
    expect(band.library?.movies).toEqual({ text: '3,196', exact: null });
    expect(toStatsBand({ ...heavy, network: { ...heavy.network, followers: 10_000 } }, collected).followers)
      .toEqual({ text: '10.0k', exact: '10,000' });
    expect(toStatsBand({ ...heavy, network: { ...heavy.network, followers: 9999 } }, collected).followers)
      .toEqual({ text: '9,999', exact: null });
  });

  describe('shows finished', () => {
    it('should split the meter into finished, in progress and dropped shares', () => {
      const { shows } = toStatsBand(heavy, collected);

      expect(shows?.finished.text).toBe('449');
      expect(shows?.watched.text).toBe('978');
      expect(shows?.meter?.finished).toBeCloseTo((449 / 978) * 100);
      expect(shows?.meter?.started).toBeCloseTo((528 / 978) * 100);
      expect(shows?.meter?.dropped).toBeCloseTo((1 / 978) * 100);
    });

    it('should leave the meter out with no shows', () => {
      const progress = { finished: 0, started: 0, dropped: 0 };

      expect(toStatsBand({ ...newStats, progress }, collected).shows?.meter).toBeNull();
    });
  });

  describe('ratings', () => {
    it('should average the spread to one place and put the tick under it', () => {
      const { ratings } = toStatsBand(heavy, collected);

      expect(ratings.total.text).toBe('261');
      expect(ratings.average).toBe('8.2');
      expect(ratings.bars).toHaveLength(10);
      expect(ratings.bars.at(9)?.top).toBe(true);
      // 8.2 sits 7.7 bars along.
      expect(ratings.tick).toBeCloseTo(77.3, 0);
    });

    it('should have no bars and no average without ratings', () => {
      const { ratings } = toStatsBand(newStats, collected);

      expect(ratings.bars).toEqual([]);
      expect(ratings.average).toBeNull();
    });
  });

  it('should add up the comments on every type and count the lists', () => {
    const { comments } = toStatsBand(heavy, collected);

    expect(comments.total.text).toBe('85');
    expect([comments.movies.text, comments.shows.text, comments.lists?.text]).toEqual(['40', '38', '12']);
  });

  it('should wait for every library count before showing any', () => {
    expect(toStatsBand(heavy, loading).library).toBeNull();
    expect(toStatsBand(heavy, { ...collected, shows: undefined }).library).toBeNull();
    expect(toStatsBand(heavy, { episodes: 0, shows: 0, movies: 0 }).library?.movies.text).toBe('0');
  });

  it('should show a new member zero followers and friends', () => {
    const band = toStatsBand(newStats, collected);

    expect([band.followers.text, band.friends.text]).toEqual(['0', '0']);
  });

  describe('for stats without progress, lists or totals', () => {
    const { progress: _progress, lists: _lists, total_minutes: _minutes, total_plays: _plays, ...older } = heavy;
    const band = toStatsBand(userStatsSchema.parse({ ...older, ratings: { total: 0, distribution: {} } }), collected);

    it('should leave out shows finished and the list count', () => {
      expect(band.shows).toBeNull();
      expect(band.comments.lists).toBeNull();
      expect(band.comments.total.text).toBe('85');
    });

    it('should headline the time added up from episodes and movies', () => {
      expect(band.time.exact).toBe('1668d 4h 52m');
      expect(band.plays.exact).toBe('68,083');
    });

    it('should treat an empty spread as no ratings', () => {
      expect(band.ratings.bars).toEqual([]);
      expect(band.ratings.average).toBeNull();
    });
  });
});
