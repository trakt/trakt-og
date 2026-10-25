import { describe, expect, it } from 'vitest';
import { readAuthCookie } from './readAuthCookie.ts';

const now = Date.UTC(2026, 9, 24);
const cookie = (value: unknown) => JSON.stringify(value);

describe('readAuthCookie', () => {
  it('should read no session without a cookie', () => {
    expect(readAuthCookie({ value: undefined, now })).toEqual({ token: null, tokenExpired: false });
    expect(readAuthCookie({ value: '', now })).toEqual({ token: null, tokenExpired: false });
  });

  it('should send a token that has not expired', () => {
    const value = cookie({ token: 'abc', expiresAt: now + 1 });
    expect(readAuthCookie({ value, now })).toEqual({ token: 'abc', tokenExpired: false });
  });

  it('should keep an expired token from the API but mark the session for renewal', () => {
    expect(readAuthCookie({ value: cookie({ token: 'abc', expiresAt: now }), now })).toEqual({
      token: null,
      tokenExpired: true,
    });
    expect(readAuthCookie({ value: cookie({ token: 'abc', expiresAt: now - 60_000 }), now })).toEqual({
      token: null,
      tokenExpired: true,
    });
  });

  it('should treat a cookie from before the expiry was stored as a live bare token', () => {
    expect(readAuthCookie({ value: 'bare-token', now })).toEqual({ token: 'bare-token', tokenExpired: false });
    expect(readAuthCookie({ value: '0123456789abcdef', now })).toEqual({
      token: '0123456789abcdef',
      tokenExpired: false,
    });
  });
});
