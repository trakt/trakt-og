import { describe, expect, it, vi } from 'vitest';
import { createBackCache, isWholeData, pageOf } from './createBackCache.ts';

const ORIGIN = 'https://og.example';
const DATA = `${ORIGIN}/discover/__data.json?x-sveltekit-invalidated=01`;
const API = 'https://apiz.example/sync/history';
const BODY = '{"type":"data","nodes":[{"type":"skip"},{"type":"data","data":[{}],"uses":{}}]}\n';

const flush = () => new Promise((resolve) => setTimeout(resolve));

function setup({ back = true } = {}) {
  let time = 0;
  let served = 0;
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    served += 1;
    const url = String(input instanceof Request ? input.url : input);
    if (url.startsWith(API)) return new Response(null, { status: init?.method === 'POST' ? 201 : 200 });
    return new Response(BODY.replace('[{}]', `[{"n":${served}}]`), {
      headers: { 'content-type': 'text/sveltekit-data' },
    });
  });
  const state = { back };
  const cache = createBackCache({
    fetch,
    origin: ORIGIN,
    isBack: () => state.back,
    now: () => time,
    ttlMs: 100,
    limit: 2,
  });
  const tick = (ms: number) => {
    time += ms;
  };
  const load = async (url = DATA) => {
    const body = await (await cache.fetch(url)).text();
    await flush();
    return body;
  };
  return { fetch, cache, state, tick, load };
}

describe('util: createBackCache', () => {
  it('should answer a Back from memory with the body the server sent', async () => {
    const { fetch, load } = setup();
    const first = await load();
    const back = await load();

    expect(back).toBe(first);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('should keep the content type SvelteKit reads the stream by', async () => {
    const { cache, load } = setup();
    await load();
    const back = await cache.fetch(DATA);

    expect(back.headers.get('content-type')).toBe('text/sveltekit-data');
  });

  it('should ask the server when the navigation is not a Back', async () => {
    const { fetch, state, load } = setup();
    await load();
    state.back = false;
    await load();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should ask the server once the kept data is older than its time to live', async () => {
    const { fetch, tick, load } = setup();
    await load();
    tick(100);
    await load();

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should keep each set of invalidated nodes apart', async () => {
    const { fetch, load } = setup();
    await load();
    await load(DATA.replace('=01', '=11'));

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should drop the oldest page past its limit', async () => {
    const { fetch, load } = setup();
    await load(`${ORIGIN}/a/__data.json`);
    await load(`${ORIGIN}/b/__data.json`);
    await load(`${ORIGIN}/c/__data.json`);
    await load(`${ORIGIN}/a/__data.json`);

    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it('should leave requests other than page data alone', async () => {
    const { fetch, cache } = setup();
    await cache.fetch(API);
    await cache.fetch(API);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  describe('after a write', () => {
    it('should ask the server again', async () => {
      const { fetch, cache, load } = setup();
      await load();
      await cache.fetch(API, { method: 'POST', body: '{}' });
      await load();

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should catch a write sent as a Request', async () => {
      const { fetch, cache, load } = setup();
      await load();
      await cache.fetch(new Request(API, { method: 'DELETE' }));
      await load();

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should not keep data that loaded while the write ran', async () => {
      const { fetch, cache, load } = setup();
      const write = cache.fetch(API, { method: 'POST', body: '{}' });
      await load();
      await write;
      await load();

      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  it('should ask the server after it is cleared', async () => {
    const { fetch, cache, load } = setup();
    await load();
    cache.clear();
    await load();

    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('util: isWholeData', () => {
  it('should accept page data and its streamed sections', () => {
    expect(isWholeData(`${BODY}{"type":"chunk","id":1,"data":[1]}\n`)).toBe(true);
  });

  it('should refuse a redirect', () => {
    expect(isWholeData('{"type":"redirect","location":"/signin"}\n')).toBe(false);
  });

  it('should refuse a node that failed', () => {
    expect(isWholeData('{"type":"data","nodes":[{"type":"error","error":{}}]}\n')).toBe(false);
  });

  it('should refuse a streamed section that failed', () => {
    expect(isWholeData(`${BODY}{"type":"chunk","id":1,"error":[{}]}\n`)).toBe(false);
  });

  it('should refuse a body cut short', () => {
    expect(isWholeData('{"type":"data","nodes":[')).toBe(false);
  });
});

describe('util: pageOf', () => {
  it("should name the page without SvelteKit's parameters", () => {
    const page = pageOf(new URL(`${ORIGIN}/users/sean/__data.json?tab=shows&x-sveltekit-invalidated=011`));
    expect(page.pathname).toBe('/users/sean');
    expect(page.searchParams.toString()).toBe('tab=shows');
  });

  it('should name the home page', () => {
    expect(pageOf(new URL(`${ORIGIN}/__data.json`)).pathname).toBe('/');
  });
});
