import { browser } from '$app/environment';
import { createRecentSearches } from './createRecentSearches.svelte.ts';

const stores = new Map<string, ReturnType<typeof createRecentSearches>>();

// Reached on each call, since blocked site data makes reading localStorage itself throw.
const browserStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

/**
 * The viewer's recent searches in this browser. The header search and the search page's sidebar share one list, so a
 * change in either shows in both, and a change in another tab shows here too. On the server it's always empty.
 */
export function viewerRecentSearches(viewer: string) {
  if (!browser) return createRecentSearches({ key: '' });
  const existing = stores.get(viewer);
  if (existing) return existing;

  const key = `og-recent-searches:${viewer}`;
  const store = createRecentSearches({ key, storage: browserStorage });
  stores.set(viewer, store);
  addEventListener('storage', (event) => {
    if (event.key === key || event.key === null) store.reload();
  });
  return store;
}
