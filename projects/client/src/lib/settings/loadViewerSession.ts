import type { Cookies } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { toHeaderUser } from '../components/header/toHeaderUser.ts';
import { isPhoneUserAgent } from '../components/mobile-splash/isPhoneUserAgent.ts';
import { toMobilePlatform } from '../components/mobile-splash/toMobilePlatform.ts';
import { toDarkKnight } from './toDarkKnight.ts';
import { toDatePreferences } from './toDatePreferences.ts';
import { toTheme } from './toTheme.ts';
import type { ViewerSettings } from './ViewerSettings.ts';

type Params = {
  fetch: typeof fetch;
  locals: App.Locals;
  cookies: Pick<Cookies, 'get'>;
  request: Request;
  platform?: App.Platform;
};

/**
 * Pages inherit settings and datePreferences from this layout; server loaders can read them through parent().
 * The header uses the same response. Any failure renders logged-out; only the client renews the token.
 * An expired token still counts as a session: `tokenExpired` keeps the header signed in until the browser renews it.
 * It also sets `locals.theme`, the viewer's Dark Knight setting, which hooks.server.ts writes onto `<html>` so the
 * first paint is already in the right theme. Logged out is Dark Knight, og's default.
 * `platform` picks the store the mobile splash links, and `phone` keeps its phone wording in a browser's device mode.
 * `gifs` says the Worker has a Klipy key, so comment composers get the GIF picker.
 */
export async function loadViewerSession({ fetch, locals, cookies, request, platform: worker }: Params) {
  const { token, tokenExpired } = locals;
  const hasSession = token !== null || tokenExpired;
  // The header search's type picker.
  const searchType = cookies.get('search_type') ?? '';
  const userAgent = request.headers.get('user-agent');
  const platform = toMobilePlatform(userAgent);
  const phone = isPhoneUserAgent(userAgent);
  const loggedOut = {
    hasSession,
    tokenExpired,
    user: null,
    settings: null,
    datePreferences: toDatePreferences(null),
    searchType,
    platform,
    phone,
  };
  if (token === null) return loggedOut;

  try {
    const response = await api({ fetch, token }).users.settings({
      // @trakt/api 0.6.0 only types browsing, but API also supports sharing.
      query: { extended: 'browsing,sharing' as 'browsing' },
    });
    if (response.status !== 200) return loggedOut;

    const settings: ViewerSettings = response.body;
    const data = {
      hasSession,
      tokenExpired,
      user: toHeaderUser(settings.user),
      settings,
      datePreferences: toDatePreferences(settings),
      searchType,
      platform,
      phone,
      gifs: Boolean(worker?.env.KLIPY_API_KEY),
    };
    locals.theme = toTheme(toDarkKnight(settings));
    return data;
  } catch {
    return loggedOut;
  }
}
