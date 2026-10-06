import { describe, expect, it } from 'vitest';
import { fetchWatching } from './fetchWatching.ts';
import type { SocialMember } from './toSocialItem.ts';

const member = (slug?: string): SocialMember => ({
  key: slug ?? 'gone',
  name: slug ?? 'Deleted',
  slug,
  href: slug && `/users/${slug}`,
  avatar: 'avatar.png',
});

// The worker's answer for an episode, trimmed to what the panel reads.
const episode = {
  expires_at: '2026-10-06T00:05:58.000Z',
  started_at: '2026-10-05T23:26:20.000Z',
  action: 'scrobble',
  type: 'episode',
  episode: {
    season: 2,
    number: 5,
    title: 'Tilting at Windmills',
    ids: { trakt: 12235135 },
    images: { screenshot: ['shot.jpg'] },
  },
  show: {
    title: 'Tulsa King',
    year: 2022,
    ids: { trakt: 191758, slug: 'tulsa-king' },
    images: { fanart: ['fan.jpg'] },
  },
};
const movie = {
  expires_at: '2026-10-06T01:00:00.000Z',
  started_at: '2026-10-05T23:00:00.000Z',
  action: 'checkin',
  type: 'movie',
  movie: { title: 'Weapons', year: 2025, ids: { trakt: 867094, slug: 'weapons-2025' } },
};

const answers: Record<string, () => Response> = {
  '/users/ada/watching?extended=full,images': () => Response.json(episode),
  '/users/bo/watching?extended=full,images': () => Response.json(movie),
  '/users/cy/watching?extended=full,images': () => new Response(null, { status: 204 }),
  '/users/di/watching?extended=full,images': () => Response.json({ nope: true }),
  '/users/ed/watching?extended=full,images': () => {
    throw new Error('offline');
  },
};

describe('fetchWatching', () => {
  it('should map each member who is watching, and skip the rest', async () => {
    const asked: string[] = [];
    const get = (path: string) => {
      asked.push(path);
      const answer = answers[path];
      return answer ? Promise.resolve().then(answer) : Promise.resolve(new Response(null, { status: 404 }));
    };

    const watching = await fetchWatching({ get, members: ['ada', 'bo', 'cy', 'di', 'ed', undefined].map(member) });

    expect(asked).toHaveLength(5);
    expect(watching).toEqual([
      {
        member: member('ada'),
        kind: 'watch',
        label: 'Tulsa King 2x05',
        title: { key: 'show:tulsa-king', name: 'Tulsa King', href: '/shows/tulsa-king' },
        episode: { season: 2, number: 5 },
        code: '2x05',
        href: '/shows/tulsa-king/seasons/2/episodes/5',
        still: 'shot.jpg',
        startedAt: '2026-10-05T23:26:20.000Z',
        expiresAt: '2026-10-06T00:05:58.000Z',
      },
      {
        member: member('bo'),
        kind: 'checkin',
        label: 'Weapons',
        title: { key: 'movie:weapons-2025', name: 'Weapons', href: '/movies/weapons-2025' },
        href: '/movies/weapons-2025',
        still: undefined,
        startedAt: '2026-10-05T23:00:00.000Z',
        expiresAt: '2026-10-06T01:00:00.000Z',
      },
    ]);
  });
});
