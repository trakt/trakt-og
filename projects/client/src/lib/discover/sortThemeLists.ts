import type { ThemeList } from './ThemeList.ts';
import type { themeListSorts } from './themeListSorts.ts';

// Two rows of three.
const SHOWN = 6;

const order: Record<(typeof themeListSorts)[number]['id'], (a: ThemeList, b: ThemeList) => number> = {
  trending: (a, b) => b.weekLikes - a.weekLikes,
  likes: () => 0,
  comments: (a, b) => (b.comments ?? -1) - (a.comments ?? -1),
  updated: (a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
};

/** The month's lists in the picked order, ties going to the most liked, six of them. */
export function sortThemeLists(
  lists: readonly ThemeList[],
  by: (typeof themeListSorts)[number]['id'],
  limit = SHOWN,
): ThemeList[] {
  return lists.toSorted((a, b) => order[by](a, b) || b.likes - a.likes).slice(0, limit);
}
