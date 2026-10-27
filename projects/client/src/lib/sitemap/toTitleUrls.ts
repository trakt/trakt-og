import { uniqueBy } from '../utils/uniqueBy.ts';
import { toLastmod } from './toLastmod.ts';
import type { SitemapUrl } from './SitemapUrl.ts';

type Title = {
  readonly ids: { readonly slug: string };
  readonly updated_at?: string | null;
};

/** How many titles of each type a sitemap lists. */
const MAX_TITLES = 2000;

/** Movie or show pages, the first of each slug in the order given, dated by the title's `updated_at`. */
export function toTitleUrls(type: 'movies' | 'shows', titles: readonly Title[]): SitemapUrl[] {
  return uniqueBy(titles, ({ ids }) => ids.slug)
    .slice(0, MAX_TITLES)
    .map(({ ids, updated_at }) => ({ path: `/${type}/${ids.slug}`, lastmod: toLastmod(updated_at) }));
}
