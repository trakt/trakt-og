import type { z } from 'zod/v4';
import type { summaryListSchema } from '../summary/summaryListSchema.ts';
import type { ItemListSortBy } from './itemListQuery.ts';

type OwnList = z.infer<typeof summaryListSchema>;

const newest = (date: string | null | undefined) => (date ? Date.parse(date) : 0);

// `/listed` has no sort and no 7-day counts, so popularity falls back to likes, as the summary's Me tab does.
const KEYS: Record<ItemListSortBy, (list: OwnList) => number> = {
  popularity: (list) => list.likes,
  likes: (list) => list.likes,
  comments: (list) => list.comment_count,
  items: (list) => list.item_count,
  added: (list) => newest(list.created_at),
  updated: (list) => newest(list.updated_at),
};

/** The viewer's own personal lists with the item, from `/listed`, in the page's sort, highest first. */
export function sortOwnLists(lists: readonly OwnList[], sortBy: ItemListSortBy): readonly OwnList[] {
  const key = KEYS[sortBy];
  return lists.filter((list) => list.type === 'personal').toSorted((a, b) => key(b) - key(a));
}
