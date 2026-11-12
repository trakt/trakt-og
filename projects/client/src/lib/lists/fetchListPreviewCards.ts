import { error } from '@sveltejs/kit';
import { toDatePreferences } from '../settings/toDatePreferences.ts';
import { fetchListItems, urlListSort } from './loadListItems.ts';
import { toListItemCard } from './toListItemCard.ts';
import { toListQuery } from './toListQuery.ts';

type Params = {
  fetch: typeof fetch;
  /** The items path before its `/:type/:sort_by/:sort_how` segments. */
  base: string;
  url: URL;
};

/** The list page's items for a signed-out visitor, as the page reads them: the URL's filters, sort and page. */
export async function fetchListPreviewCards({ fetch, base, url }: Params) {
  const query = toListQuery(url.searchParams);
  const items = await fetchListItems({ fetch, token: null, base, query, sort: urlListSort(query) });
  if ([403, 404].includes(items.status)) error(404, 'Page Not Found');
  if (items.status !== 200) error(502, 'Trakt is having trouble loading this list.');

  const datePreferences = toDatePreferences(null);
  const cards = items.rows.map((row) => toListItemCard(row, { sortBy: query.sortBy ?? 'rank', datePreferences }));
  return { cards, page: query.page, total: Number(items.headers.get('x-pagination-item-count')) || cards.length };
}
