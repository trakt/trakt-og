import { describe, expect, it } from 'vitest';
import type { CalendarDay, CalendarItem } from './calendarDays.ts';
import { groupLabel } from './groupLabel.ts';

const episode = (season: number, number: number) =>
  ({
    type: 'episode',
    at: '2026-10-15T07:00:00.000Z',
    show: { title: 'Love is Blind', ids: { trakt: 1, slug: 'love-is-blind' } },
    episode: { season, number, ids: { trakt: season * 100 + number } },
  }) as CalendarItem;
const run = (season: number, from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => episode(season, from + i));

describe('groupLabel', () => {
  it('should call two episodes a double episode', () => {
    const items = run(13, 7, 8);
    expect(groupLabel({ group: { key: 'g', items }, days: [{ date: '2026-10-08', items }] })).toBe('Double episode');
  });

  it('should call a drop that starts the season and has nothing after it a full season', () => {
    const items = run(4, 1, 8);
    expect(groupLabel({ group: { key: 'g', items }, days: [{ date: '2026-10-15', items }] })).toBe(
      'Full season · 8 episodes',
    );
  });

  it('should number the batches of a season that drops in several', () => {
    const days: CalendarDay[] = [
      { date: '2026-10-14', items: run(11, 1, 5) },
      { date: '2026-10-21', items: run(11, 6, 8) },
      { date: '2026-10-28', items: run(11, 9, 11) },
    ];
    expect(groupLabel({ group: { key: 'g', items: run(11, 6, 8) }, days })).toBe('Batch 2 of 3 · 3 episodes');
  });

  it('should count the episodes otherwise, and say nothing for one', () => {
    const items = run(2, 4, 6);
    const days = [{ date: '2026-10-15', items }, { date: '2026-10-22', items: [episode(2, 7)] }];
    expect(groupLabel({ group: { key: 'g', items }, days })).toBe('3 episodes');
    expect(groupLabel({ group: { key: 'g', items: [episode(2, 7)] }, days })).toBeUndefined();
  });
});
