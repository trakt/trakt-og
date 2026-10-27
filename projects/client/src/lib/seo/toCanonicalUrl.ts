import { positiveInt } from '../utils/positiveInt.ts';
import { SITE_ORIGIN } from './siteOrigin.ts';

type Params = {
  url: URL;
  /** Another path that shows the same page: `/home` is `/`. */
  path?: string;
};

/**
 * The page's one absolute URL, always on og's production origin. Filters, sorts, view toggles, share and tracking
 * parameters all go; only a list's `?page=` past the first stays. No trailing slash, as SvelteKit redirects.
 */
export function toCanonicalUrl({ url, path = url.pathname }: Params): string {
  const pathname = path.length > 1 ? path.replace(/\/+$/, '') : path;
  const page = positiveInt(url.searchParams.get('page'), 1);
  return `${SITE_ORIGIN}${pathname}${page > 1 ? `?page=${page}` : ''}`;
}
