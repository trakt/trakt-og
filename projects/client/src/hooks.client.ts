import { navigating } from '$app/state';
import { createBackCache } from './lib/routing/createBackCache.ts';
import type { ClientInit } from '@sveltejs/kit';

const pageKey = (url: URL) => `${url.pathname.replace(/\/$/, '')}?${url.searchParams}`;

/**
 * Back and Forward show the page from memory when this tab loaded it in the last few minutes (`createBackCache`).
 * It wraps `window.fetch` before any of og's modules load, so every write, wherever it's sent from, empties it.
 * Leaving the tab empties it too: a write in another tab or app can't come back stale.
 */
export const init: ClientInit = () => {
  const cache = createBackCache({
    fetch: window.fetch.bind(window),
    origin: location.origin,
    isBack: (page) => navigating.type === 'popstate' && !!navigating.to && pageKey(navigating.to.url) === pageKey(page),
  });
  window.fetch = cache.fetch;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cache.clear();
  });
};
