import { seasonName } from '../../utils/seasonName.ts';

/** Season numbers as runs: "Specials, Seasons 3 to 5, Season 9". */
export function seasonRuns(numbers: readonly number[]): string {
  const runs = numbers
    .toSorted((a, b) => a - b)
    .reduce<number[][]>((all, number) => {
      const last = all.at(-1);
      if (last && number > 1 && last.at(-1) === number - 1) last.push(number);
      else all.push([number]);
      return all;
    }, []);
  return runs
    .map((run) => (run.length === 1 ? seasonName(run[0] ?? 0) : `Seasons ${run[0]} to ${run.at(-1)}`))
    .join(', ');
}
