import type { OverlayState } from '../../overlay/createOverlay.svelte.ts';

/**
 * The progress of a few episodes of one season, as a season-shaped overlay state: how many are watched and how many
 * are in the library. A calendar card that groups a show's episodes from one day fills its icons from this.
 */
export function episodeBatchState(states: readonly OverlayState[]): OverlayState {
  const watchedEpisodes = states.filter((state) => state.watched).length;
  const collectedEpisodes = states.filter((state) => state.collected).length;
  return {
    watchedEpisodes,
    watched: watchedEpisodes > 0,
    collectedEpisodes,
    collected: collectedEpisodes > 0,
  };
}
