import { api } from '../lib/api/api.ts';
import { toHeaderUser } from '../lib/components/header/toHeaderUser.ts';
import { isPhoneUserAgent } from '../lib/components/mobile-splash/isPhoneUserAgent.ts';
import { toMobilePlatform } from '../lib/components/mobile-splash/toMobilePlatform.ts';
import { toDarkKnight } from '../lib/settings/toDarkKnight.ts';
import { toDatePreferences } from '../lib/settings/toDatePreferences.ts';
import { toTheme } from '../lib/settings/toTheme.ts';
import type { ViewerSettings } from '../lib/settings/ViewerSettings.ts';

/**
 * Pages inherit settings and datePreferences from this layout; server loaders can read them through parent().
 * The header uses the same response. Any failure renders logged-out; only the client renews the token.
 * It also sets `locals.theme`, the viewer's Dark Knight setting, which hooks.server.ts writes onto `<html>` so the
 * first paint is already in the right theme. Logged out stays light, as OG did.
 * `platform` picks the store the mobile splash links, and `phone` keeps its phone wording in a browser's device mode.
 */
export async function load({ fetch, locals, cookies, request }) {
  const hasSession = locals.token !== null;
  // The header search's type picker.
  const searchType = cookies.get('search_type') ?? '';
  const userAgent = request.headers.get('user-agent');
  const platform = toMobilePlatform(userAgent);
  const phone = isPhoneUserAgent(userAgent);
  const loggedOut = {
    hasSession,
    user: null,
    settings: null,
    datePreferences: toDatePreferences(null),
    searchType,
    platform,
    phone,
  };
  if (!hasSession) return loggedOut;

  try {
    const response = await api({ fetch, token: locals.token }).users.settings({
      // @trakt/api 0.6.0 only types browsing, but API also supports sharing.
      query: { extended: 'browsing,sharing' as 'browsing' },
    });
    if (response.status !== 200) return loggedOut;

    const settings: ViewerSettings = response.body;
    const data = {
      hasSession,
      user: toHeaderUser(settings.user),
      settings,
      datePreferences: toDatePreferences(settings),
      searchType,
      platform,
      phone,
    };
    locals.theme = toTheme(toDarkKnight(settings));
    return data;
  } catch {
    return loggedOut;
  }
}
