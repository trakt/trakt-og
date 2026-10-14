import { describe, expect, it } from 'vitest';
import { fetchGifs } from './fetchGifs.ts';

const source = (format: string, width: number) => ({ url: `https://static.klipy.com/a.${format}`, width, height: 100 });
const klipyGif = {
  id: 7,
  slug: 'happy-dance',
  title: 'Happy dance',
  type: 'gif',
  file: {
    md: { gif: source('gif', 400), webp: source('webp', 400) },
    sm: { gif: source('gif', 200), jpg: source('jpg', 200) },
  },
};

function klipy(body: unknown, status = 200) {
  const urls: string[] = [];
  const fetch = (input: RequestInfo | URL) => {
    urls.push(String(input));
    return Promise.resolve(Response.json(body, { status }));
  };
  return { urls, fetch: fetch as typeof globalThis.fetch };
}

const page = (data: unknown[], hasNext = true) => ({ data: { data, has_next: hasNext } });

describe('fetchGifs', () => {
  it("should ask for what's trending without a query, through og's proxy", async () => {
    const { urls, fetch } = klipy(page([]));
    await fetchGifs({ query: '', page: 1, limit: 24, customerId: 'device', fetch });
    expect(urls).toEqual(['/api/klipy/gifs/trending?customer_id=device&page=1&per_page=24']);
  });

  it('should search with a query', async () => {
    const { urls, fetch } = klipy(page([]));
    await fetchGifs({ query: 'happy dance', page: 2, limit: 24, customerId: 'device', fetch });
    expect(urls).toEqual(['/api/klipy/gifs/search?customer_id=device&page=2&per_page=24&q=happy+dance']);
  });

  it('should map GIFs, preferring webp, and skip sponsored and malformed items', async () => {
    const { fetch } = klipy(page([klipyGif, { type: 'ad', id: 8 }, { type: 'gif' }], false));
    expect(await fetchGifs({ query: '', page: 1, limit: 24, customerId: 'device', fetch })).toEqual({
      entries: [{
        id: '7',
        slug: 'happy-dance',
        title: 'Happy dance',
        preview: source('gif', 200),
        full: source('webp', 400),
        still: source('jpg', 200),
      }],
      hasNext: false,
    });
  });

  it("should reject when Klipy can't be reached, and read an off-contract page as empty", async () => {
    await expect(fetchGifs({ query: '', page: 1, limit: 24, customerId: 'd', fetch: klipy({}, 404).fetch }))
      .rejects.toThrow();
    expect(await fetchGifs({ query: '', page: 1, limit: 24, customerId: 'd', fetch: klipy({ nope: 1 }).fetch }))
      .toEqual({ entries: [], hasNext: false });
  });
});
