import { rawApiFetch } from '../../api/rawApiFetch.ts';
import type { SearchHit } from '../../search/SearchHit.ts';
import { searchRowsSchema } from '../../search/searchRowsSchema.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { searchTypes } from './searchTypes.ts';
import { type SearchRow, toSearchRow } from './toSearchRow.ts';

type SearchAutocompleteParams = {
  type: (typeof searchTypes)[number];
  query: string;
  dates?: Pick<DatePreferences, 'order' | 'timeZone'>;
  /** The viewer's date, `YYYY-MM-DD`, for people's ages. */
  today?: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

export type SearchAutocompleteResult = {
  readonly rows: ReadonlyArray<SearchRow>;
  /** "View all **N** results". Null hides the row: ID lookups have none. */
  readonly count: string | null;
};

// OG showed 3 rows (`SEARCH_AUTOCOMPLETE_RESULT_COUNT`); og shows 5, like the most searched list.
const SHOWN = 5;
// ponytail: the worker's item count is min(total, limit), so a limit=3 call always says 3. Ask for the logged-out
// cap instead, show the first 3 and count up to it ("50+"). Switch to limit=3 once the worker returns the real total.
const COUNT_LIMIT = 50;

const toRows = (hits: ReadonlyArray<SearchHit>, { dates, today }: Pick<SearchAutocompleteParams, 'dates' | 'today'>) =>
  hits
    .map((hit) => toSearchRow(hit, dates, today))
    .filter((row) => row !== null)
    .slice(0, SHOWN);

const toCount = (count: number) => (count >= COUNT_LIMIT ? `${COUNT_LIMIT}+` : count.toLocaleString('en-US'));

const none: SearchAutocompleteResult = { rows: [], count: null };

/** The header dropdown's results for one type and query. */
export async function searchAutocomplete({
  type,
  query,
  dates,
  today,
  fetch,
  signal,
}: SearchAutocompleteParams): Promise<SearchAutocompleteResult> {
  const init = { signal };

  if ('idType' in type) {
    const response = await rawApiFetch({
      fetch,
      path: `/search/${type.idType}/${encodeURIComponent(query)}?extended=full`,
      init,
    });
    const hits = response.ok ? searchRowsSchema.safeParse(await response.json().catch(() => null)) : null;
    return hits?.success ? { rows: toRows(hits.data, { dates, today }), count: null } : none;
  }

  if (!('text' in type)) return none;

  const search = new URLSearchParams({ query, limit: `${COUNT_LIMIT}`, extended: 'full' });
  const response = await rawApiFetch({ fetch, path: `/search/${type.text}?${search}`, init });
  const hits = response.ok ? searchRowsSchema.safeParse(await response.json().catch(() => null)) : null;
  if (!hits?.success) return none;

  const count = Number(response.headers.get('x-pagination-item-count') ?? hits.data.length);
  return { rows: toRows(hits.data, { dates, today }), count: count > 0 ? toCount(count) : null };
}
