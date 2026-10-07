import type { HiddenShowItemResponse } from '@trakt/api';
import type { CachedShow } from '../../shows/cache/CachedShow.ts';
import { toProgressShow } from './toProgressShow.ts';

/** One page of `/users/hidden/dropped`, as the typed client returned it. */
export type DroppedPage =
  | { readonly ok: true; readonly body: readonly HiddenShowItemResponse[]; readonly headers: Headers }
  | { readonly ok: false; readonly status: number };

type LoadDroppedShowsParams = {
  /** `extended=full,images`, at this page and the page size. */
  request: (page: number, limit: number) => Promise<DroppedPage>;
  now?: () => number;
  limit?: number;
};

const LIMIT = 100;

/**
 * The shows you dropped, with their summaries, from the endpoint v3's Dropped tab reads (`/users/hidden/dropped`), a
 * page of 100 at a time. The Dropped tab reads it only for the dropped shows `up_next_nitro` leaves out.
 */
export async function loadDroppedShows(
  { request, now = Date.now, limit = LIMIT }: LoadDroppedShowsParams,
): Promise<ReadonlyMap<number, CachedShow>> {
  const read = async (page: number) => {
    const response = await request(page, limit);
    if (!response.ok) throw new Error(`hidden/dropped page ${page}: ${response.status}`);
    return response;
  };
  const first = await read(1);
  const pages = Number(first.headers.get('x-pagination-page-count') ?? 1) || 1;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => read(index + 2)));
  const fetchedAt = now();

  return new Map(
    [first, ...rest].flatMap(({ body }) => body).map(({ show }) => [show.ids.trakt, toProgressShow(show, fetchedAt)]),
  );
}
