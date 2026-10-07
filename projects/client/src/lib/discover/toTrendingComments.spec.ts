import { describe, expect, it } from 'vitest';
import type { TrendingCommentRow } from './trendingCommentRowsSchema.ts';
import { toTrendingComments } from './toTrendingComments.ts';

const now = new Date('2026-10-07T16:00:00Z');
const comment = (id: number) =>
  ({
    id,
    parent_id: 0,
    created_at: '2026-10-05T00:00:00.000Z',
    updated_at: '2026-10-05T00:00:00.000Z',
    comment: 'A comment.',
    spoiler: false,
    review: false,
    replies: 0,
    likes: 10,
    user_stats: { rating: 8, play_count: 1, completed_count: 1 },
    user: { username: 'sean', private: false, deleted: false, ids: { slug: 'sean', trakt: 1 } },
  }) as unknown as TrendingCommentRow['comment'];
const art = (id: number) => ({ poster: [`media.trakt.tv/images/${id}/posters/medium/a.jpg.webp`], fanart: null });
const show = (id: number, extra: object = {}) => ({
  ids: { trakt: id, slug: `show-${id}` },
  title: `Show ${id}`,
  year: 2026,
  first_aired: '2026-01-01T00:00:00.000Z',
  images: art(id),
  ...extra,
});
const episodeRow = (id: number, showId: number): TrendingCommentRow => ({
  type: 'episode',
  comment: comment(id),
  show: show(showId),
  episode: { season: 1, number: 8, title: 'Dirt and Stars' },
});

describe('toTrendingComments', () => {
  it("should map an episode comment onto its show, with the episode's number, title and page", () => {
    const [first] = toTrendingComments([episodeRow(1, 10)], now);

    expect(first?.href).toBe('/comments/1');
    expect(first?.item).toEqual({
      type: 'show',
      id: 10,
      href: '/shows/show-10',
      title: 'Show 10',
      year: 2026,
      episode: { number: '1x08', title: 'Dirt and Stars', href: '/shows/show-10/seasons/1/episodes/8' },
      poster: 'https://media.trakt.tv/images/10/posters/thumb/a.jpg.webp',
      fanart: undefined,
      rating: undefined,
      released: true,
      airedEpisodes: undefined,
      runtime: undefined,
    });
  });

  it('should keep ten, one for each avatar in the pager', () => {
    const rows = Array.from({ length: 14 }, (_, index) => episodeRow(index + 1, index + 100));

    expect(toTrendingComments(rows, now)).toHaveLength(10);
  });

  it('should show one comment per title first, then the rest', () => {
    const comments = toTrendingComments([episodeRow(1, 10), episodeRow(2, 10), episodeRow(3, 20)], now);

    expect(comments.map(({ comment }) => comment.id)).toEqual([1, 3, 2]);
  });

  it('should give a movie its year, and skip lists and titles without a poster', () => {
    const comments = toTrendingComments([
      { type: 'movie', comment: comment(4), movie: { ...show(30), released: '2027-01-01' } },
      { type: 'list', comment: comment(5), movie: show(31) },
      { type: 'movie', comment: comment(6), movie: show(32, { images: null }) },
    ], now);

    expect(comments.map(({ item }) => [item.year, item.episode, item.released])).toEqual([[2026, undefined, false]]);
  });
});
