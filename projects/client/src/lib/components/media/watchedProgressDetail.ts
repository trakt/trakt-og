import { countLabel } from '../../utils/countLabel.ts';
import type { WatchedProgress } from './WatchedProgress.ts';

/**
 * A run's tooltip line under its percent: "1 / 32 eps — 1 play", like the summary's watched button, or the library's
 * "27 / 32 eps — from Plex".
 */
export function watchedProgressDetail({ completed, aired, plays, from }: WatchedProgress): string {
  const after = plays === undefined ? from && `from ${from}` : countLabel(plays, 'play');
  return `${completed.toLocaleString('en-US')} / ${aired.toLocaleString('en-US')} eps${after ? ` — ${after}` : ''}`;
}
