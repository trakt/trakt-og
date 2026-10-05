type Line = { readonly text: string; readonly href: string };

/** The newest play, or `null` before the first one. */
export type LastWatchedView = {
  readonly play: {
    readonly image?: string;
    readonly title: Line;
    /** An episode's "2x09 The After Hours", or a movie's year. */
    readonly subtitle?: { readonly text: string; readonly href?: string };
    /** "Today", "Yesterday" or "3 days ago", in whole UTC days. */
    readonly when: string;
    /** How far through the show the user is, for an episode. */
    readonly progress?: { readonly completed: number; readonly aired: number };
  } | null;
};
