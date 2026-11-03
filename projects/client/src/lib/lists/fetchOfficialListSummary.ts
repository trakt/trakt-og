import { api } from '../api/api.ts';
import { fetchListSummary } from './fetchListSummary.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  id: string;
  query?: { extended?: 'images' };
};

// The official list ranked first for its own name in a live search among 70 lists sharing it.
const SEARCH_LIMIT = 25;

/**
 * An official list's summary by slug or Trakt id. The API resolves a slug to any list carrying it, and personal lists
 * can share an official list's slug. When a slug lands on a personal list, the official one is found by name in list
 * search and read by its Trakt id. Otherwise the first read is returned as is.
 */
export async function fetchOfficialListSummary({ fetch, id, query }: Params) {
  const client = api({ fetch });
  const read = (key: string) => fetchListSummary(() => client.lists.summary({ params: { id: key }, query }));

  const found = await read(id);
  if (found?.status !== 200 || found.body.type === 'official' || /^\d+$/.test(id)) return found;

  const search = await client.search.query({
    params: { type: 'list' },
    query: { query: id.replaceAll('-', ' '), limit: SEARCH_LIMIT },
  });
  if (search.status !== 200) return found;

  const official = search.body.find(({ list }) => list?.type === 'official' && list.ids.slug === id)?.list;
  return official ? read(String(official.ids.trakt)) : found;
}
