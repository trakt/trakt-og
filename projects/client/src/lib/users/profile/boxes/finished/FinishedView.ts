export type FinishedView = {
  /** "449". */
  readonly count: string;
  readonly finished: number;
  readonly started: number;
  /** "85% of shows started". */
  readonly share: string;
  /** "+3 this month", or `null` with none. */
  readonly month: string | null;
  /** The newest finished show, when it's among the ten most recently watched. */
  readonly latest: { readonly title: { readonly text: string; readonly href: string }; readonly when: string } | null;
};
