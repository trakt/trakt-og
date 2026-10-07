import type { UpNextResponse } from '@trakt/api';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';

/** A show the progress endpoints return (`up_next_nitro`, `hidden/dropped`) as og's show summary. */
export function toProgressShow(show: UpNextResponse['show'], fetchedAt: number): CachedShow {
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
