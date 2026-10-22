import { error, type RequestHandler } from '@sveltejs/kit';
import { LOGO_PATH } from '../../../../lib/utils/logoPath.ts';

const MEDIA = 'https://media.trakt.tv/images';
const YEAR = 60 * 60 * 24 * 365;

/** The two methods used from Cloudflare's `Cache`. */
interface ResponseCache {
  match(key: string): Promise<Response | undefined>;
  put(key: string, response: Response): Promise<void>;
}

/**
 * A show or movie logo from media.trakt.tv, served from og's own origin so the page can read its pixels and trim its
 * transparent edges (`trimLogo`): media.trakt.tv sends no CORS header, so a canvas can't read its images. Only logo
 * paths pass. A logo never changes at its path, so browsers and the data center's cache keep it a year.
 */
export const GET: RequestHandler = async ({ params, url, platform, fetch }) => {
  const path = params.path ?? '';
  if (!LOGO_PATH.test(path)) error(404);

  // The adapter types the cache with the Worker's own Response, which TypeScript can't match to the DOM's; at runtime
  // they're one class.
  const cache = platform?.caches?.default as unknown as ResponseCache | undefined;
  const hit = await cache?.match(url.href).catch(() => undefined);
  if (hit) return hit;

  // media.trakt.tv turns away a request without a user agent.
  const upstream = await fetch(`${MEDIA}/${path}`, { headers: { 'User-Agent': 'og.trakt.tv' } });
  if (!upstream.ok) error(upstream.status === 404 ? 404 : 502);

  const response = new Response(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/webp',
      'cache-control': `public, max-age=${YEAR}, immutable`,
    },
  });
  await cache?.put(url.href, response.clone()).catch(() => undefined);
  return response;
};
