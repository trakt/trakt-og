import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { api } from '#lib/api/api.ts';
import { apiEnvironment } from '#lib/api/apiEnvironment.ts';
import { keptSettingsFetch } from '#lib/settings/keptSettingsFetch.ts';
import { SETTINGS_REVISION_COOKIE } from '#lib/settings/settingsRevisionCookie.ts';
import { edgeCache } from '#lib/utils/edgeCache.ts';
import { liveConfig } from './liveConfig.ts';

type SocketEvent = Pick<RequestEvent, 'request' | 'fetch' | 'url'> & { cookies: Pick<Cookies, 'get'> };

interface LiveSocketParams {
  event: SocketEvent;
  token: string | null;
}

async function mayWatch({ event, token }: { event: SocketEvent; token: string }) {
  const fetch = keptSettingsFetch({
    fetch: event.fetch,
    cache: edgeCache(),
    origin: event.url.origin,
    token,
    revision: event.cookies.get(SETTINGS_REVISION_COOKIE) ?? '',
    fresh: false,
  });
  // The same read as the root layout's, so the page that just loaded left it in the data center's cache.
  const response = await api({ fetch, token })
    .users.settings({ query: { extended: 'browsing,sharing' as 'browsing' } })
    .catch(() => null);
  return response?.status === 200 && !!response.body.user.director;
}

/**
 * The live page's socket: a signed-in director's (while it's tried out) goes on to the `WatchingNowLive` refresher,
 * with og's API settings on its headers. A socket opened from another site gets 403 whatever its cookies, so widening
 * the gate or the sign-in cookie's SameSite can't let other sites ride a visitor's session. A guest gets 401, anyone
 * else 403, and a server that can't reach the
 * refresher 503, so the page keeps its snapshot. `vite dev` has the binding but can't run the class, so its calls
 * fail into that 503.
 */
export async function liveSocket({ event, token }: LiveSocketParams): Promise<Response> {
  if (event.request.headers.get('upgrade') !== 'websocket') return new Response(null, { status: 426 });
  if (event.request.headers.get('origin') !== event.url.origin) return new Response(null, { status: 403 });
  if (!token) return new Response(null, { status: 401 });
  const world = env.WATCHING_NOW_LIVE;
  if (!world) return new Response(null, { status: 503 });
  if (!(await mayWatch({ event, token }))) return new Response(null, { status: 403 });

  const headers = new Headers(event.request.headers);
  liveConfig.write(headers, { apiKey: TRAKT_CLIENT_ID, environment: apiEnvironment() });
  return world
    .get(world.idFromName('world'))
    .fetch(new Request(event.request, { headers }))
    .catch(() => new Response(null, { status: 503 }));
}
