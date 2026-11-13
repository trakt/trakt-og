import type { ListQuery } from './ListQuery.ts';

type Params = {
  query: Pick<ListQuery, 'genres' | 'terms' | 'watchnow'>;
  extended: string;
  page: number;
  limit: number;
};

/**
 * A list items read's search: the page, its size, and the genre, text and streaming filters. The hides aren't sent:
 * the page applies them to the whole list (`listHide.ts`), so they don't depend on which ones the API supports.
 */
export function toListItemsSearch({ query, extended, page, limit }: Params): URLSearchParams {
  const search = new URLSearchParams({
    extended,
    page: String(page),
    limit: String(limit),
    ...(query.genres.length > 0 && { genres: query.genres.join(',') }),
  });
  if (query.terms) search.set('terms', query.terms);
  if (query.watchnow) search.set('watchnow', query.watchnow);
  return search;
}
