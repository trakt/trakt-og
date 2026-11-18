import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { toProfileUser } from '../users/toProfileUser.ts';
import { toWatchingNow } from '../users/toWatchingNow.ts';
import { formatDate } from '../utils/formatDate.ts';
import { dashboardPrefs } from './dashboardPrefs.ts';
import { apiUserStats } from '../stats/apiUserStats.ts';
import { fetchStatsCounts } from '../stats/fetchStatsCounts.ts';
import { dashboardProfileSchema } from './dashboardProfileSchema.ts';
import { followRequestsSchema } from './followRequestsSchema.ts';
import { toDashboardSettings } from './toDashboardSettings.ts';
import { toFollowRequest } from './toFollowRequest.ts';
import { fetchFirstNight, isNewAccount } from '../firstNight/firstNight.ts';

type Params = {
  fetch: typeof fetch;
  /** The welcome wall streams, so it uses a fetch without SvelteKit's completed-load dependency tracker. */
  panelFetch?: typeof fetch;
  locals: { token: string | null };
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{ user: HeaderUser | null; settings: ViewerSettings | null; datePreferences: DatePreferences }>;
  now?: Date;
};

/**
 * The dashboard frame loads alongside layout settings: the profile, stats, what you're watching and follow requests.
 * It returns each panel's settings and whether it's hidden, in the viewer's dashboard settings (`/users/settings` and
 * the per-browser `og-dashboard` cookie), but no panel data: the browser reads each visible panel itself.
 */
export async function loadDashboard({ fetch, panelFetch = fetch, locals, cookies, parent, now = new Date() }: Params) {
  const { token } = locals;
  if (!token) redirect(302, '/');
  const client = api({ fetch, token });
  const [profile, stats, watching, requests, layout] = await Promise.all([
    client.users.profile({ params: { id: 'me' }, query: { extended: 'full,vip' } }),
    client.users.stats({ params: { id: 'me' } }),
    client.users.watching({ params: { id: 'me' }, query: { extended: 'full' } }),
    client.users.requests.follow({ query: { extended: 'full' } }),
    parent(),
  ]);
  // A stale cookie renders logged-out. The browser owns renewal; no isolate refreshes the token.
  if ([profile, stats, watching, requests].some(({ status }) => status === 401) || !layout.user) redirect(302, '/');
  if (profile.status !== 200 || requests.status !== 200 || ![200, 204].includes(watching.status))
    error(502, 'Trakt is having trouble loading your dashboard.');
  const parsedProfile = dashboardProfileSchema.safeParse(profile.body);
  const parsedRequests = followRequestsSchema.safeParse(requests.body);
  if (!parsedProfile.success || !parsedRequests.success) {
    error(502, 'Trakt returned an invalid dashboard response.');
  }
  const user = toProfileUser(parsedProfile.data);
  const prefs = dashboardPrefs.read(cookies.get(dashboardPrefs.COOKIE), user.slug);
  const dashboard = toDashboardSettings({ settings: layout.settings, prefs });
  const known = apiUserStats(stats);
  // Without the API's stats only the counts are read here, quick reads the welcome wall waits on. The browser counts
  // the rest from your whole watched lists, so the Worker never pages through them.
  const counts = known ? null : await fetchStatsCounts({ fetch, token, id: 'me' }).catch(() => null);
  const watched = known
    ? known.movies.watched + known.shows.watched
    : counts && counts.watched.movies + counts.watched.shows;
  const welcome = watched !== null && isNewAccount(watched) && !prefs.hide_first_night;
  return {
    profile: user,
    memberSince: formatDate(parsedProfile.data.joined_at, { ...layout.datePreferences, time: true }),
    /** The API's stats, when it keeps them for you. */
    stats: known,
    /** Without the API's stats, the counts the browser starts its own stats from. Null when they failed too. */
    countedStats: counts,
    /** Movies and shows watched, for the welcome wall. */
    watched: watched ?? 0,
    viewerWatching: watching.status === 200 ? toWatchingNow(watching.body) : null,
    requests: parsedRequests.data
      .toSorted((a, b) => Date.parse(b.requested_at) - Date.parse(a.requested_at))
      .map((row) => toFollowRequest(row, { datePreferences: layout.datePreferences, now })),
    dashboard,
    // A new member's welcome wall stands in for the greeting and the recaps until they close it.
    firstNight: welcome ? fetchFirstNight({ fetch: panelFetch, now }) : null,
  };
}
