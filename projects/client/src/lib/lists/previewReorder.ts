import { moveItem } from '../utils/moveItem.ts';

/**
 * The order a drag would leave: the item at `from` moved to `to`, and each place keeping the rank it had, so the
 * numbers read in order while the items move.
 */
export function previewReorder<T extends { readonly rank: number }>(
  items: readonly T[],
  from: number,
  to: number,
): readonly T[] {
  if (from === to) return items;
  return moveItem(items, from, to).map((item, index) => {
    const rank = items.at(index)?.rank ?? item.rank;
    return rank === item.rank ? item : { ...item, rank };
  });
}
