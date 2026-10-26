import { countLabel } from '../../utils/countLabel.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import type { WatchedPlays } from './WatchedPlays.ts';

/**
 * A watched tooltip's two lines: when ("Watched on Feb 22, 2025", "Last watched on" after more than one play, or just
 * "Watched" without a date), then how much: the runtime for one play, or "3 plays" and their total time for more.
 */
export function playsLines({ count, minutes, at }: WatchedPlays) {
  return {
    lead: at && count > 1 ? 'Last watched' : 'Watched',
    at,
    plays: count > 1 ? countLabel(count, 'play') : undefined,
    time: minutes ? formatRuntime(minutes) : undefined,
  };
}
