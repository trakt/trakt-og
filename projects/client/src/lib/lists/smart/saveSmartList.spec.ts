import { describe, expect, it, vi } from 'vitest';
import { saveSmartList } from './saveSmartList.ts';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status });

const write = {
  name: ' HBO Dramas ',
  privacy: 'public' as const,
  source: 'trending' as const,
  mediaType: 'shows' as const,
  filters: { networks: ['HBO'] },
};

describe('util: saveSmartList', () => {
  it("should make a new list and give back the API's slug", async () => {
    const request = vi.fn(async () => json(201, { ids: { trakt: 7, slug: 'hbo-dramas-1a2b' } }));
    await expect(saveSmartList({ request, write })).resolves.toEqual({ ok: true, id: 7, slug: 'hbo-dramas-1a2b' });
    expect(request).toHaveBeenCalledWith('/users/me/smart-lists', 'POST', {
      name: 'HBO Dramas',
      privacy: 'public',
      source: 'trending',
      media_type: 'shows',
      filters: { networks: ['HBO'] },
    });
  });

  it('should send only the changes to an existing list', async () => {
    const request = vi.fn(async () => json(200, { ids: { trakt: 7, slug: 'hbo-dramas-1a2b' } }));
    await saveSmartList({ request, slug: 'hbo-dramas-1a2b', write: { filters: {} } });
    expect(request).toHaveBeenCalledWith('/users/me/smart-lists/hbo-dramas-1a2b', 'PUT', { filters: {} });
  });

  it("should count the API's empty 204 to an update as saved", async () => {
    const request = async () => json(204);
    await expect(saveSmartList({ request, slug: 'hbo-dramas-1a2b', write: { name: 'HBO' } })).resolves.toEqual({
      ok: true,
      slug: 'hbo-dramas-1a2b',
    });
  });

  it('should say when the account is at its limit', async () => {
    const request = async () => json(420);
    await expect(saveSmartList({ request, write })).resolves.toEqual({ ok: false, reason: 'limit' });
  });

  it.each([
    ['an error', async () => json(500)],
    ['a body without a slug', async () => json(201, {})],
    ['a network failure', async () => Promise.reject(new Error('offline'))],
  ])('should fail on %s', async (_, request) => {
    await expect(saveSmartList({ request, write })).resolves.toEqual({ ok: false, reason: 'failed' });
  });
});
