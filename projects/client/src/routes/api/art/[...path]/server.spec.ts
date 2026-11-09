import { describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

const manifests: Record<string, object> = {
  'https://media.trakt.tv/shows/2/images.json': { fanart: {}, poster: {} },
  'https://media.trakt.tv/seasons/9/images.json': {},
};

const fakeFetch = (async (input: RequestInfo | URL) => {
  const manifest = manifests[String(input)];
  return manifest ? Response.json(manifest) : new Response(null, { status: 404 });
}) as typeof fetch;

const get = (path: string) =>
  GET({ params: { path }, url: new URL(`https://og.trakt.tv/api/art/${path}`), fetch: fakeFetch } as never);

describe('route: /api/art', () => {
  it('should redirect to the first art that exists', async () => {
    const response = await get('season/9/poster/show/2/fanart');

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://media.trakt.tv/shows/2/medium/fanart.webp');
  });

  it("should redirect to OG's placeholder when none exists", async () => {
    const response = await get('season/9/poster');

    expect(response.headers.get('location')).toMatch(/^https:\/\/og\.trakt\.tv\/.*poster.*\.png$/);
  });

  it('should refuse a path that names no art', async () => {
    await expect(get('user/2/avatar')).rejects.toMatchObject({ status: 404 });
  });
});
