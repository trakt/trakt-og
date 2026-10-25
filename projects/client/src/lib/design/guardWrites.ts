const READS = new Set(['GET', 'HEAD', 'OPTIONS']);

type GuardWritesParams = {
  fetch: typeof fetch;
  /** The site's own origin: its routes stay live, so signing in still works. */
  origin: string;
  /** Called for each write that was kept from leaving. */
  onblock: (method: string, url: string) => void;
};

/**
 * Wraps fetch so a write that leaves this site (a POST, PUT, PATCH or DELETE to the API) is answered with an empty 204
 * here instead of sent. Reads go through. The design demos run on it, so nothing they do changes real data.
 */
export function guardWrites({ fetch, origin, onblock }: GuardWritesParams): typeof fetch {
  return (input, init) => {
    const request = new Request(input instanceof URL ? input.href : input, init);
    const url = new URL(request.url, origin);
    if (READS.has(request.method) || url.origin === origin) return fetch(input, init);

    onblock(request.method, url.href);
    return Promise.resolve(new Response(null, { status: 204 }));
  };
}
