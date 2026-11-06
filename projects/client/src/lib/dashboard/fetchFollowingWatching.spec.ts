import { describe, expect, it } from 'vitest';
import { fetchFollowingWatching } from './fetchFollowingWatching.ts';

const ada = {
  username: 'ada',
  name: 'Ada Lovelace',
  private: false,
  ids: { slug: 'ada', trakt: 1 },
  images: { avatar: { full: 'ada.png' } },
};
const bo = { username: 'bo', name: '', ids: { slug: 'bo', trakt: 2 }, images: { avatar: { full: 'bo.png' } } };

// The worker's answer, newest first, trimmed to what the cards read.
const rows = [
  {
    user: ada,
    expires_at: '2026-10-06T00:05:58.000Z',
    started_at: '2026-10-05T23:26:20.000Z',
    action: 'scrobble',
    type: 'episode',
    episode: { season: 2, number: 5, title: 'Tilting at Windmills', ids: { trakt: 12235135 } },
    show: { title: 'Tulsa King', year: 2022, ids: { trakt: 191758, slug: 'tulsa-king' } },
  },
  {
    user: bo,
    expires_at: '2026-10-06T01:00:00.000Z',
    started_at: '2026-10-05T23:00:00.000Z',
    action: 'checkin',
    type: 'movie',
    movie: { title: 'Weapons', year: 2025, ids: { trakt: 867094, slug: 'weapons-2025' } },
  },
  { user: bo, started_at: '2026-10-05T23:00:00.000Z', type: 'movie' },
  { expires_at: '2026-10-06T01:00:00.000Z', started_at: '2026-10-05T23:00:00.000Z', action: 'scrobble' },
];

describe('fetchFollowingWatching', () => {
  it('should ask once and map each row to its member, skipping the rows it cannot show', async () => {
    const asked: string[] = [];
    const get = (path: string) => {
      asked.push(path);
      return Promise.resolve(Response.json(rows));
    };

    const watching = await fetchFollowingWatching({ get });

    expect(asked).toEqual(['/v3/users/me/following/watching?extended=full,images']);
    expect(watching).toMatchObject([
      {
        member: { key: 'ada', name: 'Ada Lovelace', slug: 'ada', href: '/users/ada', avatar: 'ada.png' },
        kind: 'watch',
        label: 'Tulsa King 2x05',
        startedAt: '2026-10-05T23:26:20.000Z',
        expiresAt: '2026-10-06T00:05:58.000Z',
      },
      {
        member: { key: 'bo', name: 'bo', slug: 'bo', href: '/users/bo', avatar: 'bo.png' },
        kind: 'checkin',
        label: 'Weapons',
      },
    ]);
    expect(watching).toHaveLength(2);
  });

  it('should answer nobody when nobody is watching', async () => {
    expect(await fetchFollowingWatching({ get: () => Promise.resolve(Response.json([])) })).toEqual([]);
  });

  it('should reject a failed or malformed answer, so a poll keeps what it had', async () => {
    const failed = () => Promise.resolve(new Response(null, { status: 403 }));
    await expect(fetchFollowingWatching({ get: failed })).rejects.toThrow('403');

    const malformed = () => Promise.resolve(Response.json({ nope: true }));
    await expect(fetchFollowingWatching({ get: malformed })).rejects.toThrow('invalid');
  });
});
