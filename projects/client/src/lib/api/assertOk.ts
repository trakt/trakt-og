import { error } from '@sveltejs/kit';

/** A loader's guard on a required read: 404 for a missing item, 502 for any other non-200. */
export function assertOk<T extends { status: number }>(
  response: T,
  name: string,
): asserts response is T & { status: 200 } {
  if (response.status === 404) error(404, `${name} not found`);
  if (response.status !== 200) error(502, `The Trakt API could not load this ${name.toLowerCase()}.`);
}
