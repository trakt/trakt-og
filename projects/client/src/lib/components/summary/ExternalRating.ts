/** Which logo the ratings bar shows next to an external rating. */
export type ExternalRatingLogo =
  | 'imdb'
  | 'letterboxd'
  | 'mal'
  | 'tmdb'
  | 'tomatometer-certified'
  | 'tomatometer-fresh'
  | 'tomatometer-rotten'
  | 'audience-certified'
  | 'audience-spilled'
  | 'audience-upright'
  | 'metacritic'
  | 'justwatch';

/** One entry in the ratings strip's "other sites" group: IMDb, Letterboxd, MyAnimeList, TMDB, Rotten Tomatoes, Metacritic, JustWatch. */
export interface ExternalRating {
  readonly logo: ExternalRatingLogo;
  /** The site's name: the image's alt text and its accessible name. */
  readonly title: string;
  /** The tooltip: the exact vote count ("998,068 votes"), or what the number is ("Metascore"). */
  readonly detail: string;
  /** The vote count behind the rating, for the sites that give one: the tooltip bolds it. */
  readonly votes?: number;
  readonly href: string;
  readonly rating: string;
  /** The rating on one 100 point scale, so sites compare: IMDb's 6.8 is 68. JustWatch's rank has none. */
  readonly score?: number;
  /** Metacritic colors its logo ring by score, like OG's `metascore_class`. */
  readonly metascore?: 'high' | 'medium' | 'low';
  /** JustWatch's 30-day rank change, signed ("+15", "-113"), leading the tooltip's second line in bold. */
  readonly change?: { readonly text: string; readonly trend: 'up' | 'down' | 'flat' };
}
