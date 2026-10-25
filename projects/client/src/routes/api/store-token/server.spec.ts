import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { AUTH_COOKIE } from '../../../lib/auth/authCookie.ts';
import { POST } from './+server.ts';

function post(body: string) {
  const cookies = { set: vi.fn(), delete: vi.fn() };
  const request = new Request('http://localhost/api/store-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const response = POST({ request, cookies } as unknown as RequestEvent);
  return { cookies, response };
}

describe('POST /api/store-token', () => {
  it('should set a year-long httpOnly cookie holding the token and its expiry', async () => {
    const expiresAt = Date.now() + 60_000;
    const { cookies, response } = post(JSON.stringify({ token: 'abc', expiresAt, extra: 'dropped' }));

    expect((await response).status).toBe(204);
    expect(cookies.set).toHaveBeenCalledWith(AUTH_COOKIE, JSON.stringify({ token: 'abc', expiresAt }), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
  });

  it.each([
    ['a logout', JSON.stringify({ token: null, expiresAt: null })],
    ['an expired token', JSON.stringify({ token: 'abc', expiresAt: Date.now() - 1 })],
    ['a token of the wrong type', JSON.stringify({ token: 42, expiresAt: Date.now() + 60_000 })],
    ['a body that is not JSON', 'nope'],
    ['an empty token', JSON.stringify({ token: '', expiresAt: Date.now() + 60_000 })],
    ['a token without an expiry', JSON.stringify({ token: 'abc' })],
    ['an expiry of the wrong type', JSON.stringify({ token: 'abc', expiresAt: String(Date.now() + 60_000) })],
    ['a JSON null', 'null'],
    ['a JSON array', JSON.stringify([{ token: 'abc', expiresAt: Date.now() + 60_000 }])],
  ])('should clear the cookie for %s', async (_, body) => {
    const { cookies, response } = post(body);

    expect((await response).status).toBe(204);
    expect(await (await response).text()).toBe('');
    expect(cookies.set).not.toHaveBeenCalled();
    expect(cookies.delete).toHaveBeenCalledWith(AUTH_COOKIE, { path: '/' });
  });
});
