import { api } from '../api/api.ts';
import { loadDroppedShows } from '../users/progress/loadDroppedShows.ts';
import { fetchWatchedLists } from '../users/profile/fetchWatchedLists.ts';
import { computeUserStats } from './computeUserStats.ts';
import type { StatsCounts } from './StatsCounts.ts';
import type { UserStats } from './userStatsSchema.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  token: string | null;
  id: string;
  /** Your own: progress counts, from your shows' episodes and dropped shows. */
  isSelf: boolean;
  /** `fetchStatsCounts`, when the caller already started it. */
  counts: Promise<StatsCounts>;
  /** The whole watched lists, when the caller already reads them, with the shows' episodes for your own. */
  watched?: ReturnType<typeof fetchWatchedLists>;
};

async function readDropped(fetch: typeof globalThis.fetch, token: string | null) {
  const client = api({ fetch, token });
  const shows = await loadDroppedShows({
    request: (page, limit) =>
      client.users.hidden
        .dropped({ query: { page, limit, extended: 'full' } })
        .then((response) =>
          response.status === 200
            ? { ok: true as const, body: response.body, headers: response.headers }
            : { ok: false as const, status: response.status },
        ),
  });
  return new Set(shows.keys());
}

/** The stats og counts itself when the API keeps none for the account (`apiUserStats` came back null). */
export async function fetchComputedStats({ fetch, token, id, isSelf, counts, watched }: Params): Promise<UserStats> {
  const [resolvedCounts, lists, dropped] = await Promise.all([
    counts,
    watched ?? fetchWatchedLists({ fetch, token, id, progress: isSelf }),
    // Without them, no progress rather than no stats.
    isSelf ? readDropped(fetch, token).catch(() => null) : null,
  ]);
  return computeUserStats({ counts: resolvedCounts, watched: lists, dropped });
}
