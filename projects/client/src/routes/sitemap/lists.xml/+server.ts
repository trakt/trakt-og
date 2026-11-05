import { fetchListUrls } from '../../../lib/sitemap/fetchListUrls.ts';
import { serveSitemap } from '../../../lib/sitemap/serveSitemap.ts';
import { edgeCache } from '../../../lib/utils/edgeCache.ts';

export const GET = ({ fetch, url }) =>
  serveSitemap({
    url,
    cache: edgeCache(),
    name: 'lists',
    load: () => fetchListUrls({ fetch }),
  });
