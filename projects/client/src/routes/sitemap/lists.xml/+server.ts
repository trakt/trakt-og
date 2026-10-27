import { fetchListUrls } from '../../../lib/sitemap/fetchListUrls.ts';
import { serveSitemap } from '../../../lib/sitemap/serveSitemap.ts';
import type { KeyedCache } from '../../../lib/utils/sharedCache.ts';

export const GET = ({ fetch, url, platform }) =>
  serveSitemap({
    url,
    cache: platform?.caches?.default as unknown as KeyedCache | undefined,
    name: 'lists',
    load: () => fetchListUrls({ fetch }),
  });
