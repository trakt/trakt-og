const DATES = new Set(['added', 'released', 'watched', 'collected']);

/**
 * The order a list sort and direction give, in words, for the list dialogs' sort field: "first to last" for Rank,
 * "A to Z" for Title, "newest first" for a date, "low to high" for a score or count. `how` is the literal direction,
 * whatever the sort starts in (see listSortHow). Random has no order.
 */
export function sortDirectionHint(by: string, how: string): string | undefined {
  const flipped = how === 'desc';
  if (by === 'random') return undefined;
  if (by === 'rank') return flipped ? 'last to first' : 'first to last';
  if (by === 'title') return flipped ? 'Z to A' : 'A to Z';
  if (by === 'runtime') return flipped ? 'longest first' : 'shortest first';
  if (DATES.has(by)) return flipped ? 'newest first' : 'oldest first';
  return flipped ? 'high to low' : 'low to high';
}
