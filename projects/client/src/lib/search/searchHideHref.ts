import type { FadeHideOption } from '../components/filters/fadeHide.ts';
import type { ReadonlyURL } from '$app/state';

/** A changed Hide selection starts at page one and keeps the search terms and other filters. */
export function searchHideHref(url: ReadonlyURL, hide: readonly FadeHideOption[]): string {
  const search = new URLSearchParams(url.search);
  search.delete('page');
  // Keep an empty hide= to override saved preferences in history/bookmarked URLs.
  search.set('hide', hide.map((id) => (id === 'watchlisted' ? 'watchlist' : id)).join(','));
  return `${url.pathname}?${search}`;
}
