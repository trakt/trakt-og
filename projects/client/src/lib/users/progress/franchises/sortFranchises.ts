import type { FranchiseProgress } from './FranchiseProgress.ts';
import type { FranchiseSort, FranchiseSortBy } from './franchiseSort.ts';

const KEYS: Record<FranchiseSortBy, (item: FranchiseProgress) => number | string> = {
  recent: ({ lastAt }) => Date.parse(lastAt) || 0,
  percent: ({ watched, total }) => watched / total,
  left: ({ watched, total }) => total - watched,
  title: ({ franchise }) => franchise.name.toLocaleLowerCase(),
};

const compare = (a: number | string, b: number | string) =>
  typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : Number(a) - Number(b);

/** The franchises in a sort, ties by title. The percent and left counts come from the catalog's movie ids. */
export function sortFranchises(items: readonly FranchiseProgress[], { by, how }: FranchiseSort) {
  const direction = how === 'desc' ? -1 : 1;
  return items.toSorted(
    (a, b) =>
      direction * compare(KEYS[by](a), KEYS[by](b)) ||
      a.franchise.name.localeCompare(b.franchise.name) ||
      a.franchise.id - b.franchise.id,
  );
}
