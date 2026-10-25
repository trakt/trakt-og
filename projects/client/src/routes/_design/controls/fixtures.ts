import type { OverlayState } from '../../../lib/overlay/createOverlay.svelte.ts';

const none: OverlayState = {
  watched: false,
  watchedEpisodes: 0,
  collected: false,
  collectedEpisodes: 0,
  watchlisted: false,
  listed: false,
  rating: null,
};

/** One known viewer state per card, so each fade and hide option has something to match. */
export const samples: readonly { label: string; state: OverlayState }[] = [
  { label: 'Watched', state: { ...none, watched: true, watchedEpisodes: 99 } },
  { label: 'Partly watched', state: { ...none, watched: true, watchedEpisodes: 1 } },
  { label: 'In library', state: { ...none, collected: true, collectedEpisodes: 99 } },
  { label: 'Watchlisted', state: { ...none, watchlisted: true } },
  { label: 'Rated', state: { ...none, watched: true, watchedEpisodes: 99, rating: 8 } },
  { label: 'Nothing yet', state: none },
];
