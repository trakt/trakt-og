import { positiveInt } from '../utils/positiveInt.ts';
import { apiCachePolicy } from './apiCachePolicy.ts';
import type { ResponseCache } from './ResponseCache.ts';

type CachedApiReadParams = {
  /** A GET to the API. */
  request: Request;
  /** The data center's cache, `platform.caches.default`. */
  cache: ResponseCache;
  /** og's origin, which the cache's keys live under. */
  origin: string;
  /** The viewer has a session, even one whose token is being renewed. */
  signedIn: boolean;
  /** Sends the request to the API. */
  load: () => Promise<Response>;
  /** Keeps the Worker alive for the cache write after the response is handed back. Left out, the write is awaited. */
  waitUntil?: (promise: Promise<unknown>) => void;
};

// The cache sets these itself, or they describe the API's encoding of a body the cache stores decoded.
const UNKEPT_HEADERS = [
  'age',
  'cache-control',
  'content-encoding',
  'content-length',
  'expires',
  'pragma',
  'set-cookie',
  'vary',
];

/**
 * The key a read is kept under: the client ID, then the API's host, path and query, with the query's params sorted and
 * encoded one way. The host keeps the Standard API's answers apart from production's.
 */
function cacheKey(origin: string, url: URL): string {
  const query = new URLSearchParams(url.searchParams);
  query.sort();
  const search = query.size > 0 ? `?${query}` : '';
  return `${origin}/_cache/api/${encodeURIComponent(TRAKT_CLIENT_ID)}/${url.host}${url.pathname}${search}`;
}

/** The API's `max-age` for a response every viewer may share, or 0 when it is private, uncacheable or has none. */
function sharedMaxAge(cacheControl: string | null): number {
  const directives = (cacheControl ?? '')
    .toLowerCase()
    .split(',')
    .map((directive) => directive.trim());
  if (!directives.includes('public')) return 0;
  if (directives.some((directive) => ['private', 'no-store', 'no-cache'].includes(directive))) return 0;
  const maxAge = directives.find((directive) => directive.startsWith('max-age='));
  return positiveInt(maxAge?.slice('max-age='.length) ?? null, 0);
}

/** `response`'s status, body and headers, which loaders read the paging and sort from, kept for `seconds`. */
function keptCopy(response: Response, seconds: number): Response {
  const headers = new Headers(response.headers);
  for (const name of UNKEPT_HEADERS) headers.delete(name);
  headers.set('cache-control', `public, max-age=${seconds}`);
  return new Response(response.clone().body, { status: response.status, headers });
}

/**
 * An API read through the data center's cache, so a public read every viewer gets the same answer for leaves the API
 * once per data center for a while instead of once per visit. Only a GET without a token or cookie is kept, only on a
 * route `apiCachePolicy` lists, only a 200 the API marks `public`, and for the shorter of the policy's time and the
 * API's `max-age`. A cache that fails reads the API as if it missed. Cloudflare's cache only works on a custom domain.
 */
export async function cachedApiRead({
  request,
  cache,
  origin,
  signedIn,
  load,
  waitUntil,
}: CachedApiReadParams): Promise<Response> {
  if (request.method !== 'GET') return load();
  if (request.headers.has('authorization') || request.headers.has('cookie')) return load();
  const url = new URL(request.url);
  const policy = apiCachePolicy(url.pathname);
  if (!policy) return load();

  const key = cacheKey(origin, url);
  const served = !(policy.signedOutOnly && signedIn);
  const hit = served ? await cache.match(key).catch(() => undefined) : undefined;
  if (hit) return hit;

  const response = await load();
  const seconds = Math.min(policy.seconds, sharedMaxAge(response.headers.get('cache-control')));
  if (response.status !== 200 || seconds <= 0) return response;

  const write = cache.put(key, keptCopy(response, seconds)).catch(() => undefined);
  if (waitUntil) waitUntil(write);
  else await write;
  return response;
}
