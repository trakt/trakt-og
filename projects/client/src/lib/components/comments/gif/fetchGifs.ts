// FIXME(zod-4): og has one zod, the one @trakt/api depends on. See `src/lib/users/notes/noteRowsSchema.ts`.
import { z } from 'zod/v4';
import type { GifEntry } from './GifEntry.ts';
import { klipyGifSchema } from './klipyGifSchema.ts';
import { klipyUrl } from './klipyUrl.ts';
import { toGifEntry } from './toGifEntry.ts';

// Sponsored entries ride along in the same array, so items are parsed one by one.
const pageSchema = z.object({ data: z.object({ data: z.array(z.unknown()), has_next: z.boolean() }) });

type FetchGifsParams = {
  /** Empty for what's trending. */
  query: string;
  page: number;
  limit: number;
  customerId: string;
  fetch?: typeof fetch;
};

type GifPage = { readonly entries: readonly GifEntry[]; readonly hasNext: boolean };

/** A page of Klipy's trending GIFs, or of a search. Rejects when Klipy can't be reached. */
export async function fetchGifs(
  { query, page, limit, customerId, fetch = globalThis.fetch }: FetchGifsParams,
): Promise<GifPage> {
  const params = new URLSearchParams({ customer_id: customerId, page: `${page}`, per_page: `${limit}` });
  if (query) params.set('q', query);

  const response = await fetch(klipyUrl(query ? 'gifs/search' : 'gifs/trending', params));
  if (!response.ok) throw new Error(`Klipy GIFs failed (${response.status})`);

  const parsed = pageSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) return { entries: [], hasNext: false };

  return {
    entries: parsed.data.data.data.flatMap((item) => {
      const gif = klipyGifSchema.safeParse(item);
      return gif.success ? [toGifEntry(gif.data)] : [];
    }),
    hasNext: parsed.data.data.has_next,
  };
}
