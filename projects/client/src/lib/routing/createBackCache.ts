const READS = new Set(['GET', 'HEAD', 'OPTIONS']);
const DATA_SUFFIX = '/__data.json';

type CreateBackCacheParams = {
  fetch: typeof fetch;
  /** The site's own origin, where SvelteKit serves `__data.json`. */
  origin: string;
  /** Whether a Back or Forward to this page is loading right now. */
  isBack: (page: URL) => boolean;
  now?: () => number;
  /** How long a page's data can come back on Back. */
  ttlMs?: number;
  /** How many pages it keeps, the oldest dropped first. */
  limit?: number;
};

type Entry = { body: string; type: string; at: number };

function methodOf(input: RequestInfo | URL, init: RequestInit | undefined): string {
  return (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
}

function urlOf(input: RequestInfo | URL, origin: string): URL {
  return new URL(input instanceof Request ? input.url : input, origin);
}

/** The page a `__data.json` request loads, without SvelteKit's own `x-sveltekit-*` parameters. */
export function pageOf(data: URL): URL {
  const page = new URL(data);
  page.pathname = data.pathname.slice(0, -DATA_SUFFIX.length) || '/';
  [...page.searchParams.keys()]
    .filter((key) => key.startsWith('x-sveltekit-'))
    .forEach((key) => page.searchParams.delete(key));
  return page;
}

function parseLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/** A finished data response with nothing failed in it: no redirect, no error node and no rejected streamed section. */
export function isWholeData(body: string): boolean {
  const [head, ...chunks] = body.split('\n').filter(Boolean).map(parseLine);
  if (head?.type !== 'data' || !Array.isArray(head.nodes)) return false;
  if (head.nodes.some((node) => node?.type === 'error')) return false;
  return chunks.every((chunk) => chunk?.type === 'chunk' && !('error' in chunk));
}

/**
 * Wraps fetch so Back shows a page the tab loaded a moment ago without asking the server again. SvelteKit reruns a
 * page's server loads on Back: it fetches `__data.json` with `window.fetch`. Every data response is kept for `ttlMs`,
 * and a Back or Forward to the same page with the same `x-sveltekit-invalidated` nodes gets it from memory. Any other
 * navigation, `invalidate` or preload still asks the server and refreshes what's kept.
 *
 * Any write empties it, so Back never shows personal data from before one: every request that isn't a read (a watch,
 * rating, list change, follow, settings save, sign in or out) clears it when sent and again when done, and a response
 * that was loading while a write ran isn't kept.
 */
export function createBackCache({
  fetch,
  origin,
  isBack,
  now = Date.now,
  ttlMs = 3 * 60_000,
  limit = 10,
}: CreateBackCacheParams) {
  const entries = new Map<string, Entry>();
  let epoch = 0;
  let writing = 0;

  const clear = () => {
    entries.clear();
    epoch += 1;
  };

  const keep = async (key: string, response: Response, since: number) => {
    const body = await response.text().catch(() => '');
    if (since !== epoch || writing > 0 || !isWholeData(body)) return;

    entries.delete(key);
    entries.set(key, { body, type: response.headers.get('content-type') ?? '', at: now() });
    const oldest = entries.size > limit ? entries.keys().next().value : undefined;
    if (oldest !== undefined) entries.delete(oldest);
  };

  const fresh = (key: string): Entry | undefined => {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (now() - entry.at < ttlMs) return entry;
    entries.delete(key);
    return undefined;
  };

  const write: typeof fetch = async (input, init) => {
    writing += 1;
    clear();
    try {
      return await fetch(input, init);
    } finally {
      writing -= 1;
      clear();
    }
  };

  const load = async (key: string, input: RequestInfo | URL, init: RequestInit | undefined) => {
    const since = epoch;
    const response = await fetch(input, init);
    if (response.ok) void keep(key, response.clone(), since);
    return response;
  };

  const cached: typeof fetch = (input, init) => {
    const method = methodOf(input, init);
    if (!READS.has(method)) return write(input, init);

    const url = urlOf(input, origin);
    const data = method === 'GET' && url.origin === origin && url.pathname.endsWith(DATA_SUFFIX);
    if (!data) return fetch(input, init);

    const hit = isBack(pageOf(url)) ? fresh(url.href) : undefined;
    if (hit) return Promise.resolve(new Response(hit.body, { headers: { 'content-type': hit.type } }));
    return load(url.href, input, init);
  };

  return { fetch: cached, clear };
}
