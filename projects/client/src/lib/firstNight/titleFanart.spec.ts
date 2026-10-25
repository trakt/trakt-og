import { describe, expect, it, vi } from 'vitest';
import { titleFanart } from './titleFanart.ts';

const respond = (body: unknown) => vi.fn<typeof globalThis.fetch>(() => Promise.resolve(Response.json(body)));

describe('titleFanart', () => {
  it('should read the first fanart at full size', async () => {
    const body = { images: { fanart: ['media.trakt.tv/images/shows/1388/fanarts/medium/a.jpg.webp'] } };
    expect(await titleFanart('shows', 'breaking-bad', respond(body))).toBe(
      'https://media.trakt.tv/images/shows/1388/fanarts/full/a.jpg.webp',
    );
  });

  it('should have no art for a malformed body', async () => {
    expect(await titleFanart('movies', 'malformed', respond({ images: { fanart: 'not-a-list' } }))).toBeUndefined();
  });
});
