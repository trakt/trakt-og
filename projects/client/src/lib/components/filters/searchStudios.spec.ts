import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { searchStudios } from './searchStudios.ts';
import { studioNames } from './studioNames.svelte.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const endpoint = 'https://apiz.trakt.tv/smart-lists/filter-options/studios';

describe('searchStudios', () => {
  it('should ask for the first 20 studios by the trimmed query, offer them by slug and keep their names', async () => {
    let asked: URLSearchParams | undefined;
    server.use(
      http.get(endpoint, ({ request }) => {
        asked = new URL(request.url).searchParams;
        return HttpResponse.json([{ slug: 'a24', name: 'A24' }]);
      }),
    );

    expect(await searchStudios(' a2 ')).toEqual([{ value: 'a24', label: 'A24' }]);
    expect(Object.fromEntries(asked ?? [])).toEqual({ query: 'a2', limit: '20' });
    expect(studioNames.name('a24')).toBe('A24');
  });

  it('should not ask before two letters', async () => {
    expect(await searchStudios(' a ')).toEqual([]);
  });

  it('should fail when the API does', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 })));
    await expect(searchStudios('a2')).rejects.toThrow('500');
  });
});
