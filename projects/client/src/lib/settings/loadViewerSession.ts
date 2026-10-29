import type { Cookies } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { isApiRateLimited } from '../api/isApiRateLimited.ts';
import { isAuthStepRoute } from '../auth/isAuthStepRoute.ts';
import { toHeaderUser } from '../components/header/toHeaderUser.ts';
import { isPhoneUserAgent } from '../components/mobile-splash/isPhoneUserAgent.ts';
import { toMobilePlatform } from '../components/mobile-splash/toMobilePlatform.ts';
import { keptSettingsFetch, type ResponseCache } from './keptSettingsFetch.ts';
import { localSettings } from './localSettings.ts';
import { SETTINGS_REVISION_COOKIE } from './settingsRevisionCookie.ts';
import { toDarkKnight } from './toDarkKnight.ts';
import { toDatePreferences } from './toDatePreferences.ts';
import { toTheme } from './toTheme.ts';
import type { ViewerSettings } from './ViewerSettings.ts';

type Params = {
  fetch: typeof fetch;
  locals: App.Locals;
  cookies: Pick<Cookies, 'get'>;
  request: Request;
  /** A client navigation or reload, which may use the kept settings. A full page load reads them fresh. */
  isDataRequest?: boolean;
  route: { id: string | null };
  platform?: App.Platform;
  untrack: <T>(fn: () => T) => T;
};

/**
 * Pages inherit settings and datePreferences from this layout; server loaders can read them through parent().
 * The header uses the same response. The sign-in and sign-out steps draw no header, so they skip it. Any failure
 * renders logged-out; only the client renews the token. A rate-limited read (`rateLimited`) keeps the session, so the
 * header stays signed in without a user instead of offering Sign In.
 * An expired token still counts as a session: `tokenExpired` keeps the header signed in until the browser renews it.
 * It also sets `locals.theme`, the viewer's Dark Knight setting, which hooks.server.ts writes onto `<html>` so the
 * first paint is already in the right theme. Logged out is Dark Knight, og's default.
 * `platform` picks the store the mobile splash links. `phone` keeps its phone wording in a browser's device mode, and
 * renders the page under it inert from the first paint.
 * `gifs` says the Worker has a Klipy key, so comment composers get the GIF picker.
 * It reads the route untracked, so a client navigation keeps this result and every child loader that calls `parent()`,
 * like the profile frame. Only an auth step tracks it, so leaving one loads the settings.
 * The server still reruns it for every child that calls `parent()`, so the settings are kept for a few minutes
 * (`keptSettingsFetch`). A save in og changes the revision cookie (`markSettingsChanged`), which starts a new copy.
 */
export async function loadViewerSession({
  fetch,
  locals,
  cookies,
  request,
  isDataRequest = false,
  route,
  platform: worker,
  untrack,
}: Params) {
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
    rateLimited: false,
    user: null,
    settings: null,
    datePreferences: toDatePreferences(null),
    searchType,
    platform,
    phone,
  };
  const authStep = untrack(() => isAuthStepRoute(route.id)) && isAuthStepRoute(route.id);
  if (token === null || authStep) return loggedOut;

  try {
    const settingsFetch = keptSettingsFetch({
      fetch,
      // The adapter types the cache with the Worker's own Response, which TypeScript can't match to the DOM's; at
      // runtime they're one class.
      cache: worker?.caches?.default as unknown as ResponseCache | undefined,
      origin: new URL(request.url).origin,
      token,
      revision: cookies.get(SETTINGS_REVISION_COOKIE) ?? '',
      fresh: !isDataRequest,
    });
    const response = await api({ fetch: settingsFetch, token }).users.settings({
      // @trakt/api 0.6.0 only types browsing, but API also supports sharing.
      query: { extended: 'browsing,sharing' as 'browsing' },
    });
    if (response.status !== 200) return loggedOut;

    // The settings a client ID the API won't let save kept in this browser instead (`localSettings`) count too.
    const settings: ViewerSettings = localSettings.apply(response.body, cookies.get(localSettings.COOKIE));
    const data = {
      hasSession,
      tokenExpired,
      rateLimited: false,
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
  } catch (cause) {
    return isApiRateLimited(cause) ? { ...loggedOut, rateLimited: true } : loggedOut;
  }
}
