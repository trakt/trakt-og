import type { OverlayState } from '../../overlay/createOverlay.svelte.ts';

const HINTS = {
  rate: 'Watch it first to rate it',
  favorite: 'Watch it first to favorite it',
} as const;

/**
 * Rating and favoriting need a watch first: a movie or episode played, a show or season with an episode watched.
 * Unreleased media can't be watched, so it's locked too. Returns the hint for a locked control, or nothing when it's
 * allowed. An unknown state (signed out, still loading) stays allowed, so signing in or loading never blocks it, and
 * an existing rating or favorite stays open so it can be changed or removed.
 */
export function watchedFirst(
  state: Pick<OverlayState, 'watched' | 'rating' | 'favorited'>,
  action: keyof typeof HINTS,
): string | undefined {
  if (state.watched !== false) return undefined;
  if (action === 'rate' && state.rating != null) return undefined;
  if (action === 'favorite' && state.favorited) return undefined;
  return HINTS[action];
}
