import { isHttpError } from '@sveltejs/kit';

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

/**
 * Whether `value` says the client ID may not call a section's route: an Official-only route's 403 response, the
 * error `apiUnavailable` threw, or that error's body as a streamed promise rejects with it in the browser.
 */
export function isApiUnavailable(value: unknown): boolean {
  if (isHttpError(value)) return value.body.unavailable === true;
  if (!isObject(value)) return false;

  return value.unavailable === true || value.status === 403;
}
