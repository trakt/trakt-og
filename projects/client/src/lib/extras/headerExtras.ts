import type { Component } from 'svelte';

type HeaderExtra = {
  readonly load: () => Promise<{ default: Component }>;
  /** It plays on every subpage under the summary too, not just the summary. */
  readonly subpages?: boolean;
};

/**
 * Extras that dress an item's fanart header, keyed by the summary's path (slugs are canonical: any other id redirects
 * to it). Each one lives in its own file named by `<type>-<trakt id>`.
 */
export const headerExtras: Readonly<Record<string, HeaderExtra>> = {
  '/movies/the-matrix-1999': { subpages: true, load: () => import('./movie-481-header.svelte') },
  '/shows/breaking-bad': { load: () => import('./show-1388-header.svelte') },
  '/shows/battlestar-galactica-2004': { load: () => import('./show-1959-header.svelte') },
  '/shows/severance': { load: () => import('./show-154997-header.svelte') },
};

/** The extra for a page's path, if it's an item's summary or one of the subpages its extra plays on. */
export function headerExtra(path: string) {
  return Object.entries(headerExtras).find(
    ([root, extra]) => path === root || (extra.subpages && path.startsWith(`${root}/`)),
  )?.[1].load;
}
