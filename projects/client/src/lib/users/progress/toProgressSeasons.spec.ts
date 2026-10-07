import { describe, expect, it } from 'vitest';
import type { ProgressSeasonData } from './ProgressItem.ts';
import type { ProgressType } from './progressTypes.ts';
import { toProgressSeasons } from './toProgressSeasons.ts';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const aired = (number: number) => `2026-09-${String(number).padStart(2, '0')}T20:00:00.000Z`;

const season = (
  number: number,
  done: readonly boolean[],
  { upcoming = 0, collected = [] }: { upcoming?: number; collected?: readonly number[] } = {},
): ProgressSeasonData => ({
  number,
  aired: done.length,
  completed: done.filter(Boolean).length,
  plays: 0,
  minutesWatched: 0,
  minutesLeft: done.filter((watched) => !watched).length * 22,
  episodes: done.map((watched, index) => ({
    number: index + 1,
    title: `E${index + 1}`,
    done: watched,
    collected: collected.includes(index + 1),
    plays: 0,
    minutesWatched: 0,
    at: watched ? '2026-09-29T20:00:00.000Z' : undefined,
    firstAired: aired(index + 1),
    runtime: 22,
    rating: 8.1,
  })),
  upcoming: Array.from(
    { length: upcoming },
    (_, index) => ({
      number: done.length + index + 1,
      firstAired: index === 0 ? '2027-01-14T20:00:00.000Z' : undefined,
    }),
  ),
});

const seasons = (
  data: readonly ProgressSeasonData[],
  next?: { season: number; number: number },
  type: ProgressType = 'watched',
) => toProgressSeasons({ seasons: data, next, showHref: '/shows/x', type, datePreferences });

describe('toProgressSeasons', () => {
  describe('the seasons', () => {
    it('should link each season and floor its percent, with its summary', () => {
      const result = seasons([
        season(1, [true, true]),
        season(2, [true, true, false]),
        season(3, [], { upcoming: 3 }),
      ]);

      expect(result.map(({ name, href, percent, complete, announced, summary }) => ({
        name,
        href,
        percent,
        complete,
        announced,
        summary,
      }))).toEqual([
        {
          name: 'Season 1',
          href: '/shows/x/seasons/1',
          percent: 100,
          complete: true,
          announced: false,
          summary: '2/2',
        },
        {
          name: 'Season 2',
          href: '/shows/x/seasons/2',
          percent: 66,
          complete: false,
          announced: false,
          summary: '2/3 · 22m left',
        },
        {
          name: 'Season 3',
          href: '/shows/x/seasons/3',
          percent: 0,
          complete: false,
          announced: true,
          summary: '3 announced',
        },
      ]);
    });

    it('should name specials apart', () => {
      expect(seasons([season(0, [false])]).at(0)?.name).toBe('Specials');
    });

    it('should leave the time left out on the library tab', () => {
      expect(seasons([season(1, [true, false])], undefined, 'library').at(0)?.summary).toBe('1/2');
    });
  });

  describe('the squares', () => {
    const squares =
      seasons([season(1, [true, false, false], { upcoming: 2 })], { season: 1, number: 2 }).at(0)?.squares ?? [];

    it('should map each episode to its state', () => {
      expect(squares.map(({ state }) => state)).toEqual([
        'watched',
        'up-next',
        'not-watched',
        'not-aired',
        'not-aired',
      ]);
    });

    it('should label each square with its code, title, state and date', () => {
      expect(squares.map(({ label }) => label)).toEqual([
        '1x01 "E1", watched Sep 29, 2026',
        '1x02 "E2", up next, aired Sep 2, 2026',
        '1x03 "E3", not watched, aired Sep 3, 2026',
        '1x04, airs Jan 14, 2027',
        '1x05, airs TBA',
      ]);
    });

    it('should read out the air date, runtime, rating and status', () => {
      expect(squares.at(1)).toMatchObject({
        code: '1x02',
        title: 'E2',
        href: '/shows/x/seasons/1/episodes/2',
        readout: 'Sep 2, 2026 · 22m · 81% · up next',
      });
    });

    it('should mark episodes in your library that are not watched yet', () => {
      const [watched, collected, neither] =
        seasons([season(1, [true, false, false], { collected: [1, 2] })]).at(0)?.squares ?? [];

      expect([watched?.collected, collected?.collected, neither?.collected]).toEqual([false, true, false]);
      expect(collected?.label).toBe('1x02 "E2", not watched, in your library, aired Sep 2, 2026');
      expect(collected?.readout).toBe('Sep 2, 2026 · 22m · 81% · not watched · in your library');
    });

    it('should say in your library on the library tab, without the library mark', () => {
      const [square] = seasons([season(1, [true, false], { collected: [1] })], undefined, 'library').at(0)?.squares ??
        [];
      expect(square).toMatchObject({ label: '1x01 "E1", in your library, added Sep 29, 2026', collected: false });
    });
  });
});
