import { fetchTitleUrls } from '../../../lib/sitemap/fetchTitleUrls.ts';
import { serveSitemap } from '../../../lib/sitemap/serveSitemap.ts';
import { edgeCache } from '../../../lib/utils/edgeCache.ts';

export const GET = ({ fetch, url }) =>
  serveSitemap({
    url,
    cache: edgeCache(),
    name: 'movies',
    load: () => fetchTitleUrls({ fetch, type: 'movies' }),
  });
