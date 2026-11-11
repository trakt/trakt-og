import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
import type { loadHomeLive } from '#lib/home/live/loadHomeLive.ts';
import { describe, expect, it } from 'vitest';
import { loadLive } from './loadLive.ts';

const live = { shows: 10, movies: 5, countries: [] };
const homeLive: typeof loadHomeLive = () => ({ trending: Promise.resolve(null), live: Promise.resolve(live) });
const member = (isDirector: boolean) => ({ isVip: true, isDirector }) as HeaderUser;
const params = (token: string | null, user: HeaderUser | null) => ({
  fetch,
  liveFetch: fetch,
  url: new URL('https://og.trakt.tv/live'),
  locals: { token, tokenExpired: false },
  now: 0,
  parent: async () => ({ user }),
  homeLive,
});

describe('loadLive', () => {
  it('should send a guest to sign in and back', async () => {
    await expect(loadLive(params(null, null))).rejects.toMatchObject({
      status: 302,
      location: expect.stringContaining('live'),
    });
  });

  it("should stream the home page's snapshot to a director, who gets it live", async () => {
    const data = await loadLive(params('token', member(true)));

    expect(data.vip).toBe(true);
    expect(await data.live).toEqual(live);
  });

  it("should 404 for a member who isn't a director, while it's tried out", async () => {
    await expect(loadLive(params('token', member(false)))).rejects.toMatchObject({ status: 404 });
  });
});
