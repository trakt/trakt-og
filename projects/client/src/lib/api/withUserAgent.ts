const USER_AGENT = 'og.trakt.tv';

/**
 * `request`, naming og as its User-Agent when it has none of its own. Node's fetch sends `User-Agent: node`, which
 * Cloudflare refuses on some API routes (the calendars), and a Worker's fetch sends none.
 */
export function withUserAgent(request: Request): Request {
  if (request.headers.has('user-agent')) return request;

  const headers = new Headers(request.headers);
  headers.set('user-agent', USER_AGENT);
  return new Request(request, { headers });
}

/** `baseFetch`, naming og as its User-Agent: for server fetches that bypass SvelteKit's `handleFetch`. */
export const fetchWithUserAgent =
  (baseFetch: typeof fetch = globalThis.fetch): typeof fetch =>
  (input, init) =>
    baseFetch(withUserAgent(new Request(input, init)));
