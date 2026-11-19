type Line = { readonly text: string; readonly href: string };

/** The newest play, or `null` before the first one. */
export type LastWatchedView = {
  readonly play: {
    readonly image?: string;
    readonly title: Line;
    /** A movie's year, after its title. */
    readonly year?: string;
    /** An episode: its number in bold ("2x09"), then its title ("The After Hours"). */
    readonly subtitle?: { readonly lead: string; readonly text: string; readonly href: string };
    /** "today", "yesterday" or "3 days ago", in whole UTC days. */
    readonly when: string;
    /** How far through the show the user is, for an episode. */
    readonly progress?: { readonly completed: number; readonly aired: number };
  } | null;
};
