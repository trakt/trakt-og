import type { CalendarShowResponse, ShowAnticipatedResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toPremieres } from './toPremieres.ts';

const show = (id: number, extra: object = {}) => ({
  ids: { trakt: id, slug: `show-${id}` },
  title: `Show ${id}`,
  network: 'CBS',
  votes: 0,
  rating: 8.1,
  images: { fanart: [`media.trakt.tv/images/${id}/fanarts/medium/a.jpg.webp`], logo: [] },
  ...extra,
});
const premiere = (id: number, type: string, at: string, extra: object = {}) =>
  ({
    first_aired: at,
    episode: { season: type === 'series_premiere' ? 1 : 9, number: 1, episode_type: type },
    show: show(id, extra),
  }) as unknown as CalendarShowResponse;
const anticipated = (id: number, lists: number, extra: object = {}) =>
  ({ list_count: lists, show: show(id, extra) }) as unknown as ShowAnticipatedResponse;

const now = new Date('2026-10-07T16:00:00Z');
const until = new Date('2027-01-05T00:00:00Z');
const run = (premieres: CalendarShowResponse[], rows: ShowAnticipatedResponse[] = []) =>
  toPremieres({ premieres, anticipated: rows, now, until, timeZone: 'America/New_York' });

describe('toPremieres', () => {
  it('should keep popular returning seasons and anticipated new series, most anticipated first', () => {
    const premieres = run(
      [
        premiere(1, 'season_premiere', '2026-10-08T01:00:00Z', { votes: 4000 }),
        premiere(2, 'season_premiere', '2026-10-08T01:00:00Z', { votes: 300 }),
        premiere(3, 'series_premiere', '2026-10-09T01:00:00Z'),
        premiere(4, 'series_premiere', '2026-10-09T01:00:00Z'),
      ],
      [anticipated(3, 8000), anticipated(4, 20)],
    );

    expect(premieres.map(({ id, kind, lists }) => [id, kind, lists])).toEqual([
      [3, 'series', 8000],
      [1, 'season', undefined],
    ]);
  });

  it("should add anticipated series due before the cutoff, and give the day in the viewer's zone", () => {
    const premieres = run([], [
      anticipated(5, 900, { first_aired: '2026-12-25T02:00:00Z' }),
      anticipated(6, 900, { first_aired: '2027-03-01T00:00:00Z' }),
    ]);

    expect(premieres.map(({ id, day, season }) => [id, day, season])).toEqual([[5, '2026-12-24', 1]]);
  });

  it("should leave a new series' rating out, and drop what's aired and what has no fanart", () => {
    const premieres = run([
      premiere(7, 'series_premiere', '2026-10-10T01:00:00Z', { votes: 500 }),
      premiere(8, 'season_premiere', '2026-10-01T01:00:00Z', { votes: 5000 }),
      premiere(9, 'season_premiere', '2026-10-10T01:00:00Z', { votes: 5000, images: { fanart: [], logo: [] } }),
    ]);

    expect(premieres.map(({ id, rating }) => [id, rating])).toEqual([[7, undefined]]);
  });

  it('should show each show once', () => {
    const premieres = run([premiere(1, 'season_premiere', '2026-10-08T01:00:00Z', { votes: 4000 })], [
      anticipated(1, 100, { first_aired: '2026-10-08T01:00:00Z' }),
    ]);

    expect(premieres).toHaveLength(1);
  });
});
