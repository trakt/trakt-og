import { describe, expect, it } from 'vitest';
import { boxPersonas } from '../boxPersonas.ts';
import { watchTimeBox } from './watchTimeBox.ts';

const { maya, sam } = boxPersonas;

describe('watchTimeBox', () => {
  it('should sum 30 UTC days of plays into hours, daily bars and the all-time footer', async () => {
    const { score, entry } = await watchTimeBox.evaluate(maya.input, maya.extras());
    const view = entry?.view;

    expect(score).toBe(97);
    expect(view).toMatchObject({
      hours: '121h',
      summary: '159 eps · 1 movie · 27 active days',
      allTime: { time: '104d 7h', episodes: '3,410 eps', movies: '72 movies' },
    });
    expect(view?.days).toHaveLength(30);
    expect(view?.days.filter(({ peak }) => peak)).toEqual([{ height: 100, peak: true, title: 'Sep 12: 10h 30m' }]);
    expect(view?.days.at(-1)).toMatchObject({ title: 'Oct 5: 1h 30m' });
    expect(view?.chartLabel).toBe('Time watched per day for the last 30 days. Busiest: Sep 12, 10h 30m.');
  });

  it('should leave out plays older than 30 days and count movies', async () => {
    const old = { watched_at: '2026-09-01T10:00:00.000Z', movie: { ids: { trakt: 1, slug: 'x' }, title: 'X' } };
    const input = { ...sam.input, recent: { episodes: [], movies: [...sam.input.recent.movies, old] } };
    expect((await watchTimeBox.evaluate(input, sam.extras())).entry?.view).toMatchObject({
      hours: '4.0h',
      summary: '2 movies · 2 active days',
    });
  });

  it('should still score a user with nothing this month but plays all time', async () => {
    const input = { ...sam.input, recent: { episodes: [], movies: [] }, latest: {} };
    const { score, entry } = await watchTimeBox.evaluate(input, sam.extras());
    expect(score).toBe(0);
    expect(entry?.view).toMatchObject({ hours: '0.0h', chartLabel: 'Nothing watched in the last 30 days.' });
  });
});
