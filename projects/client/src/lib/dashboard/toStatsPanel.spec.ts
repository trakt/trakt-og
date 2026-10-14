import { describe, expect, it } from 'vitest';
import { dashboardFrameFixture } from './dashboardFrameFixture.ts';
import { toStatsPanel } from './toStatsPanel.ts';

const { stats: heavy, newStats } = dashboardFrameFixture;

describe('mapper: toStatsPanel', () => {
  describe('for all time', () => {
    it('should show years from a year of minutes up, with the plays', () => {
      expect(toStatsPanel(heavy).allTime).toEqual({
        value: '4.6',
        unit: 'years',
        spoken: '1668 days, 4 hours, 52 mins',
        plays: { text: '68,083', word: 'plays' },
      });
    });

    it('should drop to days under a year, and to hours under a day', () => {
      expect(toStatsPanel({ ...heavy, total_minutes: 436_144 }).allTime).toMatchObject({ value: '303', unit: 'days' });
      expect(toStatsPanel(newStats).allTime).toMatchObject({ value: '3', unit: 'hours' });
      expect(toStatsPanel({ ...newStats, total_minutes: 60 }).allTime.unit).toBe('hour');
    });
  });

  describe('for shows finished', () => {
    it('should give the finished of the watched, and split the meter', () => {
      const { finished } = toStatsPanel(heavy);

      expect(finished).toMatchObject({
        finished: '449',
        watched: '978',
        started: { text: '528', word: 'in progress' },
        dropped: { text: '1', word: 'dropped' },
      });
      expect(finished?.meter?.finished).toBeCloseTo((449 / 978) * 100);
      expect(finished?.meter?.started).toBeCloseTo((528 / 978) * 100);
      expect(finished?.meter?.dropped).toBeCloseTo((1 / 978) * 100);
    });

    it('should leave the meter out with no shows', () => {
      const progress = { finished: 0, started: 0, dropped: 0 };
      expect(toStatsPanel({ ...newStats, progress }).finished?.meter).toBeNull();
    });

    it('should leave the cell out when the stats came without progress', () => {
      expect(toStatsPanel({ ...heavy, progress: null }).finished).toBeNull();
    });
  });

  describe('for watched shows and movies', () => {
    it('should split each watch time into days, hours and minutes', () => {
      const panel = toStatsPanel(heavy);

      expect(panel.shows.time.parts).toEqual([
        { value: '1365', unit: 'd' },
        { value: '7', unit: 'h' },
        { value: '48', unit: 'm' },
      ]);
      expect(panel.shows.time.spoken).toBe('1365 days, 7 hours, 48 mins');
      expect(panel.movies.time.parts.map(({ value, unit }) => `${value}${unit}`).join(' ')).toBe('302d 21h 4m');
    });

    it('should count the plays and what was watched, exactly', () => {
      const { shows, movies } = toStatsPanel(heavy);

      expect(shows.plays).toEqual({ text: '64,168', word: 'plays' });
      expect(shows.episodes).toEqual({ text: '26,647', word: 'episodes' });
      expect(shows.shows).toEqual({ text: '978', word: 'shows' });
      expect(movies.plays).toEqual({ text: '3,915', word: 'plays' });
      expect(movies.movies).toEqual({ text: '1,787', word: 'movies' });
    });

    it('should use the singular for one', () => {
      expect(toStatsPanel(newStats).shows.shows).toEqual({ text: '1', word: 'show' });
    });

    it('should show a bare 0m with nothing watched', () => {
      expect(toStatsPanel(newStats).movies.time.parts).toEqual([{ value: '0', unit: 'm' }]);
    });
  });
});
