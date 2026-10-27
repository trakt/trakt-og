import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { searchNetworks } from './searchNetworks.ts';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const endpoint = 'https://apiz.trakt.tv/smart-lists/filter-options/networks';

describe('searchNetworks', () => {
  it('should ask for the first 20 networks starting with the trimmed query', async () => {
    let asked: URLSearchParams | undefined;
    server.use(
      http.get(endpoint, ({ request }) => {
        asked = new URL(request.url).searchParams;
        return HttpResponse.json([{ name: 'A&E', country: 'us' }]);
      }),
    );

    expect(await searchNetworks(' a&e ')).toEqual([{ value: 'A&E', label: 'A&E', tag: 'US' }]);
    expect(Object.fromEntries(asked ?? [])).toEqual({ query: 'a&e', limit: '20' });
  });

  it('should list each name once, sorted, tagged with its country when it has one', async () => {
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json([
          { name: 'Netflix', country: null },
          { name: 'HBO', country: 'us' },
          { name: 'NETFLIX', country: '' },
          { name: 'hbo', country: 'gb' },
        ]),
      ),
    );

    expect(await searchNetworks('ne')).toEqual([
      { value: 'HBO', label: 'HBO', tag: 'US' },
      { value: 'Netflix', label: 'Netflix' },
    ]);
  });

  it('should not ask under two letters', async () => {
    expect(await searchNetworks('  h ')).toEqual([]);
  });

  it('should throw when the API fails', async () => {
    server.use(http.get(endpoint, () => new HttpResponse(null, { status: 500 })));
    await expect(searchNetworks('hbo')).rejects.toThrow('500');
  });
});
