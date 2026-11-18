import { describe, expect, it } from 'vitest';
import { fromFilterDraft, toFilterDraft } from '../components/filters/filterDraft.ts';
import { parseAdvancedFilters } from '../components/filters/advancedFilters.ts';
import { calendarFilters } from './calendarFilters.ts';
import type { CalendarItem } from './calendarDays.ts';
import { toCalendarMonth } from './toCalendarMonth.ts';

const config = calendarFilters({ slug: 'shows-movies', now: new Date('2026-09-29T12:00:00.000Z') });
const filters = (search = '') =>
  fromFilterDraft(toFilterDraft(parseAdvancedFilters(new URLSearchParams(search)), config), config);

const episode = (trakt: number, season: number, title = `Show ${trakt}`): CalendarItem =>
  ({
    type: 'episode',
    at: '2026-09-30T01:00:00.000Z',
    show: { title, country: 'gb', ids: { trakt, slug: `s${trakt}` } },
    episode: { season, number: 1, title: 'Pilot', ids: { trakt: trakt * 100 + season } },
  }) as CalendarItem;
const movie = (trakt: number): CalendarItem =>
  ({
    type: 'movie',
    at: '2026-09-30',
    movie: { title: `Movie ${trakt}`, ids: { trakt, slug: `m${trakt}` } },
  }) as CalendarItem;

const base = {
  hidden: { shows: new Set<number>(), movies: new Set<number>() },
  hideSpecials: false,
  filters: filters(),
  dates: ['2026-09-29', '2026-09-30'],
  timeZone: 'UTC',
};
const ids = (days: ReturnType<typeof toCalendarMonth>['days']) =>
  days.flatMap(({ items }) =>
    items.map((item) =>
      item.type === 'movie' ? `m${item.movie.ids.trakt}` : `${item.show.ids.trakt}s${item.episode.season}`,
    ),
  );

describe('toCalendarMonth', () => {
  it('should put items on their days and keep every empty day', () => {
    const { days } = toCalendarMonth({ ...base, items: [episode(1, 1), movie(7)] });
    expect(days.map(({ date }) => date)).toEqual(['2026-09-29', '2026-09-30']);
    expect(ids(days)).toEqual(['m7', '1s1']);
  });

  it('should leave out what the viewer hid, and specials with the setting on', () => {
    const hidden = { shows: new Set([2]), movies: new Set([8]) };
    const items = [episode(1, 1), episode(1, 0), episode(2, 1), movie(7), movie(8)];
    expect(ids(toCalendarMonth({ ...base, items, hidden }).days)).toEqual(['m7', '1s1', '1s0']);
    expect(ids(toCalendarMonth({ ...base, items, hidden, hideSpecials: true }).days)).toEqual(['m7', '1s1']);
  });

  it('should count the unfiltered month for the totals only when given one', () => {
    const items = [episode(1, 1), movie(7)];
    expect(toCalendarMonth({ ...base, items }).totals).toBeUndefined();
    const month = toCalendarMonth({
      ...base,
      filters: filters('q=show+1'),
      items: [episode(1, 1)],
      unfilteredItems: [episode(1, 1), episode(2, 1), movie(7)],
    });
    expect(ids(month.days)).toEqual(['1s1']);
    expect(month.totals).toEqual({ episodes: 2, movies: 1 });
  });
});
