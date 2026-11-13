import { hasEpisodeAired } from './hasEpisodeAired.ts';

const EARLY_WATCH_MS = 24 * 60 * 60 * 1000;

/**
 * Open to watches and check-ins from a day before it's out, from `episodeReleasedAt`. v3 gives the same day for air
 * time and time zone skew.
 */
export function isEpisodeWatchable(releasedAt: string | undefined, now: number): boolean {
  return hasEpisodeAired(releasedAt, now + EARLY_WATCH_MS);
}
