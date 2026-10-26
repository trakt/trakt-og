import { error } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { apiRateLimited } from './apiRateLimited.ts';
import { isApiRateLimited } from './isApiRateLimited.ts';

const thrown = (run: () => unknown) => {
  try {
    run();
  } catch (cause) {
    return cause;
  }
  return null;
};

describe('isApiRateLimited', () => {
  it('should read apiRateLimited’s error', () => {
    expect(isApiRateLimited(thrown(() => apiRateLimited('60')))).toBe(true);
  });

  it('should read that error’s body, as a streamed promise rejects with it in the browser', () => {
    expect(isApiRateLimited({ message: 'Rate limited', rateLimited: true })).toBe(true);
  });

  it('should not read other failures', () => {
    expect(isApiRateLimited(thrown(() => error(429, 'Slow down')))).toBe(false);
    expect(isApiRateLimited(new Response(null, { status: 429 }))).toBe(false);
    expect(isApiRateLimited(new Error('offline'))).toBe(false);
    expect(isApiRateLimited(null)).toBe(false);
  });
});

describe('apiRateLimited', () => {
  const message = (retryAfter: string | null) => {
    const cause = thrown(() => apiRateLimited(retryAfter));
    return cause && typeof cause === 'object' && 'body' in cause ? cause.body : null;
  };

  it('should say how many minutes to wait', () => {
    expect(message('299')).toMatchObject({ message: expect.stringMatching(/Try again in 5 minutes\.$/) });
  });

  it('should say a minute for a short or missing Retry-After', () => {
    expect(message('30')).toMatchObject({ message: expect.stringMatching(/Try again in a minute\.$/) });
    expect(message(null)).toMatchObject({ message: expect.stringMatching(/Try again in a minute\.$/) });
  });
});
