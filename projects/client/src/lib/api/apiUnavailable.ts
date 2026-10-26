import { error } from '@sveltejs/kit';

/**
 * Throws for a section whose route this client ID may not call (an Official-only route's 403). The `unavailable` flag
 * survives SvelteKit's streaming to the browser, where `isApiUnavailable` reads it for `LoadFailed`.
 */
export function apiUnavailable(): never {
  error(403, { message: 'Not available with this API key', unavailable: true });
}
