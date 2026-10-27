import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { type FilterOption, toNetworkOptions } from './filterOptions.ts';

/** The API answers from two letters on. */
export const NETWORK_SEARCH_MIN = 2;
const LIMIT = 20;

/**
 * The networks whose names start with `query`, from the smart list builder's public search: a few hundred bytes a
 * keystroke instead of every network up front. Public, so no token goes with it.
 */
export async function searchNetworks(query: string, signal?: AbortSignal): Promise<FilterOption[]> {
  const term = query.trim();
  if (term.length < NETWORK_SEARCH_MIN) return [];

  const params = new URLSearchParams({ query: term, limit: `${LIMIT}` });
  const response = await rawApiFetch({ path: `/smart-lists/filter-options/networks?${params}`, init: { signal } });
  if (!response.ok) throw new Error(`network search answered ${response.status}`);
  return toNetworkOptions(await response.json());
}
