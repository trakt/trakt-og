import { describe, expect, it } from 'vitest';
import type { ThemeList } from './ThemeList.ts';
import { sortThemeLists } from './sortThemeLists.ts';

const list = (id: number, extra: Partial<ThemeList>): ThemeList => ({
  id,
  href: `/lists/${id}`,
  name: `List ${id}`,
  owner: { name: 'sean', href: '/users/sean', avatar: 'a.jpg', vip: null },
  items: 50,
  likes: 0,
  posters: [],
  weekLikes: 0,
  ...extra,
});
const lists = [
  list(1, { likes: 900, comments: 1, updatedAt: '2026-01-01T00:00:00.000Z' }),
  list(2, { likes: 50, weekLikes: 9, comments: 30, updatedAt: '2026-10-06T00:00:00.000Z' }),
  list(3, { likes: 400, weekLikes: 9, updatedAt: '2026-10-07T00:00:00.000Z' }),
  list(4, { likes: 10 }),
];
const ids = (sorted: ThemeList[]) => sorted.map(({ id }) => id);

describe('sortThemeLists', () => {
  it("should put this week's likes first for trending, ties to the most liked", () => {
    expect(ids(sortThemeLists(lists, 'trending'))).toEqual([3, 2, 1, 4]);
  });

  it('should sort by all-time likes', () => {
    expect(ids(sortThemeLists(lists, 'likes'))).toEqual([1, 3, 2, 4]);
  });

  it('should sort by comments, with comments turned off last', () => {
    expect(ids(sortThemeLists(lists, 'comments'))).toEqual([2, 1, 3, 4]);
  });

  it('should sort by the last update, newest first', () => {
    expect(ids(sortThemeLists(lists, 'updated'))).toEqual([3, 2, 1, 4]);
  });

  it('should stop at the limit', () => {
    expect(sortThemeLists(lists, 'likes', 2)).toHaveLength(2);
  });
});
