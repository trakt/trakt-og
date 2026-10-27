import { api } from '../api/api.ts';
import { fetchAllPages } from './fetchAllPages.ts';
import type { SitemapUrl } from './SitemapUrl.ts';
import { toListUrls } from './toListUrls.ts';

const query = (page: number) => ({ page, limit: 250 });

/**
 * The list pages a sitemap lists: the 1,000 most popular official lists, then the 500 most popular and 500 trending
 * community lists. Public reads, so no token goes with them. Null when any page fails.
 */
export async function fetchListUrls({ fetch }: { fetch: typeof globalThis.fetch }): Promise<SitemapUrl[] | null> {
  const { lists } = api({ fetch });
  const sources = await Promise.all([
    fetchAllPages({
      maxPages: 4,
      fetchPage: (page) => lists.popularByType({ params: { type: 'official' }, query: query(page) }),
    }),
    fetchAllPages({
      maxPages: 2,
      fetchPage: (page) => lists.popularByType({ params: { type: 'personal' }, query: query(page) }),
    }),
    fetchAllPages({
      maxPages: 2,
      fetchPage: (page) => lists.trendingByType({ params: { type: 'personal' }, query: query(page) }),
    }),
  ]);
  if (!sources.every((pages) => pages !== null)) return null;

  return toListUrls(sources.flat(2).map(({ list }) => list));
}
