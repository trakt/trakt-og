// FIXME(zod-4): see noteRowsSchema.ts. og has one zod, the one @trakt/api depends on.
import { z } from 'zod/v4';
import { rawApiFetch } from '../../api/rawApiFetch.ts';

export type StudioName = { readonly slug: string; readonly name: string };

const studiosSchema = z.array(z.object({ slug: z.string(), name: z.string() }));

/** The studios whose slugs start like `query`'s, from the smart list builder's public search. */
export async function fetchStudios(query: string, limit: number, signal?: AbortSignal): Promise<StudioName[]> {
  const params = new URLSearchParams({ query, limit: `${limit}` });
  const response = await rawApiFetch({ path: `/smart-lists/filter-options/studios?${params}`, init: { signal } });
  if (!response.ok) throw new Error(`studio search answered ${response.status}`);
  return studiosSchema.parse(await response.json());
}
