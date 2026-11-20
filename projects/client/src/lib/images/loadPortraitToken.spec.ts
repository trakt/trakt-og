import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadPortraitToken } from './loadPortraitToken.ts';

const TOKEN = 'https://apiz.trakt.tv/portraits/token';
const requests: URL[] = [];
const server = setupServer(
  http.get(TOKEN, () => HttpResponse.json({ token: '1794787200-mac', expires_at: '2026-11-30T00:00:00.000Z' })),
);
server.events.on('request:start', ({ request }) => void requests.push(new URL(request.url)));
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  requests.length = 0;
});
afterAll(() => server.close());

const director = { isDirector: true };
// MSW swaps in its fetch when the server starts listening.
const read = (user: { isDirector: boolean } | null) => loadPortraitToken({ fetch: globalThis.fetch, user });

describe('loadPortraitToken', () => {
  it("should read the week's token for a director", async () => {
    expect(await read(director)).toBe('1794787200-mac');
  });

  it('should not ask for a viewer who sees no portraits', async () => {
    expect(await read(null)).toBeNull();
    expect(await read({ isDirector: false })).toBeNull();
    expect(requests).toEqual([]);
  });

  it.each([
    ['a refusal', () => new HttpResponse('Forbidden', { status: 403 })],
    ['an answer without a token', () => HttpResponse.json({ expires_at: '2026-11-30T00:00:00.000Z' })],
    ['a network failure', () => HttpResponse.error()],
  ])('should give no token on %s', async (_, answer) => {
    server.use(http.get(TOKEN, answer));

    expect(await read(director)).toBeNull();
  });
});
