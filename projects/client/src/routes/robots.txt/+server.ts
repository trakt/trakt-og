import { buildRobotsTxt } from '../../lib/crawl/buildRobotsTxt.ts';
import { isProductionHost } from '../../lib/crawl/isProductionHost.ts';

export const GET = ({ url }) =>
  new Response(buildRobotsTxt({ production: isProductionHost(url) }), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' },
  });
