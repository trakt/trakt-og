import type { UpNextResponse } from '@trakt/api';
import { describe, expect, it } from 'vitest';
import { toNitroItem } from './toNitroItem.ts';

const episode = {
  season: 2,
  number: 3,
  number_abs: null,
  title: 'The Bridge',
  overview: null,
  episode_type: 'standard',
  first_aired: '2026-09-01T01:00:00.000Z',
  runtime: 45,
  rating: 8.1,
  ids: { trakt: 203 },
  images: { screenshot: ['walter.trakt.tv/images/episodes/203.jpg'] },
};

const row = (progress: Partial<UpNextResponse['progress']> = {}): UpNextResponse => ({
  show: {
    title: 'Severance',
    year: 2022,
    runtime: 50,
    ids: { trakt: 7, slug: 'severance' },
    images: { poster: ['walter.trakt.tv/images/shows/7.jpg'], fanart: [] },
  },
  progress: {
    aired: 19,
    completed: 12,
    last_watched_at: '2026-10-01T20:00:00.000Z',
    reset_at: null,
    next_episode: episode,
    last_episode: null,
    ...progress,
  },
} as unknown as UpNextResponse);

describe('toNitroItem', () => {
  it('should take the counts, minutes and next episode from the API', () => {
    const item = toNitroItem(
      row(
        { stats: { play_count: 14, minutes_watched: 640, minutes_left: 300 } } as Partial<UpNextResponse['progress']>,
      ),
      1,
    );

    expect(item).toMatchObject({
      aired: 19,
      completed: 12,
      plays: 14,
      minutesWatched: 640,
      minutesLeft: 300,
      exact: true,
      lastAt: '2026-10-01T20:00:00.000Z',
      next: {
        id: 203,
        season: 2,
        number: 3,
        title: 'The Bridge',
        screenshot: 'walter.trakt.tv/images/episodes/203.jpg',
      },
      last: undefined,
    });
    expect(item.show).toMatchObject({ id: 7, slug: 'severance', fetchedAt: 1 });
  });

  it('should estimate the plays and minutes from the runtime without stats', () => {
    expect(toNitroItem(row(), 0)).toMatchObject({
      plays: 12,
      minutesWatched: 600,
      minutesLeft: 350,
      exact: false,
    });
  });

  it('should never count more watched than aired', () => {
    expect(toNitroItem(row({ completed: 21 }), 0).completed).toBe(19);
  });
});
