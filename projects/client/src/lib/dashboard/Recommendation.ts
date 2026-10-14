/** A title that led to a recommendation: one the viewer watched (with their rating), loved, or both. */
export type RecommendationSource = {
  readonly type: 'show' | 'movie';
  readonly id: number;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  readonly poster?: string;
  /** The viewer's rating, 1 to 10, when they rated it. */
  readonly stars?: number;
  readonly watched: boolean;
  readonly loved: boolean;
};

/** One dashboard recommendation: the spotlight's details and why it was picked, grouped like v3's "Why this?". */
export type Recommendation = {
  readonly type: 'show' | 'movie';
  readonly id: number;
  /** The API path for Watch Now: `/shows/1388`. */
  readonly path: string;
  readonly href: string;
  readonly title: string;
  readonly year?: number;
  readonly overview?: string;
  /** Out by `now`. Like the other cards, an unreleased title shows no rating. */
  readonly released: boolean;
  /** The Trakt rating, 0 to 10. */
  readonly rating?: number;
  readonly runtime?: number;
  readonly airedEpisodes?: number;
  readonly certification?: string;
  readonly genres: readonly string[];
  readonly network?: string;
  readonly poster?: string;
  readonly fanart?: string;
  /** The poster's two main colors, from `extended=colors`. */
  readonly colors?: readonly [string, string];
  readonly why: {
    /** Each title behind the pick once, in the API's order, with every way it counted. */
    readonly titles: readonly RecommendationSource[];
    /** Each source's subgenre names, deduplicated. */
    readonly likes: readonly string[];
  };
};
