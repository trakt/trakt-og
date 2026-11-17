import type { ListQuery } from './ListQuery.ts';

/** What the browser needs to count a list's stats over every page of it. */
export type ListStatsRead = {
  /** The items path before its `/:type/:sort_by/:sort_how` segments. */
  readonly base: string;
  readonly query: ListQuery;
  /** The list's item count, which sets how many pages to read. */
  readonly total: number;
  readonly withItems: boolean;
  /** Only the viewer's token reads this list, so the browser sends it. */
  readonly viewer: boolean;
};
