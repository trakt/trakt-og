import type { FeaturedList } from './featuredLists.ts';
import type { ListSource } from './listSchema.ts';
import { toListCard } from './toListCard.ts';

/** An essential list's slice: its art and title, and the list's description, counts and posters when it loaded. */
export type EssentialList = FeaturedList & {
  readonly href: string;
  readonly description?: string;
  readonly counts?: { readonly items: number; readonly likes: number; readonly comments?: number };
  readonly posters: readonly string[];
};

/** One essential list with what the API sent for it; without it, the slice still shows its art and title. */
export function toEssentialList(tile: FeaturedList, list: ListSource | null): EssentialList {
  const href = `/lists/${tile.id}`;
  if (!list) return { ...tile, href, posters: [] };
  const { description, items, likes, comments, posters } = toListCard(list);
  return { ...tile, href, description, counts: { items, likes, comments }, posters };
}
