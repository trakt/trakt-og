import { error } from '@sveltejs/kit';
import { signInRedirect } from '#lib/auth/signInRedirect.ts';
import type { HeaderUser } from '#lib/components/header/HeaderUser.ts';
import { loadHomeLive } from '#lib/home/live/loadHomeLive.ts';
import { canSeeLive } from '#lib/live/canSeeLive.ts';
import type { KeyedCache } from '#lib/utils/sharedCache.ts';

interface LoadLiveParams {
  fetch: typeof globalThis.fetch;
  liveFetch: typeof globalThis.fetch;
  url: URL;
  locals: Pick<App.Locals, 'token' | 'tokenExpired'>;
  now: number;
  parent: () => Promise<{ user: HeaderUser | null }>;
  cache?: KeyedCache;
  /** The home page's snapshot; specs pass their own. */
  homeLive?: typeof loadHomeLive;
}

/**
 * `/live`, for VIPs and directors: guests go to sign in, and members without VIP get a 404. It opens on the home
 * page's snapshot of who is watching, streamed in, and the socket keeps it live. The still map with a way to VIP is for
 * when it opens to every member.
 */
export async function loadLive({
  fetch,
  liveFetch,
  url,
  locals,
  now,
  parent,
  cache,
  homeLive = loadHomeLive,
}: LoadLiveParams) {
  if (locals.token === null && !locals.tokenExpired) signInRedirect(url);

  const { live } = homeLive({ fetch, liveFetch, now, cache, origin: url.origin });
  const { user } = await parent();
  if (!canSeeLive(user)) error(404, 'Not found');
  return { vip: user.isVip || user.isDirector, live };
}
