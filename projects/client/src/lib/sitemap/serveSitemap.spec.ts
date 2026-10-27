import { describe, expect, it, vi } from 'vitest';
import { sitemapSchemaErrors } from '../../test/sitemapSchemaErrors.ts';
import type { KeyedCache } from '../utils/sharedCache.ts';
import { serveSitemap } from './serveSitemap.ts';

const url = new URL('https://og.trakt.tv/sitemap/movies.xml');
const urls = [{ path: '/movies/tron-1982', lastmod: '2026-10-26T08:05:55Z' }];

function memoryCache() {
  const kept = new Map<string, string>();
  const cache = {
    match: (key: string) => Promise.resolve(kept.has(key) ? new Response(kept.get(key)) : undefined),
    put: async (key: string, response: Response) => void kept.set(key, await response.text()),
  };
  return { cache: cache satisfies KeyedCache, kept };
}

describe('serveSitemap', () => {
  it('should serve the pages as a valid sitemap and keep them for a day', async () => {
    const { cache, kept } = memoryCache();
    const load = vi.fn(() => Promise.resolve(urls));

    const response = await serveSitemap({ url, cache, name: 'movies', load });
    const again = await serveSitemap({ url, cache, name: 'movies', load });

    expect(response.status).toBe(200);
    expect(sitemapSchemaErrors(await response.text())).toEqual([]);
    expect(await again.text()).toContain('<lastmod>2026-10-26T08:05:55Z</lastmod>');
    expect(load).toHaveBeenCalledOnce();
    expect([...kept.keys()]).toEqual(['https://og.trakt.tv/_cache/sitemap/movies']);
  });

  it('should answer 503 and keep nothing when the API failed', async () => {
    const { cache, kept } = memoryCache();

    const response = await serveSitemap({ url, cache, name: 'movies', load: () => Promise.resolve(null) });

    expect(response.status).toBe(503);
    expect(kept.size).toBe(0);
  });

  it('should load each time without a cache', async () => {
    const load = vi.fn(() => Promise.resolve(urls));

    await serveSitemap({ url, cache: undefined, name: 'movies', load });
    await serveSitemap({ url, cache: undefined, name: 'movies', load });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
