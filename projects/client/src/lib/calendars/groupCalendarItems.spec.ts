import { describe, expect, it } from 'vitest';
import type { CalendarItem } from './calendarDays.ts';
import { groupCalendarItems } from './groupCalendarItems.ts';

const episode = (show: number, season: number, number: number, at = '2026-10-15T07:00:00.000Z') =>
  ({
    type: 'episode',
    at,
    show: { title: `Show ${show}`, ids: { trakt: show, slug: `show-${show}` } },
    episode: { season, number, ids: { trakt: show * 100 + number } },
  }) as CalendarItem;
const movie = {
  type: 'movie',
  at: '2026-10-15',
  movie: { title: 'Arrival', ids: { trakt: 7, slug: 'arrival' } },
} as CalendarItem;

describe('groupCalendarItems', () => {
  it("should put a show's episodes on one card where its first one aired", () => {
    const items = [movie, episode(1, 4, 2), episode(2, 1, 5), episode(1, 4, 1)];
    expect(groupCalendarItems(items, true)).toEqual([
      { key: 'movie-7', items: [movie] },
      { key: 'group-1-101', items: [episode(1, 4, 1), episode(1, 4, 2)] },
      { key: 'episode-205', items: [episode(2, 1, 5)] },
    ]);
  });

  it('should give every entry its own card when not grouping', () => {
    const items = [episode(1, 4, 1), episode(1, 4, 2)];
    expect(groupCalendarItems(items, false).map(({ key }) => key)).toEqual(['episode-101', 'episode-102']);
  });
});
