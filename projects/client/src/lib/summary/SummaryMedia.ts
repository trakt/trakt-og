/** The movie or show a summary page is about, as its lazy sections need it. */
export type SummaryMedia =
  & {
    /** Trakt id, for the overlay and the comment cards. */
    readonly id: number;
    readonly slug: string;
    /** The comment cards' share title: "Fight Club (1999)", "Breaking Bad". */
    readonly title: string;
    /** Shows only: the author's and the viewer's progress on the comment cards, and People Watched's scale. */
    readonly airedEpisodes?: number;
    /** Shows only: every aired episode's runtime in minutes, for People Watched's scale. */
    readonly totalRuntime?: number;
  }
  & ({ readonly type: 'movie' | 'show'; readonly season?: never } | {
    readonly type: 'season';
    readonly season: number;
  } | {
    readonly type: 'episode';
    readonly season: number;
    readonly episode: number;
  });
