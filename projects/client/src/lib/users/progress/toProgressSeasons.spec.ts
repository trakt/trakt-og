import { describe, expect, it } from 'vitest';
import type { ProgressSeasonData } from './ProgressItem.ts';
import type { ProgressType } from './progressTypes.ts';
import { toProgressSeasons } from './toProgressSeasons.ts';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'UTC', weekStartDay: 0 } as const;
const aired = (number: number) => `2026-09-${String(number).padStart(2, '0')}T20:00:00.000Z`;

const season = (
  number: number,
  done: readonly boolean[],
  { upcoming = 0, collected = [], title }: { upcoming?: number; collected?: readonly number[]; title?: string } = {},
): ProgressSeasonData => ({
  number,
  title,
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
    plays: watched && index === 0 ? 3 : watched ? 1 : 0,
    minutesWatched: 0,
    at: watched ? '2026-09-29T20:00:00.000Z' : undefined,
    firstAired: aired(index + 1),
    runtime: 22,
    rating: 8.1,
    screenshot: index === 0 ? 'media.trakt.tv/images/episodes/1/screenshots/medium/a.jpg.webp' : undefined,
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
    it('should link each season with its percent, count and time left', () => {
      const result = seasons([
        season(1, [true, true]),
        season(2, [true, true, false]),
        season(3, [], { upcoming: 3 }),
      ]);

      expect(result.map(({ name, href, percent, complete, count, timeLeft, announced }) => ({
        name,
        href,
        percent,
        complete,
        count,
        timeLeft,
        announced,
      }))).toEqual([
        {
          name: 'Season 1',
          href: '/shows/x/seasons/1',
          percent: 100,
          complete: true,
          count: '2/2',
          timeLeft: undefined,
          announced: undefined,
        },
        {
          name: 'Season 2',
          href: '/shows/x/seasons/2',
          percent: 66,
          complete: false,
          count: '2/3',
          timeLeft: '22m',
          announced: undefined,
        },
        {
          name: 'Season 3',
          href: '/shows/x/seasons/3',
          percent: 0,
          complete: false,
          count: '0/0',
          timeLeft: undefined,
          announced: 3,
        },
      ]);
    });

    it('should keep a season title only when it says more than the name', () => {
      expect(
        seasons([season(1, [true], { title: 'The Streets' }), season(2, [true], { title: 'Season 2' })]).map((
          { title },
        ) => title),
      ).toEqual(['The Streets', undefined]);
    });

    it('should name specials apart', () => {
      expect(seasons([season(0, [false])]).at(0)?.name).toBe('Specials');
    });

    it('should leave the time left out on the library tab', () => {
      expect(seasons([season(1, [true, false])], undefined, 'library').at(0)?.timeLeft).toBeUndefined();
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

    it('should give each tooltip its air date, runtime and rating, then its status lines', () => {
      expect(squares.map(({ meta, lines }) => ({ meta, lines }))).toEqual([
        { meta: 'Sep 1, 2026 · 22m · 81%', lines: [{ text: 'Watched Sep 29, 2026 · 3 plays', tone: 'watched' }] },
        { meta: 'Sep 2, 2026 · 22m · 81%', lines: [{ text: 'Up next', tone: 'next' }] },
        { meta: 'Sep 3, 2026 · 22m · 81%', lines: [{ text: 'Not watched', tone: 'muted' }] },
        { meta: undefined, lines: [{ text: 'Airs Jan 14, 2027', tone: 'muted' }] },
        { meta: undefined, lines: [{ text: 'Airs TBA', tone: 'muted' }] },
      ]);
    });

    it('should show the screenshot in the tooltip at thumb size', () => {
      expect(squares.at(0)?.image).toBe('https://media.trakt.tv/images/episodes/1/screenshots/thumb/a.jpg.webp');
      expect(squares.at(1)?.image).toBeUndefined();
    });

    it('should mark episodes in your library that are not watched yet', () => {
      const [watched, collected, neither] =
        seasons([season(1, [true, false, false], { collected: [1, 2] })]).at(0)?.squares ?? [];

      expect([watched?.collected, collected?.collected, neither?.collected]).toEqual([false, true, false]);
      expect(collected?.label).toBe('1x02 "E2", not watched, in your library, aired Sep 2, 2026');
      expect(collected?.lines).toEqual([
        { text: 'Not watched', tone: 'muted' },
        { text: 'In your library', tone: 'collected' },
      ]);
    });

    it('should say in your library on the library tab, without the library mark or plays', () => {
      const [square] = seasons([season(1, [true, false], { collected: [1] })], undefined, 'library').at(0)?.squares ??
        [];
      expect(square).toMatchObject({
        label: '1x01 "E1", in your library, added Sep 29, 2026',
        collected: false,
        lines: [{ text: 'In your library, added Sep 29, 2026', tone: 'collected' }],
      });
    });
  });
});
