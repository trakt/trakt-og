import { titleFanart } from './titleFanart.ts';

/** A film line over that film's fanart, heading an empty dashboard panel. */
export type PanelQuote = {
  readonly film: string;
  /** The title's Trakt slug, for its fanart. */
  readonly slug: string;
  /** A show's line instead of a movie's. */
  readonly show?: boolean;
  readonly quote: string;
  /** Where the art keeps its subject, when it isn't centered. */
  readonly focus?: string;
};

export const panelQuotes = {
  upNext: { film: 'Lost', slug: 'lost-2004', show: true, quote: 'We have to go back!' },
  schedule: { film: 'Game of Thrones', slug: 'game-of-thrones', show: true, quote: 'Winter is coming.' },
  watchlist: { film: 'Jaws', slug: 'jaws-1975', quote: "You're gonna need a bigger watchlist." },
  recentlyWatched: { film: 'Field of Dreams', slug: 'field-of-dreams-1989', quote: 'If you track it, they will come.' },
  socialFeed: { film: 'The Godfather', slug: 'the-godfather-1972', quote: 'Keep your friends close.' },
  recommendations: {
    film: 'Forrest Gump',
    slug: 'forrest-gump-1994',
    quote: "You never know what you're gonna get.",
    focus: 'right center',
  },
} as const satisfies Record<string, PanelQuote>;

/** The film's or show's fanart. */
export const quoteFanart = ({ slug, show }: PanelQuote) => titleFanart(show ? 'shows' : 'movies', slug);
