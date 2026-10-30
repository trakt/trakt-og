import { formatRuntime } from '../../utils/formatRuntime.ts';
import type { WatchedProgress } from './WatchedProgress.ts';
import { watchedProgressDetail } from './watchedProgressDetail.ts';

/** The progress tooltip as one line for an accessible name: "3% watched, 1 / 32 eps — 1 play (49m)". */
export function watchedProgressText(progress: readonly WatchedProgress[]): string {
  return progress
    .map((run) => {
      const time = run.plays !== undefined && run.minutes ? ` (${formatRuntime(run.minutes)})` : '';
      return `${run.percent}% ${run.verb}, ${watchedProgressDetail(run)}${time}`;
    })
    .join('; ');
}
