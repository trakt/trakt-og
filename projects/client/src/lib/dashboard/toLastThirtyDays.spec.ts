import { describe, expect, it } from 'vitest';
import type { WatchedGenreRow } from '../users/profile/watchedGenresSchema.ts';
import { toLastThirtyDays } from './toLastThirtyDays.ts';

// A Wednesday: the window runs from Tuesday Sep 1.
const now = new Date('2026-09-30T15:00:00Z');
const start = '2026-08-31T00:00:00.000Z';

const episode = (id: number, watchedAt: string, runtime: number | null = 45, show = 1) => ({
  watched_at: watchedAt,
  episode: { ids: { trakt: id }, runtime },
  show: { ids: { trakt: show }, runtime: 30 },
});
const movie = (id: number, watchedAt: string, runtime = 120) => ({
  watched_at: watchedAt,
  movie: { ids: { trakt: id }, runtime },
});

const genre: WatchedGenreRow = {
  play_count: 2,
  genre: { slug: 'drama', name: 'Drama' },
  percentage: 100,
  percentage_row: 100,
  episodes: { play_count: 0, ids: [] },
  shows: { play_count: 0, ids: [] },
  movies: { play_count: 2, ids: [1, 2] },
};

const build = (
  { episodes = [], movies = [], timeZone = 'UTC', weekStartDay = 0, at = now }: {
    episodes?: ReturnType<typeof episode>[];
    movies?: ReturnType<typeof movie>[];
    timeZone?: string;
    weekStartDay?: 0 | 1;
    at?: Date;
  },
) => toLastThirtyDays({ episodes, movies, genres: [genre], start, slug: 'sean', now: at, timeZone, weekStartDay });

const key = (last: ReturnType<typeof build>, name: string) => last.keys.find((k) => k.name === name);

describe('mapper: toLastThirtyDays', () => {
  it('should chart today and the 29 days before it, oldest first, with the axis marks', () => {
    const days = build({ episodes: [episode(1, '2026-09-30T10:00:00Z')] }).chart?.days ?? [];

    expect(days).toHaveLength(30);
    expect(days.at(0)).toMatchObject({ date: '2026-09-01', axis: 'Sep 1', mark: 'month' });
    expect(days.at(1)).toMatchObject({ axis: '2', mark: null });
    expect(days.at(4)).toMatchObject({ axis: '5', mark: 'weekend' });
    expect(days.at(-1)).toMatchObject({
      date: '2026-09-30',
      axis: 'Today',
      mark: 'today',
      label: 'Wednesday — Sep 30',
    });
  });

  it("should put each play on its day in the viewer's zone and leave out anything older", () => {
    const last = build({
      episodes: [episode(1, '2026-09-29T02:00:00Z'), episode(2, '2026-08-31T12:00:00Z')],
      timeZone: 'America/New_York',
    });

    expect(last.chart?.days.find(({ date }) => date === '2026-09-28')?.minutes).toBe(45);
    expect(last.chart?.days.reduce((sum, { minutes }) => sum + minutes, 0)).toBe(45);
    expect(key(last, 'Episodes')?.share).toBe('1');
  });

  describe('for the bars and the scale', () => {
    it('should stack episodes and movies, falling back to the show runtime, under a two-hour top', () => {
      const { chart } = build({
        episodes: [episode(1, '2026-09-30T10:00:00Z'), episode(2, '2026-09-30T11:00:00Z', null)],
        movies: [movie(3, '2026-09-29T20:00:00Z', 50)],
      });

      expect(chart?.days.at(-1)).toMatchObject({ minutes: 75, episodes: 62.5, movies: 0, time: '1h 15m' });
      expect(chart?.days.at(-2)?.movies).toBeCloseTo(41.67);
      expect(chart?.hours).toEqual([{ label: '1h', height: 50 }, { label: '2h', height: 100 }]);
    });

    it('should round a busier top up to the hour', () => {
      const { chart } = build({ movies: [movie(1, '2026-09-30T10:00:00Z', 150)] });

      expect(chart?.hours.map(({ label }) => label)).toEqual(['1h', '2h', '3h']);
      expect(chart?.days.at(-1)?.movies).toBeCloseTo(83.33);
    });

    it('should step the hour lines so no more than four fit', () => {
      const { chart } = build({ movies: [movie(1, '2026-09-30T10:00:00Z', 600)] });

      expect(chart?.hours.map(({ label }) => label)).toEqual(['3h', '6h', '9h', '12h']);
    });

    it('should draw the average of the days with something watched', () => {
      const { chart } = build({
        episodes: [episode(1, '2026-09-30T10:00:00Z'), episode(2, '2026-09-30T11:00:00Z', null)],
        movies: [movie(3, '2026-09-29T20:00:00Z', 50)],
      });

      // (75 + 50) / 2 days, rounded.
      expect(chart?.average).toEqual({ label: '1h 3m average day', height: 52.5 });
    });
  });

  it('should count unique items with their plays and time in each tooltip line', () => {
    const { chart } = build({
      episodes: [
        episode(1, '2026-09-30T10:00:00Z'),
        episode(1, '2026-09-30T11:00:00Z'),
        episode(2, '2026-09-30T12:00:00Z'),
        episode(1, '2026-09-20T12:00:00Z'),
      ],
      movies: [movie(3, '2026-09-30T20:00:00Z')],
    });

    expect(chart?.days.at(-1)?.lines).toEqual([
      { type: 'episode', text: '2 episodes (3 plays) · 2h 15m' },
      { type: 'movie', text: '1 movie · 2h' },
    ]);
    expect(chart?.days.at(-11)?.lines).toEqual([{ type: 'episode', text: '1 episode · 45m' }]);
  });

  describe('for the weeks', () => {
    const plays = {
      episodes: [episode(1, '2026-09-16T12:00:00Z'), episode(2, '2026-09-29T12:00:00Z')],
      movies: [movie(3, '2026-09-14T12:00:00Z')],
    };

    it("should bracket the days from the viewer's first day of the week and pick out the best one", () => {
      const sunday = build(plays).chart?.weeks ?? [];
      const monday = build({ ...plays, weekStartDay: 1 }).chart?.weeks ?? [];

      expect(sunday.map(({ span }) => span)).toEqual([5, 7, 7, 7, 4]);
      expect(sunday.map(({ time }) => time)).toEqual(['', '', '2h 45m', '', '45m']);
      expect(sunday.map(({ best }) => best)).toEqual([false, false, true, false, false]);
      expect(monday.map(({ span }) => span)).toEqual([6, 7, 7, 7, 3]);
    });

    it('should name the best week in the keys, across a month end too', () => {
      expect(key(build(plays), 'Best week')).toMatchObject({ share: '2h 45m', counts: ['Sep 13 to 19'] });

      const late = build({ movies: [movie(1, '2026-10-01T12:00:00Z')], at: new Date('2026-10-02T15:00:00Z') });
      expect(key(late, 'Best week')?.counts).toEqual(['Sep 27 to Oct 2']);
    });
  });

  it('should sum the totals in the keys over the chart', () => {
    const last = build({
      episodes: [
        episode(1, '2026-09-30T10:00:00Z'),
        episode(1, '2026-09-30T11:00:00Z'),
        episode(2, '2026-09-30T12:00:00Z', 45, 2),
        episode(1, '2026-09-20T12:00:00Z'),
      ],
      movies: [movie(3, '2026-09-30T20:00:00Z')],
    });

    expect(last.keys).toEqual([
      { name: 'Time watched', share: '5h', counts: ['2 of 30 days'] },
      { name: 'Episodes', type: 'episode', share: '2', counts: ['3h', '2 shows', '4 plays'] },
      { name: 'Movies', type: 'movie', share: '1', counts: ['2h'] },
      { name: 'Best week', share: '4h 15m', counts: ['Sep 27 to 30'] },
    ]);
  });

  it("should link each day to the viewer's history for that day", () => {
    const { chart } = build({ movies: [movie(3, '2026-09-30T20:00:00Z')] });

    expect(chart?.days.at(-1)?.href).toBe('/users/sean/history?start_at=2026-09-30&days=1');
  });

  it('should drop the chart and keys with nothing watched, and keep the genres', () => {
    const last = build({});

    expect(last.chart).toBeNull();
    expect(last.keys).toEqual([]);
    expect(last.genres).toHaveLength(1);
  });

  it("should start the genre links at the window's first day", () => {
    const { genres } = build({});

    expect(genres.at(0)?.counts.at(0)?.href).toBe('/users/sean/history/movies/plays?genres=drama&start_at=2026-08-31');
  });
});
