import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import { toast } from '$lib/components/toast/toast.svelte';
import { createRecentSearches } from './createRecentSearches.svelte.ts';
import { requestRecentSearch } from './requestRecentSearch.ts';

/**
 * The viewer's recent searches, wired the way every list of them is: the browser copy in localStorage (when it's
 * available), API for the signed-in history, and a toast when a change fails. The header search and the search page's
 * sidebar each make one, and dispose of it when they go.
 */
export function viewerRecentSearches(viewer: string | null) {
  let storage: Storage | undefined;
  try {
    storage = localStorage;
  } catch { /* Memory-only history is still usable. */ }
  return createRecentSearches({
    viewer,
    storage,
    notify: toast.error,
    request: (path, body) =>
      requestRecentSearch({
        fetch: viewer ? authenticatedFetch({ manager: userManager() }) : undefined,
        path,
        body,
      }),
  });
}
