import type { PosterItem } from './toPosterItem.ts';

/** One mood's shelf for one type: its chip, its "View more" chart and six posters. */
export type MoodShelf = {
  readonly id: string;
  readonly label: string;
  readonly more: string;
  readonly items: readonly PosterItem[];
};
