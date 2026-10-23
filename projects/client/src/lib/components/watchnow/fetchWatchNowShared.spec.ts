import { describe, expect, it, vi } from 'vitest';
import { fetchWatchNowShared } from './fetchWatchNowShared.ts';
import { watchNowOrderSchema } from './watchNowSchema.ts';

const respond = (body: string, status = 200) => (() => Promise.resolve(new Response(body, { status }))) as typeof fetch;

describe('fetchWatchNowShared', () => {
  const readShared = (path: string, fetch: typeof globalThis.fetch) =>
    fetchWatchNowShared({ fetch, path, schema: watchNowOrderSchema });

  it('should request a path once for every reader', async () => {
    const fetch = vi.fn(respond('["us-netflix"]'));
    const results = await Promise.all([
      readShared('/watchnow/countries', fetch),
      readShared('/watchnow/countries', fetch),
    ]);
    await readShared('/watchnow/countries', fetch);

    expect(results).toEqual([['us-netflix'], ['us-netflix']]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should request again after a failed read', async () => {
    expect(await readShared('/watchnow/sources/us', respond('nope', 500))).toBeNull();
    const fetch = vi.fn(respond('["us-netflix"]'));

    expect(await readShared('/watchnow/sources/us', fetch)).toEqual(['us-netflix']);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
