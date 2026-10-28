import type { SliceName } from './overlayStorage.ts';

/** Every slice, listed so filtering the cache doesn't pull in the slice loaders. A spec pins it to `sliceSources`. */
export const SLICE_NAMES: readonly SliceName[] = [
  'watchedMovies',
  'watchedShows',
  'rewatching',
  'collectedMovies',
  'collectedShows',
  'syncedEpisodes',
  'ratings',
  'watchlist',
  'favorites',
  'dropped',
  'progressHidden',
  'hidden',
  'likedLists',
  'network',
  'listMembership',
];
