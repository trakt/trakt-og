import type { SearchListType } from './searchListTypes.ts';

/** The page's own URL browsing another list type, from page 1. All leaves `type` out. */
export function searchListTypeHref(url: URL, type: SearchListType): string {
  const params = new URLSearchParams(url.searchParams);
  params.delete('page');
  if (type === 'all') params.delete('type');
  else params.set('type', type);
  return params.size > 0 ? `${url.pathname}?${params}` : url.pathname;
}
