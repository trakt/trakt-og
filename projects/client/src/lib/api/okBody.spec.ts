import { describe, expect, it } from 'vitest';
import { okBody } from './okBody.ts';

describe('api: okBody', () => {
  it('should return the body of a 200', async () => {
    expect(await okBody(Promise.resolve({ status: 200 as const, body: { id: 1 } }))).toEqual({ id: 1 });
  });

  it('should return null for any other status', async () => {
    expect(await okBody(Promise.resolve({ status: 404 as const, body: undefined }))).toBeNull();
  });

  it('should return null when the request fails', async () => {
    expect(await okBody(Promise.reject(new Error('offline')))).toBeNull();
  });
});
