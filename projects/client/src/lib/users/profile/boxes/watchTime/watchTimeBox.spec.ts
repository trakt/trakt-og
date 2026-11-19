import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { watchTimeBox } from './watchTimeBox.ts';

const { maya, sam } = boxPersonas;

describe('watchTimeBox', () => {
  it('should sum 30 UTC days of plays into hours, beside all time', async () => {
    const { score, entry } = await watchTimeBox.evaluate(maya.input, maya.extras());
    const view = entry?.view;

    expect(score).toBe(97);
    expect(view).toMatchObject({
      month: { hours: '121h', episodes: 159, movies: 1, activeDays: 27 },
      allTime: { time: '104d 7h', shows: 114, episodes: 3410, movies: 72 },
    });
  });

  it('should count years once the time runs past one', async () => {
    const minutes = (365 + 290) * 1440 + 6 * 60;
    const stats = {
      ...maya.input.stats,
      episodes: { ...maya.input.stats.episodes, minutes },
      movies: { ...maya.input.stats.movies, minutes: 0 },
    };
    expect((await watchTimeBox.evaluate({ ...maya.input, stats }, maya.extras())).entry?.view).toMatchObject({
      allTime: { time: '1y 290d 6h' },
    });
  });

  it('should open on the last 30 days for a member who joined within them', async () => {
    expect((await watchTimeBox.evaluate(sam.input, sam.extras())).entry?.view).toMatchObject({ opens: 'month' });
    expect((await watchTimeBox.evaluate(maya.input, maya.extras())).entry?.view).toMatchObject({ opens: 'all' });
  });

  it('should leave out plays older than 30 days and count movies', async () => {
    const old = { watched_at: '2026-09-01T10:00:00.000Z', movie: { ids: { trakt: 1, slug: 'x' }, title: 'X' } };
    const input = { ...sam.input, recent: { episodes: [], movies: [...sam.input.recent.movies, old] } };
    expect((await watchTimeBox.evaluate(input, sam.extras())).entry?.view).toMatchObject({
      month: { hours: '4.0h', episodes: 0, movies: 2, activeDays: 2 },
    });
  });

  it('should still score a user with nothing this month but plays all time', async () => {
    const input = { ...sam.input, recent: { episodes: [], movies: [] }, latest: {} };
    const { score, entry } = await watchTimeBox.evaluate(input, sam.extras());
    expect(score).toBe(0);
    expect(entry?.view).toMatchObject({ month: { hours: '0.0h', activeDays: 0 } });
  });
});
