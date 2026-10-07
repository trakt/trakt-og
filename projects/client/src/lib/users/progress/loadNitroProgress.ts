import type { UpNextResponse } from '@trakt/api';
import type { ProgressItem } from './ProgressItem.ts';
import { toNitroItem } from './toNitroItem.ts';

/** One page of `/sync/progress/up_next_nitro`, as the typed client returned it. */
export type NitroPage =
  | { readonly ok: true; readonly body: readonly UpNextResponse[]; readonly headers: Headers }
  | { readonly ok: false; readonly status: number };

type LoadNitroProgressParams = {
  /** `intent=all`, at this page and the page size. */
  request: (page: number, limit: number) => Promise<NitroPage>;
  now?: () => number;
  /** v3 reads 100 a page. */
  limit?: number;
};

const LIMIT = 100;

/**
 * Every show you've started, with its progress, from the endpoint v3's progress page reads
 * (`/sync/progress/up_next_nitro`): the first page says how many there are, then the rest load together. About five
 * requests for 440 shows. A failed page fails the whole read, so the page never shows half your shows as all of them.
 */
export async function loadNitroProgress(
  { request, now = Date.now, limit = LIMIT }: LoadNitroProgressParams,
): Promise<readonly ProgressItem[]> {
  const read = async (page: number) => {
    const response = await request(page, limit);
    if (!response.ok) throw new Error(`up_next_nitro page ${page}: ${response.status}`);
    return response;
  };
  const first = await read(1);
  const pages = Number(first.headers.get('x-pagination-page-count') ?? 1) || 1;
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => read(index + 2)));
  const fetchedAt = now();
  const seen = new Set<number>();

  // A show that moves between pages while they load would come back twice.
  return [first, ...rest].flatMap(({ body }) => body).flatMap((row) => {
    if (seen.has(row.show.ids.trakt)) return [];
    seen.add(row.show.ids.trakt);
    return [toNitroItem(row, fetchedAt)];
  });
}
