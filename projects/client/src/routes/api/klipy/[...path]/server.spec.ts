import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { GET, POST } from './+server.ts';

type Call = { path: string; search?: string; key?: string; body?: string };

function call(method: 'GET' | 'POST', { path, search = '', key = 'secret', body }: Call) {
  const fetch = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(Response.json({ ok: true })));
  const request = new Request(`https://og.test/api/klipy/${path}${search}`, {
    method,
    body,
  });
  const event = {
    params: { path },
    url: new URL(request.url),
    request,
    platform: { env: { KLIPY_API_KEY: key } },
    fetch,
  } as unknown as RequestEvent;
  return { fetch, response: (method === 'POST' ? POST : GET)(event) as Promise<Response> };
}

describe('/api/klipy', () => {
  it("should forward the picker's reads with the key added", async () => {
    const { fetch, response } = call('GET', { path: 'gifs/search', search: '?q=wow&customer_id=d' });
    expect((await response).status).toBe(200);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.klipy.com/api/v1/secret/gifs/search?q=wow&customer_id=d');
  });

  it('should forward a share with its body', async () => {
    const body = JSON.stringify({ customer_id: 'd' });
    const { fetch, response } = call('POST', { path: 'gifs/share/happy-dance', body });
    await response;
    expect(fetch.mock.calls[0]?.[0]).toBe('https://api.klipy.com/api/v1/secret/gifs/share/happy-dance');
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body });
  });

  it.each([
    ['without a key', 'GET', { path: 'gifs/trending', key: '' }],
    ['for a path the picker never calls', 'GET', { path: 'stickers/trending' }],
    ['for a share by GET', 'GET', { path: 'gifs/share/happy-dance' }],
    ['for a read by POST', 'POST', { path: 'gifs/trending' }],
    ['for a path that climbs out', 'GET', { path: 'gifs/../ads' }],
  ])('should answer 404 %s', async (_, method, params) => {
    const { fetch, response } = call(method as 'GET' | 'POST', params);
    await expect(response).rejects.toMatchObject({ status: 404 });
    expect(fetch).not.toHaveBeenCalled();
  });
});
