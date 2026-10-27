import { describe, expect, it } from 'vitest';
import { resolveCacheControl } from './resolveCacheControl.ts';

const VERIFIED = { verified: true, bot: true };
const PREVIEW = { verified: false, bot: true };
const PERSON = { verified: false, bot: false };

const resolve = (overrides: Partial<Parameters<typeof resolveCacheControl>[0]>) =>
  resolveCacheControl({
    pathname: '/movies/tron-1982',
    isRedirect: false,
    hasSession: false,
    crawler: PERSON,
    pageCacheControl: null,
    ...overrides,
  });

describe('util: resolveCacheControl', () => {
  it('should never store a page rendered for a session', () => {
    expect(resolve({ hasSession: true })).toBe('no-store');
    expect(resolve({ hasSession: true, crawler: VERIFIED })).toBe('no-store');
    expect(resolve({ hasSession: true, crawler: PREVIEW })).toBe('no-store');
    expect(resolve({ hasSession: true, pageCacheControl: 'public, max-age=60' })).toBe('no-store');
  });

  it('should never store a redirect', () => {
    expect(resolve({ isRedirect: true })).toBe('no-store');
    expect(resolve({ isRedirect: true, crawler: VERIFIED })).toBe('no-store');
  });

  it('should never store /, which depends on the session', () => {
    expect(resolve({ pathname: '/' })).toBe('no-store');
    expect(resolve({ pathname: '/', crawler: VERIFIED })).toBe('no-store');
    expect(resolve({ pathname: '/', crawler: PREVIEW })).toBe('no-store');
  });

  it('should let a verified crawler keep a signed-out page for an hour, out of shared caches', () => {
    expect(resolve({ crawler: VERIFIED })).toBe('private, max-age=3600');
  });

  it('should let a link-preview bot keep a signed-out page for two minutes', () => {
    expect(resolve({ crawler: PREVIEW })).toBe('private, max-age=120');
  });

  it('should not store a page for anyone else', () => {
    expect(resolve({})).toBe('no-store');
  });

  it("should keep a signed-out page's own header", () => {
    expect(resolve({ pageCacheControl: 'public, max-age=60' })).toBe('public, max-age=60');
    expect(resolve({ pageCacheControl: 'public, max-age=60', crawler: VERIFIED })).toBe('public, max-age=60');
  });
});
