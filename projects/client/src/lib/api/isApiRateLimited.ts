import { isHttpError } from '@sveltejs/kit';

/**
 * Whether `value` is the error `apiRateLimited` threw, or that error's body as a streamed promise rejects with it in
 * the browser.
 */
export function isApiRateLimited(value: unknown): boolean {
  if (isHttpError(value)) return value.body.rateLimited === true;

  return typeof value === 'object' && value !== null && 'rateLimited' in value && value.rateLimited === true;
}
