/** One of OG's card tags (CardTag): a fanart card's, a calendar card's, or a schedule row's. */
export type CardTag = {
  text: string;
  /** Raw SVG before the text: a rating's heart. */
  icon?: string;
  /** Its own color instead of a kind's: a rating's. */
  color?: string;
  /** The pulsing dot before the text, for something playing now. */
  live?: boolean;
  /** Makes the tag a link: a VIP's network tag, to its popular shows. */
  href?: string;
  /** OG's h4 classes over a fanart. `primary` is the brand red; the `series-premiere` to `trailer` kinds are
   * OG's `episode-type-*` colors. */
  kind?:
    | 'primary'
    | 'premiere'
    | 'generic'
    | 'collect'
    | 'list'
    | 'favorite'
    | 'subscribe'
    | 'series-premiere'
    | 'season-premiere'
    | 'mid-season-premiere'
    | 'mid-season-finale'
    | 'season-finale'
    | 'series-finale'
    | 'bonus'
    | 'trailer';
};
