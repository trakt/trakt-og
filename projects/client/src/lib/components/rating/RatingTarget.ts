import type { SeasonOf } from '../../overlay/createOverlay.svelte.ts';

/** Identifies an item for rating writes; the same target can be used on a summary or a card. */
export interface RatingTarget {
  readonly type: 'movie' | 'show' | 'season' | 'episode';
  readonly id: number;
  readonly title: string;
  /** A season's show and number, which its watched state needs. Without it a season's rating stays unlocked. */
  readonly season?: SeasonOf;
}
