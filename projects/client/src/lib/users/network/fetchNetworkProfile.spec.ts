import { describe, expect, it } from 'vitest';
import { fetchNetworkProfile } from './fetchNetworkProfile.ts';

const profile = {
  username: 'neilcb',
  private: false,
  name: 'Neil',
  vip: true,
  vip_og: true,
  vip_years: 17,
  vip_cover_image: 'https://media.trakt.tv/images/shows/000/001/693/fanarts/full/0c025fb6d2.jpg',
  ids: { slug: 'neilcb' },
};

const answer = (status: number, body?: unknown) => () =>
  Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }));

describe('fetchNetworkProfile', () => {
  it('should ask for the full VIP profile by slug', async () => {
    const paths: string[] = [];
    await fetchNetworkProfile({
      get: (path) => {
        paths.push(path);
        return answer(200, profile)();
      },
      slug: 'neil cb',
    });

    expect(paths).toEqual(['/users/neil%20cb?extended=full,vip']);
  });

  it('should map the cover and the full VIP label', async () => {
    const user = await fetchNetworkProfile({ get: answer(200, profile), slug: 'neilcb' });

    expect(user?.coverUrl).toContain('0c025fb6d2');
    expect(user?.vip).toEqual({ kind: 'vip', tag: { text: 'OG', title: 'Original VIP Member' }, years: 17 });
  });

  it('should be null when the profile does not answer', async () => {
    expect(await fetchNetworkProfile({ get: answer(401), slug: 'neilcb' })).toBeNull();
  });

  it('should be null for a body that is not a profile', async () => {
    expect(await fetchNetworkProfile({ get: answer(200, { nope: true }), slug: 'neilcb' })).toBeNull();
  });
});
