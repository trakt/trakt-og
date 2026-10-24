import type { LiveWatch } from '../dashboard/fetchWatching.ts';
import { type LiveTile, liveTiles } from '../dashboard/liveTiles.ts';
import type { MediaType } from './loadChart.ts';

/** Trending's People you follow: the members watching this chart's type now, newest start first, with progress. */
export function followingWatching(live: readonly LiveWatch[], type: MediaType, now: Date): readonly LiveTile[] {
  return liveTiles(
    live.filter(({ target }) => (target.type === 'movie') === (type === 'movies')),
    now,
  );
}
