import type { z } from 'zod/v4';
import { type ItemListType, itemListTypes } from '../itemLists/itemListQuery.ts';
import { sortOwnLists } from '../itemLists/sortOwnLists.ts';
import { pickCollectionList } from '../lists/pickCollectionList.ts';
import type { summaryListSchema } from './summaryListSchema.ts';
import { type SummaryList, toSummaryList } from './toSummaryList.ts';

type List = z.infer<typeof summaryListSchema>;

export type ListTab = {
  /** The lists page's type, for the see-more link. */
  readonly id: Extract<ItemListType, 'official' | 'personal' | 'me'>;
  readonly label: string;
  readonly lists: readonly SummaryList[];
  /** The pick's own count for its see-more link; Personal's is the item's list count. */
  readonly total?: number;
};

type ListTabsParams = {
  official: readonly List[];
  personal: readonly List[];
  /** The viewer's own lists with the item, from `/listed`; empty signed out. */
  mine: readonly List[];
  limit: number;
};

/**
 * The lists preview's Type picks: Official, with the title's collection first and the rest by likes; Personal, the
 * most liked personal lists; and Mine, the viewer's own personal lists with the item, most liked first. Each shows
 * `limit` rows, and a pick with none is left out.
 */
export function toListTabs({ official, personal, mine, limit }: ListTabsParams): readonly ListTab[] {
  const collection = pickCollectionList(official);
  const ordered = collection ? [collection, ...official.filter((list) => list !== collection)] : official;
  const own = sortOwnLists(mine, 'popularity');
  const tab = (id: ListTab['id'], lists: readonly List[], total?: number): ListTab => ({
    id,
    label: itemListTypes[id].label,
    lists: lists.slice(0, limit).map(toSummaryList),
    total,
  });
  const tabs = [tab('official', ordered, official.length), tab('personal', personal), tab('me', own, own.length)];
  return tabs.filter(({ lists }) => lists.length > 0);
}
