import { describe, expect, it } from 'vitest';
import { historyRowsSchema } from './historyRowsSchema.ts';
import { toChartsFromPlays } from './historyCharts.ts';
import { historyItemTitle, toChartCard, toHistoryCard, toHistoryDays } from './toHistoryCard.ts';

const datePreferences = { order: 'mdy', hour24: false, timeZone: 'America/Los_Angeles', weekStartDay: 0 } as const;
const show = {
  title: 'Breaking Bad',
  ids: { trakt: 1388, slug: 'breaking-bad' },
  runtime: 47,
  genres: ['drama'],
  images: { poster: ['media.trakt.tv/images/shows/poster/medium/bb.jpg.webp'] },
};
const episode = (id: number, number: number, watched_at: string, runtime: number | null = 58) => ({
  id,
  watched_at,
  show,
  episode: {
    ids: { trakt: 100 + number },
    season: 2,
    number,
    title: 'Number the Stars',
    runtime,
    images: { screenshot: ['media.trakt.tv/images/episodes/screenshot/medium/s.jpg.webp'] },
  },
});
const movie = {
  id: 1,
  watched_at: '2026-09-29T16:23:00.000Z',
  movie: { title: 'Fight Club', year: 1999, ids: { trakt: 1, slug: 'fight-club-1999' }, runtime: 139 },
};
const rows = historyRowsSchema.parse([
  movie,
  episode(2, 4, '2026-09-29T05:23:00.000Z'),
  episode(3, 3, '2026-09-28T15:23:00.000Z', null),
  episode(4, 1, '1970-01-01T00:00:00.000Z'),
]);
const cards = rows.map((row) => toHistoryCard(row, { screenshots: false, datePreferences }));

describe('toHistoryCard', () => {
  it('should put an episode on its show poster, or on its screenshot with the show linked', () => {
    expect(cards[1]).toMatchObject({
      key: 2,
      type: 'episode',
      number: '2x04',
      title: 'Number the Stars',
      variant: 'poster',
      image: 'https://media.trakt.tv/images/shows/poster/thumb/bb.jpg.webp',
      watchedDate: 'Sep 28, 2026 10:23 PM',
    });
    expect(cards[1]?.show).toBeUndefined();
    expect(toHistoryCard(rows[1]!, { screenshots: true, datePreferences })).toMatchObject({
      variant: 'screenshot',
      image: 'https://media.trakt.tv/images/episodes/screenshot/thumb/s.jpg.webp',
      show: { text: 'Breaking Bad', href: '/shows/breaking-bad' },
    });
  });

  it('should say Unknown date for a 1970 play instead of the epoch in the viewer zone', () => {
    expect(cards[3]?.watchedDate).toBe('Unknown date');
  });
});

describe('toHistoryDays', () => {
  it('should group by the viewer day, total the runtime and put 1970 under Unknown Date', () => {
    const days = toHistoryDays(cards, datePreferences);
    expect(days.map(({ weekday, date, runtime, cards }) => ({ weekday, date, runtime, count: cards.length }))).toEqual([
      { weekday: 'Tuesday', date: 'September 29, 2026', runtime: 139, count: 1 },
      // The 5:23 UTC play was the evening before in Los Angeles; an episode without a runtime uses its show's.
      { weekday: 'Monday', date: 'September 28, 2026', runtime: 58 + 47, count: 2 },
      { weekday: undefined, date: 'Unknown Date', runtime: 58, count: 1 },
    ]);
  });
});

describe('toChartCard', () => {
  const [film, show] = toChartsFromPlays(rows);
  const lines = (by: Parameters<typeof toChartCard>[1]) => toChartCard(show!, by, datePreferences).subtitles;

  it("should put OG's lines for each sort under the title", () => {
    expect(lines('added')).toEqual(['Sep 28, 2026 10:23 PM']);
    expect(lines('plays')).toEqual(['2h 43m', '3 plays']);
    expect(lines('time')).toEqual(['2h 43m', '3 plays']);
    expect(lines('runtime')).toEqual(['47m', '3 plays']);
    expect(lines('title')).toEqual(['3 plays']);
    expect(lines('votes')).toEqual(['0 votes']);
    expect(lines('released')).toEqual(['3 plays']);
  });

  it('should chart a movie on its poster', () => {
    expect(toChartCard(film!, 'title', datePreferences)).toMatchObject({
      key: 1,
      type: 'movie',
      href: '/movies/fight-club-1999',
      subtitles: ['1 play'],
    });
  });
});

describe('historyItemTitle', () => {
  it("should read OG's full titles off the first play", () => {
    expect(historyItemTitle({ type: 'movie', id: 1 }, rows[0])).toBe('Fight Club (1999)');
    expect(historyItemTitle({ type: 'show', id: 1388 }, rows[1])).toBe('Breaking Bad');
    expect(historyItemTitle({ type: 'season', id: 3 }, rows[1])).toBe('Breaking Bad Season 2');
    expect(historyItemTitle({ type: 'episode', id: 104 }, rows[1])).toBe('Breaking Bad 2x04 "Number the Stars"');
    expect(historyItemTitle({ type: 'episode', id: 104 }, undefined)).toBeUndefined();
  });
});
