import { isRedirect } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

const redirectFor = (token: string | null, start?: string) => {
  try {
    GET({ locals: { token }, params: { start }, url: new URL('https://og.test/calendars/shows') } as never);
  } catch (thrown) {
    if (isRedirect(thrown)) return { status: thrown.status, location: thrown.location };
    throw thrown;
  }
  return null;
};

describe('route: /calendars/shows', () => {
  it('should open My Shows for the same week signed in', () => {
    expect(redirectFor('fake-token', '2026-11-09')?.location).toBe('/calendars/my/shows/2026-11-09');
  });

  it('should open All Premieres signed out', () => {
    expect(redirectFor(null)?.location).toBe('/calendars/premieres');
  });

  it("should redirect temporarily, since the target depends on who's signed in", () => {
    expect(redirectFor(null)?.status).toBe(302);
    expect(redirectFor('fake-token')?.status).toBe(302);
  });
});
