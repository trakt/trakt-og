import { listFilterKeys, rangeFilterKeys } from '../components/filters/advancedFilters.ts';

/** The advanced filters, Watch Now, and a comment page's language. */
const FILTERS = [...listFilterKeys, ...rangeFilterKeys, 'watchnow', 'language'];

const SORTS = ['sort', 'sort_by', 'sort_how'];

/** List, credit and episode controls: item types, hide and fade toggles, the terms box and a credits group. */
const VIEWS = ['display', 'hide', 'fade', 'terms', 'actors', 'crew'];

/**
 * Query params that only re-filter, re-sort or re-arrange a page crawlers can already reach without them.
 * Search's `query` and `q` stay open: og redirects retired search tabs to `/search?query=`, and search pages
 * keep themselves out of the index with a `noindex` tag that crawlers must fetch to see. `type` stays open too,
 * since `/*?*type=` would also match search's `id_type`.
 */
export const CRAWL_BLOCKED_PARAMS: readonly string[] = [...FILTERS, ...SORTS, ...VIEWS];
