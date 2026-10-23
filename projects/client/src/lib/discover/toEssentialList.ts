import type { FeaturedList } from './featuredLists.ts';
import type { ListSource } from './listSchema.ts';
import { toListCard } from './toListCard.ts';

/** An essential list's slice: its art and title, and the list's description, counts and posters when it loaded. */
export type EssentialList = FeaturedList & {
  readonly href: string;
  readonly description?: string;
  /** The owner's slug, for the Like toggle's route; only when the list loaded. */
  readonly ownerSlug?: string;
  readonly counts?: { readonly items: number; readonly likes: number; readonly comments?: number };
  readonly posters: readonly string[];
};

/** One essential list with what the API sent for it; without it, the slice still shows its art and title. */
export function toEssentialList(tile: FeaturedList, list: ListSource | null): EssentialList {
  if (!list) return { ...tile, href: `/lists/${tile.id}`, posters: [] };
  const { href, description, owner, items, likes, comments, posters } = toListCard(list);
  return { ...tile, href, description, ownerSlug: owner.slug, counts: { items, likes, comments }, posters };
}
