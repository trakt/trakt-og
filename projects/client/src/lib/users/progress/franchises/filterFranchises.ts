import type { ProgressHide } from '../progressHide.ts';
import type { FranchiseProgress } from './FranchiseProgress.ts';

type FilterFranchisesParams = {
  hide: readonly ProgressHide[];
  terms?: string;
};

/** Hide Completed, Hide Not Completed and the title search. */
export function filterFranchises(
  items: readonly FranchiseProgress[],
  { hide, terms }: FilterFranchisesParams,
): readonly FranchiseProgress[] {
  const needle = terms?.trim().toLocaleLowerCase();
  return items.filter(({ franchise, watched, total }) => {
    const done = watched >= total;
    return (
      !(hide.includes('completed') && done) &&
      !(hide.includes('not-completed') && !done) &&
      (!needle || franchise.name.toLocaleLowerCase().includes(needle))
    );
  });
}
