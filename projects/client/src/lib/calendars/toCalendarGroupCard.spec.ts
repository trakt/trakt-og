import { describe, expect, it } from 'vitest';
import type { CalendarItem } from './calendarDays.ts';
import { toCalendarGroupCard } from './toCalendarGroupCard.ts';

const episode = (number: number, episode_type = 'standard') =>
  ({
    type: 'episode',
    at: '2026-10-15T07:00:00.000Z',
    show: { title: 'The Diplomat', ids: { trakt: 1, slug: 'the-diplomat' }, network: 'Netflix', rating: 8.2 },
    episode: { season: 4, number, title: `Episode ${number}`, episode_type, rating: 7.5, ids: { trakt: 400 + number } },
  }) as CalendarItem;
const UTC = { timeZone: 'UTC', hour24: false };

describe('toCalendarGroupCard', () => {
  const items = [episode(1, 'season_premiere'), episode(2), episode(3, 'season_finale')];
  const card = toCalendarGroupCard({
    group: { key: 'group-1-401', items },
    label: 'Full season · 3 episodes',
    clock: UTC,
  });

  it('should title the card with the range and the label, and link the season', () => {
    expect(card).toMatchObject({
      key: 'group-1-401',
      number: '4x01–03',
      title: 'Full season · 3 episodes',
      href: '/shows/the-diplomat/seasons/4',
      rating: 8.2,
    });
  });

  it('should tag every episode type in the drop, then the time and network', () => {
    expect(card?.tags?.map(({ text }) => text)).toEqual(['Season Premiere', 'Season Finale', '7:00 am', 'Netflix']);
  });

  it('should list the episodes for the tray', () => {
    expect(card?.group.episodes.map(({ id, label }) => [id, label])).toEqual([[401, '4x01'], [402, '4x02'], [
      403,
      '4x03',
    ]]);
    expect(card?.group.show).toEqual({ id: 1, title: 'The Diplomat', slug: 'the-diplomat' });
  });

  it('should make no card for a single episode', () => {
    expect(toCalendarGroupCard({ group: { key: 'episode-401', items: [episode(1)] }, label: '', clock: UTC }))
      .toBeUndefined();
  });
});
