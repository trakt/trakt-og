import { browser, dev } from '$app/environment';
import { type ApiEnvironment, apiEnvironment } from './apiEnvironment.ts';
import { officialOnlyPath } from './officialOnlyPath.ts';
import { rateLimitPause } from './rateLimitPause.ts';

type ApiAccessFetchParams = {
  fetch: typeof globalThis.fetch;
  environment: ApiEnvironment;
};

const STANDARD_HINT =
  'apiz.trakt.tv refused this client ID. A Standard Trakt app needs PUBLIC_TRAKT_API=standard in ' +
  'projects/client/.env.development.';

const rateLimited = (seconds: number) =>
  new Response('Too Many Requests', { status: 429, headers: { 'retry-after': String(seconds) } });

const refused = () =>
  new Response('Forbidden', { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });

const pathnameOf = (input: RequestInfo | URL) => new URL(input instanceof Request ? input.url : input).pathname;

let hinted = false;

function hintStandard() {
  if (hinted) return;
  hinted = true;
  console.warn(STANDARD_HINT);
}

/**
 * `fetch`, aware of what the client ID may call. On `standard`, an Official-only route gets the API's 403 here,
 * without a request, so it doesn't spend the lower rate limit, and after a 429 the browser answers 429 itself until
 * `Retry-After` runs out (`rateLimitPause`). In dev, apiz refusing a public route logs once that the app looks Standard.
 */
export function apiAccessFetch({ fetch, environment }: ApiAccessFetchParams): typeof globalThis.fetch {
  const standard = environment === apiEnvironment('standard');
  const production = environment === apiEnvironment('production');

  return async (input, init) => {
    const officialOnly = officialOnlyPath(pathnameOf(input));
    if (standard && officialOnly) return refused();
    // The server holds its reads in handleFetch, which turns them into the rate-limit error.
    const pausing = standard && browser;
    const left = rateLimitPause.remaining();
    if (pausing && left > 0) return rateLimited(left);

    const response = await fetch(input, init);
    if (pausing && response.status === 429) rateLimitPause.start(response.headers.get('retry-after'));
    // Specs fake 403s on purpose, so the hint is for a real dev server only.
    const hinting = dev && import.meta.env.MODE !== 'test';
    if (hinting && production && response.status === 403 && !officialOnly) hintStandard();
    return response;
  };
}
