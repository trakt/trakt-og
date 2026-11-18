import type { FilterOption } from './filterOptions.ts';
import { fetchStudios } from './fetchStudios.ts';
import { studioNames } from './studioNames.svelte.ts';

/** The API answers from two letters on. */
export const STUDIO_SEARCH_MIN = 2;
const LIMIT = 20;

/**
 * The studios whose names start with `query`, by slug, since the API filters studios by slug. Their names are kept,
 * so the pick's chip reads right after the page reloads with it.
 */
export async function searchStudios(query: string, signal?: AbortSignal): Promise<FilterOption[]> {
  const term = query.trim();
  if (term.length < STUDIO_SEARCH_MIN) return [];

  const studios = await fetchStudios(term, LIMIT, signal);
  studioNames.remember(studios);
  return studios.map(({ slug, name }) => ({ value: slug, label: name }));
}
