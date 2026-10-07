import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import type { CatalogEpisode } from '../../shows/cache/ShowCatalog.ts';

/** One episode square under an open season. */
export type ProgressEpisodeData = {
  readonly number: number;
  readonly title?: string;
  readonly done: boolean;
  /** In your library, whichever tab this is. */
  readonly collected: boolean;
  readonly plays: number;
  readonly minutesWatched: number;
  /** The last watch, or when it was added to the library. */
  readonly at?: string;
  readonly firstAired?: string;
  /** Minutes, the show's when the episode has none. */
  readonly runtime: number;
  /** The Trakt rating, 0 to 10. */
  readonly rating?: number;
  /** The `extended=images` screenshot path. */
  readonly screenshot?: string;
};

export type ProgressSeasonData = {
  readonly number: number;
  readonly title?: string;
  readonly aired: number;
  readonly completed: number;
  readonly plays: number;
  readonly minutesWatched: number;
  readonly minutesLeft: number;
  readonly episodes: readonly ProgressEpisodeData[];
  /** Announced episodes that haven't aired yet, or have no air date. */
  readonly upcoming: readonly { readonly number: number; readonly title?: string; readonly firstAired?: string }[];
};

/** What only the show's catalog knows: read when the row's seasons open. */
export type ProgressDetail = {
  readonly seasons: readonly ProgressSeasonData[];
  readonly next?: CatalogEpisode;
  readonly last?: CatalogEpisode;
};

/**
 * One show's progress. Watched and Rewatching rows come from `/sync/progress/up_next_nitro` (`toNitroItem`), which
 * counts them on the server and names the next and last episodes. A dropped show the endpoint leaves out is counted in
 * the browser from the overlay and its summary (`toProgressItem`), with estimated times (`exact` off). Either way,
 * opening the seasons reads the show's catalog for `detail`.
 */
export type ProgressItem = {
  readonly show: CachedShow;
  readonly aired: number;
  readonly completed: number;
  /** Every play, rewatches included. */
  readonly plays: number;
  readonly minutesWatched: number;
  readonly minutesLeft: number;
  readonly exact: boolean;
  /** The last watch. */
  readonly lastAt?: string;
  /** Up next, as the API named it. */
  readonly next?: CatalogEpisode;
  /** The episode watched last, as the API named it. */
  readonly last?: CatalogEpisode;
  readonly resetAt?: string;
  readonly droppedAt?: string;
  readonly detail?: ProgressDetail;
};
