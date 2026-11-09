import { mediaImage } from '../images/mediaImage.ts';

/** A film line over that film's fanart, heading an empty dashboard panel. */
export type PanelQuote = {
  readonly film: string;
  /** The title's Trakt id, for its fanart. */
  readonly id: number;
  /** A show's line instead of a movie's. */
  readonly show?: boolean;
  readonly quote: string;
  /** Where the art keeps its subject, when it isn't centered. */
  readonly focus?: string;
};

export const panelQuotes = {
  upNext: { film: 'Lost', id: 4583, show: true, quote: 'We have to go back!' },
  schedule: { film: 'Game of Thrones', id: 1390, show: true, quote: 'Winter is coming.' },
  watchlist: { film: 'Jaws', id: 457, quote: "You're gonna need a bigger watchlist." },
  recentlyWatched: { film: 'Field of Dreams', id: 1640, quote: 'If you track it, they will come.' },
  socialFeed: { film: 'The Godfather', id: 196, quote: 'Keep your friends close.' },
  recommendations: {
    film: 'Forrest Gump',
    id: 9,
    quote: "You never know what you're gonna get.",
    focus: 'right center',
  },
} as const satisfies Record<string, PanelQuote>;

/** The film's or show's fanart. */
export const quoteFanart = ({ id, show }: PanelQuote) =>
  Promise.resolve(mediaImage({ type: show ? 'show' : 'movie', id, slot: 'fanart', size: 'full' }));
