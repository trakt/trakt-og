import { loadSearch } from '../../../lib/search/loadSearch.ts';
import { toDatePreferences } from '../../../lib/settings/toDatePreferences.ts';
import { demoViewer } from '../calendars/demoViewer.ts';

// Opens on a real search, so there are results to look at.
const DEFAULT_QUERY = 'star wars';

/**
 * The search results as a signed-in viewer with a search image type sees them, without signing in: the real loader
 * and page on a public search, with `?image=` standing in for the viewer's `browsing.search.image_type`. `?type=` picks
 * the tab (shows, movies, episodes...). Left out, it's Shows & Movies. The demo viewer stands in for the layout's, so
 * the header and the page agree.
 */
export function load({ fetch, url: requested, cookies }) {
  const url = new URL(requested);
  if (!url.searchParams.has('q') && !url.searchParams.has('query')) url.searchParams.set('q', DEFAULT_QUERY);
  const datePreferences = toDatePreferences(null);
  const settings = { browsing: { search: { image_type: url.searchParams.get('image') } } };
  return loadSearch({
    fetch,
    cookies,
    url,
    type: url.searchParams.get('type') ?? undefined,
    parent: () => Promise.resolve({ datePreferences, settings }),
  }).then((search) => ({ ...search, datePreferences, user: demoViewer }));
}
