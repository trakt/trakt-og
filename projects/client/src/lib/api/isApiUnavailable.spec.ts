import { error } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { apiUnavailable } from './apiUnavailable.ts';
import { isApiUnavailable } from './isApiUnavailable.ts';

const thrown = (run: () => unknown) => {
  try {
    run();
  } catch (cause) {
    return cause;
  }
  return null;
};

describe('isApiUnavailable', () => {
  it('should read apiUnavailable’s error', () => {
    expect(isApiUnavailable(thrown(apiUnavailable))).toBe(true);
  });

  it('should read that error’s body, as a streamed promise rejects with it in the browser', () => {
    expect(isApiUnavailable({ message: 'Not available with this API key', unavailable: true })).toBe(true);
  });

  it('should read an Official-only route’s 403', () => {
    expect(isApiUnavailable(new Response('Forbidden', { status: 403 }))).toBe(true);
  });

  it('should not read other failures', () => {
    expect(isApiUnavailable(new Response(null, { status: 404 }))).toBe(false);
    expect(isApiUnavailable(thrown(() => error(403, 'Admins only')))).toBe(false);
    expect(isApiUnavailable(new Error('offline'))).toBe(false);
    expect(isApiUnavailable(null)).toBe(false);
  });
});
