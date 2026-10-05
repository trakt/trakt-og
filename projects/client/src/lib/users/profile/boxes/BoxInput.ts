import type { WatchedGenreRow } from '../watchedGenresSchema.ts';
import type { BoxFrame } from './BoxFrame.ts';

type Ids = { readonly trakt: number; readonly slug: string };
type Images = {
  readonly fanart?: readonly string[] | null;
  readonly poster?: readonly string[] | null;
} | null;
type Media = {
  readonly ids: Ids;
  readonly title: string;
  readonly year?: number | null;
  readonly runtime?: number | null;
  readonly genres?: readonly string[] | null;
  readonly images?: Images;
};
type Episode = {
  readonly ids: { readonly trakt: number };
  readonly season: number;
  readonly number: number;
  readonly number_abs?: number | null;
  readonly title?: string | null;
  readonly runtime?: number | null;
};

/** The history fields the boxes read. API rows fit as they are. */
type EpisodePlay = { readonly watched_at: string; readonly episode: Episode; readonly show: Media };
type MoviePlay = { readonly watched_at: string; readonly movie: Media };

/**
 * Everything the profile has already loaded, in the shapes the boxes read. Every box scores and maps from this, plus
 * its own extra request if it declared one.
 */
export type BoxInput = BoxFrame & {
  /** Today as whole UTC days since 1970, from the request's `now`. Every "days ago" counts from here. */
  readonly today: number;
  /** The newest episode and movie play, with images. */
  readonly latest: { readonly episode?: EpisodePlay; readonly movie?: MoviePlay };
  /** Every play from midnight UTC 30 days back, with runtimes and genres but no images. */
  readonly recent: { readonly episodes: readonly EpisodePlay[]; readonly movies: readonly MoviePlay[] };
  /** The watchlist's first rows by rank, and how many items it has. */
  readonly watchlist: {
    readonly count: number;
    readonly rows: readonly { readonly movie?: Media | null; readonly show?: Media | null }[];
  };
  /** All-time watched genres, most played first. */
  readonly genres: readonly WatchedGenreRow[];
};
