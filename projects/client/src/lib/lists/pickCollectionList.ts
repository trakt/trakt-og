type OfficialList = { readonly ids: { readonly slug: string }; readonly item_count: number };

/** Official lists a title can sit on; the API pages ten by default, past which a collection can fall. */
export const OFFICIAL_LISTS_LIMIT = 100;

// Franchise collections run a few dozen films at most; "The Criterion Collection" shares the slug at over a thousand.
const MAX_COLLECTION_ITEMS = 100;

/**
 * The title's franchise collection among its official lists, for the tag bar and the Previous and Next arrows. The API
 * has no collection flag: collections are the official lists slugged `*-collection`, and the smallest is the closest
 * franchise. Chart and award lists (IMDb, Trakt, Oscars) never count.
 */
export function pickCollectionList<T extends OfficialList>(lists: readonly T[]): T | undefined {
  return lists
    .filter(({ ids, item_count }) => ids.slug.endsWith('-collection') && item_count <= MAX_COLLECTION_ITEMS)
    .toSorted((a, b) => a.item_count - b.item_count)
    .at(0);
}
