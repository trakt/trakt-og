import type { UserStatsResponse } from '@trakt/api';
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
  /** A long-time member: rounded counts everywhere, and a full ratings spread. */
  stats: {
    movies: { plays: 3915, watched: 1787, minutes: 436_144, collected: 0, ratings: 120, comments: 40 },
    shows: { watched: 978, collected: 0, ratings: 60, comments: 38 },
    seasons: { ratings: 1, comments: 1 },
    episodes: { plays: 64_168, watched: 26_647, minutes: 1_966_068, collected: 0, ratings: 80, comments: 6 },
    network: { friends: 35, followers: 1004, following: 42 },
    ratings: { total: 261, distribution: { 1: 8, 2: 2, 3: 4, 4: 6, 5: 14, 6: 14, 7: 17, 8: 43, 9: 48, 10: 105 } },
    progress: { finished: 449, started: 528, dropped: 1 },
    lists: 12,
    total_minutes: 2_402_212,
    total_plays: 68_083,
  } satisfies UserStatsResponse,
  /** Signed up this week: an evening of TV, nothing rated, nobody following. */
  newStats: {
    movies: { plays: 0, watched: 0, minutes: 0, collected: 0, ratings: 0, comments: 0 },
    shows: { watched: 1, collected: 0, ratings: 0, comments: 0 },
    seasons: { ratings: 0, comments: 0 },
    episodes: { plays: 4, watched: 4, minutes: 200, collected: 0, ratings: 0, comments: 0 },
    network: { friends: 0, followers: 0, following: 0 },
    ratings: { total: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 } },
    progress: { finished: 0, started: 1, dropped: 0 },
    lists: 0,
    total_minutes: 200,
    total_plays: 4,
  } satisfies UserStatsResponse,
  collected: { episodes: 19_760, shows: 619, movies: 3196 },
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
