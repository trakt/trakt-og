import type { SearchListType } from './searchListTypes.ts';
import type { ReadonlyURL } from '$app/state';

/** The page's own URL browsing another list type, from page 1. All leaves `type` out. */
export function searchListTypeHref(url: ReadonlyURL, type: SearchListType): string {
  const params = new URLSearchParams(url.search);
  params.delete('page');
  if (type === 'all') params.delete('type');
  else params.set('type', type);
  return params.size > 0 ? `${url.pathname}?${params}` : url.pathname;
}
