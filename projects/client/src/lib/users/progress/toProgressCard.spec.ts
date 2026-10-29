import { describe, expect, it } from 'vitest';
import { progressItemFixture } from './progressItemFixture.ts';
import { toProgressCard } from './toProgressCard.ts';

const now = new Date('2026-09-30T20:00:00.000Z');
const next = {
  id: 501,
  season: 2,
  number: 1,
  title: 'Pilot Two',
  firstAired: '2026-09-01T01:00:00.000Z',
  runtime: 42,
  rating: 8.1,
};
const card = (overrides: Parameters<typeof progressItemFixture>[1] = {}, simple = false) =>
  toProgressCard({ item: progressItemFixture(7, overrides), username: 'demo', simple, now });

describe('toProgressCard', () => {
  it('should map the next aired episode, not the show', () => {
    expect(card({ next })).toMatchObject({
      showId: 7,
      showTitle: 'Show 7',
      showHref: '/shows/show-7',
      episodeId: 501,
      seasonNumber: 2,
      episode: 1,
      episodeHref: '/shows/show-7/seasons/2/episodes/1',
      episodeNumber: '2x01',
      episodeTitle: 'Pilot Two',
      episodeBadge: { label: 'Season Premiere', kind: 'season-premiere' },
      rating: 8.1,
      runtime: 42,
      progressHref: '/users/demo/progress?show=7',
      progress: { aired: 10, completed: 5, plays: 5 },
      rewatching: false,
    });
    expect(card({ next })?.complete).toBeUndefined();
  });

  it('should fill the ticks from the left, and leave them out for simple bars', () => {
    expect(card({ next })?.ticks).toEqual([true, true, true, true, true, false, false, false, false, false]);
    expect(card({ next }, true)?.ticks).toBeUndefined();
  });

  it('should be undefined while episodes are left but the next one is unknown', () => {
    expect(card()).toBeUndefined();
  });

  it('should be the show at 100% with its status once caught up', () => {
    expect(card({ completed: 10, show: { status: 'ended' } })).toMatchObject({
      complete: true,
      episodeHref: '/shows/show-7',
      completionLabel: 'Ended',
    });
    expect(card({ completed: 10, show: { status: 'returning series' } })?.completionLabel).toBe('Returns next season!');
  });

  it('should leave the label off when an unaired episode is next', () => {
    const unaired = { ...next, firstAired: '2026-12-01T01:00:00.000Z' };
    expect(card({ completed: 10, next: unaired })).toMatchObject({ complete: true, completionLabel: undefined });
  });

  it('should mark a rewatch', () => {
    expect(card({ next, resetAt: '2026-08-01T00:00:00.000Z' })?.rewatching).toBe(true);
  });
});
