export type FinishedView = {
  /** "449". */
  readonly finished: string;
  /** Shows watched, "528": the figure reads "449 of 528", as on the dashboard. */
  readonly watched: string;
  readonly inProgress: number;
  readonly dropped: number;
  /** Finished, then in progress, as shares of all three, 0 to 100; dropped is the track that's left. */
  readonly meter: { readonly finished: number; readonly inProgress: number } | null;
  /** The newest finished show, when it's among the ten most recently watched. */
  readonly latest: { readonly title: { readonly text: string; readonly href: string }; readonly when: string } | null;
};
