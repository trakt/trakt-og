import { searchTypes } from '../components/header/searchTypes.ts';
import type { SearchType } from './SearchType.ts';
import { isIdType } from './isIdType.ts';

/**
 * The search picker's types, grouped like the header search: the text types under "Trakt", then the IDs under "By ID".
 * Each link keeps the query and filters, and drops page so a new type starts on page 1.
 */
export function searchLinks(current: SearchType, query: string, search = new URLSearchParams()) {
  const params = new URLSearchParams(search);
  for (const name of ['page', 'q', 'query']) params.delete(name);
  if (query) params.set('query', query);
  const suffix = params.size > 0 ? `?${params}` : '';
  const links = (idMode: boolean) =>
    searchTypes
      .filter((type) => isIdType(type) === idMode)
      .map((type) => ({
        label: type.label,
        href: `/search${type.slug ? `/${type.slug}` : ''}${suffix}`,
        current: type.slug === current.slug,
      }));
  return [{ label: 'Trakt', links: links(false) }, { label: 'By ID', links: links(true) }];
}
