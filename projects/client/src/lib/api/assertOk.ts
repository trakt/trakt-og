import { error } from '@sveltejs/kit';

// The API's own gateway timeout, and Cloudflare's when it can't reach or hear back from the API in time.
const TIMEOUTS: ReadonlySet<number> = new Set([504, 520, 521, 522, 523, 524]);

/**
 * A loader's guard on a required read: 404 for a missing item, 503 while the API is down for maintenance, 504 when it
 * times out, and 502 for any other non-200.
 */
export function assertOk<T extends { status: number }>(
  response: T,
  name: string,
): asserts response is T & { status: 200 } {
  if (response.status === 404) error(404, `${name} not found`);
  if (response.status === 503) error(503, `The Trakt API is down, so this ${name.toLowerCase()} could not load.`);
  if (TIMEOUTS.has(response.status)) error(504, `The Trakt API took too long to load this ${name.toLowerCase()}.`);
  if (response.status !== 200) error(502, `The Trakt API could not load this ${name.toLowerCase()}.`);
}
