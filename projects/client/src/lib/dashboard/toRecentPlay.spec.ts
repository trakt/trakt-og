import { describe, expect, it } from 'vitest';
import { historyRowsSchema } from '../users/history/historyRowsSchema.ts';
import { recentlyWatchedFixture } from './recentlyWatchedFixture.ts';
import { toRecentPlay } from './toRecentPlay.ts';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const [premiere, movie, standard] = recentlyWatchedFixture.rows.map((row) => toRecentPlay(row, datePreferences));

describe('toRecentPlay', () => {
  it('should put the watched date and time over a movie, with its year', () => {
    expect(movie).toMatchObject({
      type: 'movie',
      href: '/movies/the-dark-knight-2008',
      title: 'The Dark Knight',
      year: 2008,
      tags: [{ text: 'Sep 28, 2026 1:09 PM' }],
      favorite: { type: 'movie', id: 120 },
    });
    expect(movie?.smallTitle).toBeUndefined();
  });

  it('should put an episode under its show, with the episode type first and the show as the favorite', () => {
    expect(premiere).toMatchObject({
      type: 'episode',
      href: '/shows/game-of-thrones/seasons/2/episodes/1',
      title: 'The Ascent',
      number: '2x01',
      smallTitle: { text: 'Game of Thrones', href: '/shows/game-of-thrones' },
      tags: [{ text: 'Season Premiere', kind: 'season-premiere' }, { text: 'Sep 28, 2026 7:09 PM' }],
      season: { show: 1390, number: 2, episode: 1 },
      favorite: { type: 'show', id: 1390, title: 'Game of Thrones' },
    });
    expect(standard?.tags).toHaveLength(1);
  });

  it("should use an episode's still, and the show's fanart where it has none", () => {
    const play = () =>
      historyRowsSchema.parse([
        {
          id: 1,
          watched_at: '2026-09-29T02:09:00.000Z',
          show: {
            ids: { trakt: 1388, slug: 'breaking-bad' },
            title: 'Breaking Bad',
          },
          episode: { ids: { trakt: 2 }, season: 1, number: 2 },
        },
      ])[0]!;

    expect(toRecentPlay(play(), datePreferences).image).toBe(
      `https://media.trakt.tv/episodes/2/thumb/screenshot.webp#fallback=${encodeURIComponent('https://media.trakt.tv/shows/1388/thumb/fanart.webp')}`,
    );
  });
});
