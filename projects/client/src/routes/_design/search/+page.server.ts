import { loadSearch } from '../../../lib/search/loadSearch.ts';
import { SEARCH_DISPLAY_COOKIES, searchDisplay } from '../../../lib/search/searchDisplay.ts';
import { toDatePreferences } from '../../../lib/settings/toDatePreferences.ts';
import { demoViewer } from '../calendars/demoViewer.ts';

// Opens on a real search, so there are results to look at.
const DEFAULT_QUERY = 'star wars';

/**
 * The search results in each Display choice, without signing in: the real loader and page on a public search, with
 * `?view=` and `?artwork=` standing in for the viewer's Display cookies. `?type=` picks the tab (shows, movies,
 * people...). Left out, it's Shows & Movies. The demo viewer stands in for the layout's, so the header and the page
 * agree.
 */
export function load({ fetch, url: requested, cookies }) {
  const url = new URL(requested);
  if (!url.searchParams.has('q') && !url.searchParams.has('query')) url.searchParams.set('q', DEFAULT_QUERY);
  const datePreferences = toDatePreferences(null);
  const picked: Readonly<Record<string, string | null>> = {
    [SEARCH_DISPLAY_COOKIES.view]: url.searchParams.get('view'),
    [SEARCH_DISPLAY_COOKIES.artwork]: url.searchParams.get('artwork'),
  };
  const display = searchDisplay({ cookies: { get: (name) => picked[name] ?? undefined }, settings: null });
  return loadSearch({
    fetch,
    cookies,
    url,
    type: url.searchParams.get('type') ?? undefined,
    parent: () => Promise.resolve({ datePreferences }),
  }).then((search) => ({ ...search, display, datePreferences, user: demoViewer }));
}
