import { isStandardApi } from '../../api/isStandardApi.ts';
import { rawApiFetch } from '../../api/rawApiFetch.ts';
import { type KeyedCache, sharedCache } from '../../utils/sharedCache.ts';
import { sha256 } from '../../utils/sha256.ts';
import { toUserMatch } from './toUserMatch.ts';
import type { UserMatch } from './UserMatch.ts';
import { userMatchSchema } from './userMatchSchema.ts';

// The API lets the browser keep a match this long, and works it out again from the database each time it's asked.
const MATCH_TTL_SECONDS = 30 * 60;

type FetchUserMatchParams = {
  fetch: typeof globalThis.fetch;
  /** The viewer's access token. Only its hash reaches the cache key. */
  token: string;
  /** The profile owner's slug. */
  slug: string;
  /** The data center's cache, `edgeCache()`. Left out (tests, a dev server without one), it always reads. */
  cache: KeyedCache | undefined;
  /** og's origin, which the kept copies' keys live under. */
  origin: string;
};

/**
 * The viewer's taste match with a profile owner, kept in the data center's cache for 30 minutes per viewer and owner,
 * so moving around a profile, or coming back to it, doesn't ask again. Null for a Standard app (the route is for
 * Trakt's own apps), a private profile the viewer can't see, a failed read, or nothing to compare.
 */
export async function fetchUserMatch({
  fetch,
  token,
  slug,
  cache,
  origin,
}: FetchUserMatchParams): Promise<UserMatch | null> {
  if (isStandardApi()) return null;

  try {
    const body = await sharedCache({
      cache,
      key: `${origin}/_cache/match/${await sha256(`${token}:${slug}`)}`,
      ttlSeconds: MATCH_TTL_SECONDS,
      parse: (value) => userMatchSchema.safeParse(value).data ?? null,
      load: async () => {
        const response = await rawApiFetch({ fetch, token, path: `/v3/users/${encodeURIComponent(slug)}/match` });
        if (response.status !== 200) throw new Error(`Match read failed: ${response.status}`);
        return userMatchSchema.parse(await response.json());
      },
    });
    return toUserMatch(body);
  } catch {
    return null;
  }
}
