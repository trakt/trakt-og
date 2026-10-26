import { progressPercent } from './progressPercent.ts';
import type { ShowProgress } from './ShowProgress.ts';
import type { WatchedProgress } from './WatchedProgress.ts';

type ProgressTooltipParams = {
  progress: ShowProgress;
  /** While rewatching: the show's whole progress, shown under a divider. */
  fullProgress?: ShowProgress;
  /** Episode runtime in minutes, for the estimates. */
  runtime?: number | null;
};

const run = (progress: ShowProgress, verb: WatchedProgress['verb'], runtime: number): WatchedProgress => ({
  verb,
  percent: progressPercent(progress),
  completed: progress.completed,
  aired: progress.aired,
  plays: progress.plays,
  minutes: progress.minutesWatched || progress.plays * runtime,
});

/**
 * The on-deck progress bar's tooltip (`dashboard.js:7-55`): "86% watched" over "133/154 eps — 203 plays (3d 2h 56m)".
 * A rewatch gets a second run with the whole show's progress, under a divider.
 */
export function progressTooltip({
  progress,
  fullProgress,
  runtime,
}: ProgressTooltipParams): readonly WatchedProgress[] {
  const minutes = runtime ?? 0;
  if (!fullProgress) return [run(progress, 'watched', minutes)];

  return [run(progress, 'rewatched', minutes), run(fullProgress, 'watched', minutes)];
}
