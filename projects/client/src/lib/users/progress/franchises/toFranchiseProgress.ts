import type { Franchise } from './Franchise.ts';
import type { FranchiseProgress } from './FranchiseProgress.ts';

type ToFranchiseProgressParams = {
  franchises: readonly Franchise[];
  /** Movie id to its watch dates. */
  plays: ReadonlyMap<number, readonly string[]>;
};

const latest = (dates: readonly string[]) =>
  dates.reduce((newest, date) => (Date.parse(date) > Date.parse(newest) ? date : newest));

/** The franchises with at least one movie watched, counted by the ids the catalog holds. */
export function toFranchiseProgress({ franchises, plays }: ToFranchiseProgressParams): readonly FranchiseProgress[] {
  return franchises.flatMap((franchise): FranchiseProgress[] => {
    const dates = franchise.movieIds.flatMap((id) => plays.get(id) ?? []);
    if (dates.length === 0) return [];
    return [
      {
        franchise,
        watched: franchise.movieIds.filter((id) => (plays.get(id)?.length ?? 0) > 0).length,
        total: franchise.movieIds.length,
        lastAt: latest(dates),
      },
    ];
  });
}
