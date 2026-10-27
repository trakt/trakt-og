import type { UpNextResponse } from '@trakt/api';
import type { ProgressItem } from './ProgressItem.ts';
import { toNitroItem } from './toNitroItem.ts';

/** One page of `/sync/progress/up_next_nitro`, as the typed client returned it. */
export type NitroPage =
  | { readonly ok: true; readonly body: readonly UpNextResponse[]; readonly headers: Headers }
  | { readonly ok: false; readonly status: number };

/** `all` is only the shows the server counts as unfinished; `completed` is the rest. */
export type NitroIntent = 'all' | 'completed';

const INTENTS: readonly NitroIntent[] = ['all', 'completed'];

type LoadNitroProgressParams = {
  /** One intent, at this page and the page size. */
  request: (intent: NitroIntent, page: number, limit: number) => Promise<NitroPage>;
  now?: () => number;
  /** v3 reads 100 a page. */
  limit?: number;
};

const LIMIT = 100;

/**
 * Every show you've started, with its progress, from the endpoint v3's progress page reads
 * (`/sync/progress/up_next_nitro`). `intent=all` leaves out every show the server files as completed, so `completed`
 * loads beside it: Hide Completed needs those shows, and the server files a show as completed once its newest episode
 * is watched, even with an earlier one unwatched (`toProgressItems` recounts it). Each intent's first page says how
 * many there are, then the rest load together. A failed page fails the whole read, so the page never shows half your
 * shows as all of them.
 */
export async function loadNitroProgress({
  request,
  now = Date.now,
  limit = LIMIT,
}: LoadNitroProgressParams): Promise<readonly ProgressItem[]> {
  const read = async (intent: NitroIntent, page: number) => {
    const response = await request(intent, page, limit);
    if (!response.ok) throw new Error(`up_next_nitro ${intent} page ${page}: ${response.status}`);
    return response;
  };
  const readIntent = async (intent: NitroIntent) => {
    const first = await read(intent, 1);
    const pages = Number(first.headers.get('x-pagination-page-count') ?? 1) || 1;
    const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => read(intent, index + 2)));
    return [first, ...rest];
  };
  const responses = (await Promise.all(INTENTS.map(readIntent))).flat();
  const fetchedAt = now();
  const seen = new Set<number>();

  // A show that moves between pages, or finishes, while they load would come back twice.
  return responses
    .flatMap(({ body }) => body)
    .flatMap((row) => {
      if (seen.has(row.show.ids.trakt)) return [];
      seen.add(row.show.ids.trakt);
      return [toNitroItem(row, fetchedAt)];
    });
}
