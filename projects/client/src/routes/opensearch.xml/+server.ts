import { buildOpenSearch, OPEN_SEARCH_TYPE } from '../../lib/search/buildOpenSearch.ts';

export const GET = ({ url }) =>
  new Response(buildOpenSearch(url.origin), {
    headers: { 'content-type': `${OPEN_SEARCH_TYPE}; charset=utf-8`, 'cache-control': 'public, max-age=86400' },
  });
