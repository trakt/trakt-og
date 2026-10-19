import type { UpNextResponse } from '@trakt/api';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';

type Nullish<T> = T | null | undefined;

/** The fields read from a show, which the progress endpoints and a list's `extended=full,images` items all send. */
type ProgressShowSource = Pick<UpNextResponse['show'], 'title'> & {
  readonly ids: { readonly trakt: number; readonly slug: string };
  readonly year?: Nullish<number>;
  readonly status?: Nullish<string>;
  readonly genres?: Nullish<readonly string[]>;
  readonly runtime?: Nullish<number>;
  readonly total_runtime?: Nullish<number>;
  readonly rating?: Nullish<number>;
  readonly votes?: Nullish<number>;
  readonly aired_episodes?: Nullish<number>;
  readonly first_aired?: Nullish<string>;
  readonly last_aired?: Nullish<string>;
  readonly images?: Nullish<
    { readonly poster?: Nullish<readonly string[]>; readonly fanart?: Nullish<readonly string[]> }
  >;
};

/** A show the progress endpoints (`up_next_nitro`, `hidden/dropped`) or a list return, as og's show summary. */
export function toProgressShow(show: ProgressShowSource, fetchedAt: number): CachedShow {
  return {
    id: show.ids.trakt,
    slug: show.ids.slug,
    title: show.title,
    year: show.year ?? undefined,
    status: show.status ?? undefined,
    genres: show.genres ?? [],
    runtime: show.runtime ?? undefined,
    totalRuntime: show.total_runtime ?? undefined,
    rating: show.rating ?? undefined,
    votes: show.votes ?? undefined,
    airedEpisodes: show.aired_episodes ?? undefined,
    firstAired: show.first_aired ?? undefined,
    lastAired: show.last_aired ?? undefined,
    poster: show.images?.poster?.at(0),
    fanart: show.images?.fanart?.at(0),
    fetchedAt,
    complete: Boolean(show.images),
  };
}
