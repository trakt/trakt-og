/** OG's label for each rating, 1 to 10. */
export const RATING_LABELS: Readonly<Record<number, string>> = {
  1: 'Weak Sauce :(',
  2: 'Terrible',
  3: 'Bad',
  4: 'Poor',
  5: 'Meh',
  6: 'Fair',
  7: 'Good',
  8: 'Great',
  9: 'Superb',
  10: 'Totally Ninja!',
};

/** The rating popover's title: `strong` is bold, `text` follows it, and `tint` is the rating its bar is tinted in. */
export interface RatingPrompt {
  readonly strong: string;
  readonly text: string;
  /** A rating, 1 to 10, for its color; `unrate` while pointing at the saved one; null with nothing to show. */
  readonly tint: number | 'unrate' | null;
}

/**
 * What OG's rating popover title says (global.js `.quick-icons .percentage`): "Unrate" while pointing at the current
 * rating, "7 — Good" while pointing at another one or at rest on a rating, "What do you think?" when there's none.
 */
export function ratingPrompt(value: number | null, preview: number | null): RatingPrompt {
  if (preview !== null && preview === value) return { strong: 'Unrate', text: '', tint: 'unrate' };

  const shown = preview ?? value;
  if (shown === null) return { strong: '', text: 'What do you think?', tint: null };

  return { strong: String(shown), text: ` — ${RATING_LABELS[shown]}`, tint: shown };
}
