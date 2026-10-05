import { toProfileUser } from '../users/toProfileUser.ts';

/** Fake local-OG values for the reusable frame component demo. */
export const dashboardFrameFixture = {
  user: toProfileUser({
    username: 'og_tester',
    name: 'OG Tester',
    private: false,
    vip: true,
    vip_years: 7,
    ids: { slug: 'og_tester' },
  }),
  stats: {
    episodes: { minutes: 3000, watched: 50, plays: 50, collected: 0, ratings: 0, comments: 0 },
    shows: { watched: 5, collected: 2, ratings: 0, comments: 0 },
    movies: { minutes: 1971, watched: 7, plays: 13, collected: 6, ratings: 0, comments: 0 },
  },
  collected: { episodes: 10, shows: 2, movies: 6 },
  requests: ([
    ['toby-gerlach', 'Toby Gerlach', 'Sep 29, 2026 3:00 PM', '2026-09-29T22:00:00Z', '6 days ago'],
    ['lena-fischer', 'Lena Fischer', 'Sep 14, 2026 7:03 PM', '2026-09-15T02:03:00Z', '20 days ago'],
    ['reelnerd', 'reelnerd', 'Aug 21, 2026 9:12 AM', '2026-08-21T16:12:00Z', 'a month ago'],
    ['tomas-ortega', 'Tomás Ortega', 'Jul 10, 2026 4:36 PM', '2026-07-10T23:36:00Z', '3 months ago'],
    ['kdub', 'kdub', 'Jul 10, 2026 6:13 AM', '2026-07-10T13:13:00Z', '3 months ago'],
    ['priya-natarajan', 'Priya Natarajan', 'Jul 8, 2026 9:47 PM', '2026-07-09T04:47:00Z', '3 months ago'],
  ] as const).map(([slug, name, requestedAt, requestedIso, requestedAgo], i) => ({
    id: i + 1,
    slug,
    name,
    avatarUrl: 'https://media.trakt.tv/hotlink-ok/placeholders/medium/zoidberg.png',
    requestedAt,
    requestedIso,
    requestedAgo,
  })),
};
