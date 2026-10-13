import { describe, expect, it } from 'vitest';
import { socialFeedFixture } from '../dashboard/socialFeedFixture.ts';
import { followingWatching } from './followingWatching.ts';

const now = new Date('2026-10-05T16:30:00Z');
const [kristin, sefer, damien] = socialFeedFixture.live(now);
const movie = sefer && { ...sefer, target: { ...sefer.target, type: 'movie' as const } };
const live = [kristin, movie, damien].filter((watch) => watch !== undefined);

describe('followingWatching', () => {
  it('should keep the episodes on the shows chart, newest start first', () => {
    expect(followingWatching(live, 'shows', now).map(({ watch }) => watch.member.name)).toEqual(['Damien', 'Kristin']);
  });

  it('should keep the movies on the movies chart', () => {
    expect(followingWatching(live, 'movies', now).map(({ watch }) => watch.member.name)).toEqual(['Sefer']);
  });
});
