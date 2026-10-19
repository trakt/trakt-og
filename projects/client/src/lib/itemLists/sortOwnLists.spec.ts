import { describe, expect, it } from 'vitest';
import { sortOwnLists } from './sortOwnLists.ts';

const list = (id: number, extra: Record<string, unknown> = {}) => ({
  name: `List ${id}`,
  privacy: 'public',
  type: 'personal',
  allow_comments: true,
  item_count: 1,
  comment_count: 0,
  likes: 0,
  ids: { trakt: id, slug: `list-${id}` },
  user: { username: 'sean', ids: { slug: 'sean' } },
  ...extra,
});

describe('sortOwnLists', () => {
  it('should keep only personal lists, most liked first for popularity', () => {
    const lists = [list(1, { likes: 2 }), list(2, { type: 'watchlist', likes: 9 }), list(3, { likes: 5 })];
    expect(sortOwnLists(lists, 'popularity').map(({ ids }) => ids.trakt)).toEqual([3, 1]);
  });

  it('should sort by items, and by the newest update', () => {
    const lists = [
      list(1, { item_count: 3, updated_at: '2026-01-01T00:00:00Z' }),
      list(2, { item_count: 8, updated_at: '2026-03-01T00:00:00Z' }),
    ];
    expect(sortOwnLists(lists, 'items').map(({ ids }) => ids.trakt)).toEqual([2, 1]);
    expect(sortOwnLists(lists, 'updated').map(({ ids }) => ids.trakt)).toEqual([2, 1]);
  });
});
