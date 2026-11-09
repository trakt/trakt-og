import type { Franchise } from './Franchise.ts';

const key = ({ movieIds }: Franchise) => movieIds.toSorted((a, b) => a - b).join(',');

const better = (a: Franchise, b: Franchise) => (a.likeCount === b.likeCount ? a.id < b.id : a.likeCount > b.likeCount);

/**
 * TMDB keeps several official lists with exactly the same movies ("A Star Wars Story Collection" in three spellings).
 * Of each group the most liked stays, the lowest list id on a tie. A list with more or fewer movies is another
 * franchise and stays.
 */
export function dedupeFranchises(franchises: readonly Franchise[]): readonly Franchise[] {
  const kept = franchises.reduce<ReadonlyMap<string, Franchise>>((winners, franchise) => {
    const current = winners.get(key(franchise));
    return current && !better(franchise, current) ? winners : new Map(winners).set(key(franchise), franchise);
  }, new Map());
  const winners = new Set(kept.values());
  return franchises.filter((franchise) => winners.has(franchise));
}
