import { error, type RequestHandler } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';

const KLIPY_API = 'https://api.klipy.com/api/v1';
// The picker's calls, and nothing else the key could reach.
const PATHS = { GET: /^gifs\/(trending|search|categories)$/, POST: /^gifs\/share\/[\w-]+$/ };

/**
 * The GIF picker's Klipy calls, with the API key added here so it stays out of the repo and the page. The key is the
 * Worker's `KLIPY_API_KEY` secret; without it, there's no picker and this answers 404. The picker is for signed-in
 * members, so a request without the auth cookie (expired still counts: the browser renews it) answers 401.
 */
const forward: RequestHandler = async ({ params, url, request, fetch, locals }) => {
  if (!locals.token && !locals.tokenExpired) error(401);
  const key = env.KLIPY_API_KEY;
  const method = request.method === 'POST' ? 'POST' : 'GET';
  if (!key || !PATHS[method].test(params.path ?? '')) error(404);

  const response = await fetch(`${KLIPY_API}/${key}/${params.path}${url.search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? await request.text() : undefined,
  });
  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
  });
};

export const GET = forward;
export const POST = forward;
