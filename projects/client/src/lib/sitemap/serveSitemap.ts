import { z } from 'zod/v4';
import { SITE_ORIGIN } from '../seo/siteOrigin.ts';
import { type KeyedCache, sharedCache } from '../utils/sharedCache.ts';
import { buildUrlSet } from './buildUrlSet.ts';
import { sitemapResponse } from './sitemapResponse.ts';
import type { SitemapUrl } from './SitemapUrl.ts';

const DAY_SECONDS = 24 * 60 * 60;

const urlsSchema = z.array(z.object({ path: z.string(), lastmod: z.string().optional() }));

type ServeSitemapParams = {
  /** The request's URL: its origin names the cache key, and its host decides `noindex`. */
  url: URL;
  /** The data center's cache, `platform.caches.default`. Without one each request reads the API. */
  cache: KeyedCache | undefined;
  /** The file's name, which keys its cache entry: `movies` for `/sitemap/movies.xml`. */
  name: string;
  /** The file's pages, or null when the API failed to send all of them. */
  load: () => Promise<SitemapUrl[] | null>;
};

class SitemapUnavailable extends Error {}

/**
 * One sitemap file from the API. Each data center keeps its pages for a day, so crawlers don't each cost a dozen API
 * reads. A failed read is never kept: it answers 503 and the next request tries again.
 */
export async function serveSitemap({ url, cache, name, load }: ServeSitemapParams): Promise<Response> {
  const urls = await sharedCache({
    cache,
    key: `${url.origin}/_cache/sitemap/${name}`,
    ttlSeconds: DAY_SECONDS,
    parse: (value) => urlsSchema.safeParse(value).data ?? null,
    load: async () => {
      const loaded = await load();
      if (!loaded) throw new SitemapUnavailable(name);
      return loaded;
    },
  }).catch(() => null);

  return sitemapResponse({ xml: urls && buildUrlSet({ origin: SITE_ORIGIN, urls }), host: url.host });
}
