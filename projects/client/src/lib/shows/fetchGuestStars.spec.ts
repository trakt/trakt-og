import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fetchGuestStars } from './fetchGuestStars.ts';

const star = (name: string, trakt: number, episodes: number) => ({
  person: { name, ids: { trakt, slug: name.toLowerCase().replace(/ /g, '-') }, gender: 'female' },
  characters: ['Nurse'],
  episode_count: episodes,
});
const seen: Request[] = [];
const server = setupServer(
  http.get('https://apiz.trakt.tv/shows/1416/people', ({ request }) => {
    seen.push(request);
    return HttpResponse.json({ cast: [], guest_stars: [star('Aniela Gumbs', 2139114, 62)] });
  }),
);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  seen.length = 0;
});
afterAll(() => server.close());

describe('fetchGuestStars', () => {
  it('should read the guest stars publicly and map them like the show page', async () => {
    expect(await fetchGuestStars({ show: 1416, actorSpoilers: true })).toEqual([
      { name: 'Aniela Gumbs', slug: 'aniela-gumbs', id: 2139114, characters: 'Nurse', gender: 'female', episodes: 62 },
    ]);
    expect(new URL(seen[0]?.url ?? '').searchParams.get('extended')).toBe('guest_stars');
    expect(seen[0]?.headers.has('authorization')).toBe(false);
  });

  it('should hide episode counts for a viewer who hides actor spoilers', async () => {
    expect((await fetchGuestStars({ show: 1416, actorSpoilers: false }))?.at(0)?.episodes).toBe(0);
  });

  it('should come back empty when the read fails or the body is malformed', async () => {
    server.use(http.get('https://apiz.trakt.tv/shows/1416/people', () => new HttpResponse(null, { status: 500 })));
    expect(await fetchGuestStars({ show: 1416, actorSpoilers: true })).toBeNull();

    server.use(http.get('https://apiz.trakt.tv/shows/1416/people', () => HttpResponse.json({ cast: 'nope' })));
    expect(await fetchGuestStars({ show: 1416, actorSpoilers: true })).toBeNull();
  });
});
