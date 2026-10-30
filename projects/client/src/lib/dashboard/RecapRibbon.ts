/** UTC instants bounding a month's (or the year's) history, as the plays were counted. */
export type RecapSpan = { readonly start: string; readonly end: string };

export type RecapTag = { readonly kind: 'review' } | { readonly kind: 'left'; readonly days: number };

export type RecapMonth = {
  /** 1 to 12. */
  readonly number: number;
  /** "Sep". */
  readonly month: string;
  /** Discover's theme for the month, which picks its accent. */
  readonly theme: string;
  readonly state: 'past' | 'current' | 'future';
  /** How far through the month today is, 0 to 1. */
  readonly progress: number;
  /** The month's plays; null for months to come. */
  readonly plays: number | null;
  /** The plays against the busiest month, 0 to 1, for the bar. */
  readonly share: number;
  /** The line under the month: its plays, empty for months to come. */
  readonly caption: string;
  /** A tag beside the month: the latest finished month is the Month in Review, and this one counts its days left. */
  readonly tag: RecapTag | null;
  /** What a screen reader hears for the cell. */
  readonly label: string;
  /** Month in Review for months gone by, the history for this one, nothing for those to come. */
  readonly href: string | null;
  /** The hover card's title: "October 2026 so far". */
  readonly heading: string;
  /** The history window its plays came from, for the card's split; null for months to come. */
  readonly span: RecapSpan | null;
};

export type RecapRibbon = {
  readonly year: number;
  /** "Year to Date", or "Year in Review" from December 18th, as OG's dashboard button read. */
  readonly title: string;
  readonly plays: number;
  readonly href: string;
  readonly heading: string;
  readonly span: RecapSpan | null;
  readonly months: readonly RecapMonth[];
};
