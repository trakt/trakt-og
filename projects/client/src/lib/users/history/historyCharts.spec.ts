import { describe, expect, it } from 'vitest';
import { type ChartRow, fromWatched, sortCharts, toChartsFromPlays, toEpisodeCharts } from './historyCharts.ts';
import { historyRowsSchema } from './historyRowsSchema.ts';

const show = (trakt: number, title: string, extra: Record<string, unknown> = {}) => ({
  title,
  ids: { trakt, slug: title.toLowerCase().replaceAll(' ', '-') },
  ...extra,
});
const row = (plays: number, last_watched_at: string, item: ReturnType<typeof show>) =>
  fromWatched({ plays, last_watched_at, show: item });

const rows: ChartRow[] = [
  row(3, '2026-09-29T00:00:00.000Z', show(1, 'The Wire', { runtime: 60, rating: 9, votes: 10 })),
  row(9, '2026-09-28T00:00:00.000Z', show(2, 'Alias', { runtime: 20, rating: 7, votes: 50 })),
  row(9, '2026-09-27T00:00:00.000Z', show(3, 'Lost', { runtime: 40, rating: 9, votes: 10 })),
  row(1, '2026-09-26T00:00:00.000Z', show(4, 'Dark', { first_aired: '2017-12-01T00:00:00.000Z', votes: 50 })),
];
const order = (charts: readonly ChartRow[]) => charts.map((chart) => ('show' in chart ? chart.show.title : ''));

describe('fromWatched', () => {
  it("should count a show's time at its runtime a play, or OG's 42 minutes without one", () => {
    expect(rows.map(({ minutes }) => minutes)).toEqual([180, 180, 360, 42]);
  });
});

describe('toChartsFromPlays', () => {
  it('should keep each title once, at its newest play, totalling plays and runtimes', () => {
    const plays = historyRowsSchema.parse([
      { id: 1, watched_at: '2026-09-29T00:00:00.000Z', movie: show(9, 'Heat', { runtime: 170 }) },
      {
        id: 2,
        watched_at: '2026-09-28T00:00:00.000Z',
        show: show(1, 'The Wire', { runtime: 60 }),
        episode: {
          ids: { trakt: 1 },
          season: 1,
          number: 1,
          runtime: 55,
        },
      },
      {
        id: 3,
        watched_at: '2026-09-27T00:00:00.000Z',
        show: show(1, 'The Wire', { runtime: 60 }),
        episode: {
          ids: { trakt: 2 },
          season: 1,
          number: 2,
        },
      },
      { id: 4, watched_at: '2026-09-26T00:00:00.000Z', movie: show(9, 'Heat', { runtime: 170 }) },
    ]);
    expect(toChartsFromPlays(plays)).toEqual([
      expect.objectContaining({ plays: 2, minutes: 340, last_watched_at: '2026-09-29T00:00:00.000Z' }),
      expect.objectContaining({ plays: 2, minutes: 115, last_watched_at: '2026-09-28T00:00:00.000Z' }),
    ]);
  });
});

describe('toEpisodeCharts', () => {
  const episodes = historyRowsSchema.parse(
    [
      [1, 2, 3, 'Pilot', 9, 5, '2005-03-24'],
      [2, 1, 4, 'Diversity Day', 8, 50, '2005-03-29'],
      [3, 2, 3, 'Pilot', 9, 5, '2005-03-24'],
      [4, 1, 1, 'Basketball', 7, 50, '2005-04-19'],
    ].map(([id, season, number, title, rating, votes, aired]) => ({
      id,
      watched_at: `2026-09-2${9 - Number(id)}T00:00:00.000Z`,
      show: show(1, 'The Office', { runtime: 22 }),
      episode: {
        ids: { trakt: Number(season) * 100 + Number(number) },
        season,
        number,
        title,
        rating,
        votes,
        first_aired: `${aired}T21:30:00.000Z`,
      },
    })),
  );
  const charts = toEpisodeCharts(episodes);
  const titles = (sorted: readonly ChartRow[]) => sorted.map((row) => ('episode' in row ? row.episode.title : ''));

  it('should keep each episode once, at its newest play, totalling plays and runtimes', () => {
    expect(charts.map(({ plays, minutes, last_watched_at }) => ({ plays, minutes, last_watched_at }))).toEqual([
      { plays: 2, minutes: 44, last_watched_at: '2026-09-28T00:00:00.000Z' },
      { plays: 1, minutes: 22, last_watched_at: '2026-09-27T00:00:00.000Z' },
      { plays: 1, minutes: 22, last_watched_at: '2026-09-25T00:00:00.000Z' },
    ]);
  });

  it('should sort the episodes by release date, plays, time, title, rating and votes', () => {
    expect(titles(sortCharts(charts, { by: 'released', how: 'asc' }))).toEqual([
      'Basketball',
      'Diversity Day',
      'Pilot',
    ]);
    expect(titles(sortCharts(charts, { by: 'released', how: 'desc' }))).toEqual([
      'Pilot',
      'Diversity Day',
      'Basketball',
    ]);
    expect(titles(sortCharts(charts, { by: 'time', how: 'asc' }))).toEqual(['Pilot', 'Diversity Day', 'Basketball']);
    expect(titles(sortCharts(charts, { by: 'plays', how: 'asc' }))).toEqual(['Pilot', 'Diversity Day', 'Basketball']);
    expect(titles(sortCharts(charts, { by: 'title', how: 'asc' }))).toEqual(['Basketball', 'Diversity Day', 'Pilot']);
    expect(titles(sortCharts(charts, { by: 'percentage', how: 'asc' }))).toEqual([
      'Pilot',
      'Diversity Day',
      'Basketball',
    ]);
    expect(titles(sortCharts(charts, { by: 'votes', how: 'asc' }))).toEqual(['Diversity Day', 'Basketball', 'Pilot']);
  });
});

describe('sortCharts', () => {
  it("should run each sort its own way by default, with OG's tie breaks", () => {
    expect(order(sortCharts(rows, { by: 'added', how: 'asc' }))).toEqual(['The Wire', 'Alias', 'Lost', 'Dark']);
    expect(order(sortCharts(rows, { by: 'plays', how: 'asc' }))).toEqual(['Alias', 'Lost', 'The Wire', 'Dark']);
    expect(order(sortCharts(rows, { by: 'time', how: 'asc' }))).toEqual(['Lost', 'Alias', 'The Wire', 'Dark']);
    expect(order(sortCharts(rows, { by: 'title', how: 'asc' }))).toEqual(['Alias', 'Dark', 'Lost', 'The Wire']);
    expect(order(sortCharts(rows, { by: 'released', how: 'asc' }))).toEqual(['Dark', 'The Wire', 'Lost', 'Alias']);
    expect(order(sortCharts(rows, { by: 'runtime', how: 'asc' }))).toEqual(['The Wire', 'Lost', 'Alias', 'Dark']);
    expect(order(sortCharts(rows, { by: 'percentage', how: 'asc' }))).toEqual(['The Wire', 'Lost', 'Alias', 'Dark']);
    expect(order(sortCharts(rows, { by: 'votes', how: 'asc' }))).toEqual(['Dark', 'Alias', 'The Wire', 'Lost']);
  });

  it('should flip every key on desc', () => {
    expect(order(sortCharts(rows, { by: 'plays', how: 'desc' }))).toEqual(['Dark', 'The Wire', 'Lost', 'Alias']);
    expect(order(sortCharts(rows, { by: 'title', how: 'desc' }))).toEqual(['The Wire', 'Lost', 'Dark', 'Alias']);
  });
});
