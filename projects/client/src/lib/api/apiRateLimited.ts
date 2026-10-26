import { error } from '@sveltejs/kit';

const MINUTE = 60;

/** "in 5 minutes" from a `Retry-After` in seconds, or "in a minute" without a usable one. */
function wait(retryAfter: string | null) {
  const minutes = Math.ceil(Number(retryAfter) / MINUTE);
  return Number.isFinite(minutes) && minutes > 1 ? `in ${minutes} minutes` : 'in a minute';
}

/**
 * Throws for an API read the API refused with a 429. The `rateLimited` flag survives SvelteKit's streaming to the
 * browser, where `isApiRateLimited` reads it for `LoadFailed` and the error page.
 */
export function apiRateLimited(retryAfter: string | null): never {
  error(429, {
    message: `Trakt's API is rate limiting your requests. Try again ${wait(retryAfter)}.`,
    rateLimited: true,
  });
}
