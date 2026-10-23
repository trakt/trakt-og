import type { ListQuery } from './ListQuery.ts';

type Params = {
  query: Pick<ListQuery, 'genres' | 'terms' | 'watchnow' | 'hide'>;
  extended: string;
  page: number;
  limit: number;
};

/** A list items read's search: the page, its size, and the genre, text, streaming and hide filters. */
export function toListItemsSearch({ query, extended, page, limit }: Params): URLSearchParams {
  const search = new URLSearchParams({
    extended,
    page: String(page),
    limit: String(limit),
    ...(query.genres.length > 0 && { genres: query.genres.join(',') }),
  });
  if (query.terms) search.set('terms', query.terms);
  if (query.watchnow) search.set('watchnow', query.watchnow);
  if (query.hide?.length) search.set('hide', query.hide.join(','));
  // The worker reads only some hides from `hide` (not `nonotes`); a `hide_<id>` flag hands the rest to the API.
  for (const id of query.hide ?? []) search.set(`hide_${id === 'nonotes' ? 'no_notes' : id}`, 'true');
  return search;
}
