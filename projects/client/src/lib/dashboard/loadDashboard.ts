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
import { fetchComputedStats } from '../stats/fetchComputedStats.ts';
import { fetchStatsCounts } from '../stats/fetchStatsCounts.ts';
import { dashboardProfileSchema } from './dashboardProfileSchema.ts';
import { fetchLastThirtyDays } from './fetchLastThirtyDays.ts';
import { fetchRecapRibbon } from './fetchRecapRibbon.ts';
import { fetchRecentlyWatched } from './fetchRecentlyWatched.ts';
import { fetchRecommendations } from './fetchRecommendations.ts';
import { fetchSchedule } from './fetchSchedule.ts';
import { isStandardApi } from '../api/isStandardApi.ts';
import { fetchSocialFeed } from './fetchSocialFeed.ts';
import { fetchUpNext } from './fetchUpNext.ts';
import { fetchWatchlist } from './fetchWatchlist.ts';
import { followRequestsSchema } from './followRequestsSchema.ts';
import { toDashboardSettings } from './toDashboardSettings.ts';
import { toFollowRequest } from './toFollowRequest.ts';
import { fetchFirstNight, isNewAccount } from '../firstNight/firstNight.ts';

type Params = {
  fetch: typeof fetch;
  /** Streamed panels use a fetch without SvelteKit's completed-load dependency tracker. */
  panelFetch?: typeof fetch;
  locals: { token: string | null };
  cookies: { get: (name: string) => string | undefined };
  parent: () => Promise<{ user: HeaderUser | null; settings: ViewerSettings | null; datePreferences: DatePreferences }>;
  now?: Date;
};

/**
 * Your stats when the API keeps none for you: the counts are quick reads, awaited for the welcome wall, and the rest
 * streams, since it reads your whole watched lists. Counts that fail leave the greeting without its panel.
 */
type OwnStatsParams = { fetch: typeof globalThis.fetch; panelFetch: typeof globalThis.fetch; token: string };

async function readOwnStats({ fetch, panelFetch, token }: OwnStatsParams) {
  const counts = await fetchStatsCounts({ fetch, token, id: 'me' }).catch(() => null);
  if (!counts) return { panel: null, watched: null };
  return {
    panel: fetchComputedStats({ fetch: panelFetch, token, id: 'me', isSelf: true, counts: Promise.resolve(counts) }),
    watched: counts.watched.movies + counts.watched.shows,
  };
}

// A hidden panel isn't fetched at all, and the page leaves it out.
const unless = <T>(hidden: boolean, load: () => Promise<T>) => (hidden ? null : load());

/**
 * The dashboard frame loads alongside layout settings; the panels stream and fail independently, in the viewer's
 * dashboard settings: `/users/settings` and the per-browser `og-dashboard` cookie.
 */
export async function loadDashboard({ fetch, panelFetch = fetch, locals, cookies, parent, now = new Date() }: Params) {
  const { token } = locals;
  if (!token) redirect(302, '/');
  const client = api({ fetch, token });
  const [profile, stats, watching, requests, layout] = await Promise.all([
    client.users.profile({ params: { id: 'me' }, query: { extended: 'full,vip' } }),
    client.users.stats({ params: { id: 'me' } }),
    client.users.watching({ params: { id: 'me' }, query: { extended: 'full,images' } }),
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
  const { hidden } = dashboard;
  const known = apiUserStats(stats);
  const { panel, watched } = known
    ? { panel: known, watched: known.movies.watched + known.shows.watched }
    : await readOwnStats({ fetch, panelFetch, token });
  const welcome = watched !== null && isNewAccount(watched) && !prefs.hide_first_night;
  const panelClient = api({ fetch: panelFetch, token });
  // The Social Feed skips its request at zero: the stats strip's read has the count.
  const following = Promise.resolve(known?.network?.following ?? null);
  return {
    profile: user,
    memberSince: formatDate(parsedProfile.data.joined_at, { ...layout.datePreferences, time: true }),
    /** The API's stats, or og's own count of them streaming in. Null when even the counts failed. */
    stats: panel,
    /** Movies and shows watched, for the welcome wall. */
    watched: watched ?? 0,
    watching: watching.status === 200 ? toWatchingNow(watching.body) : null,
    requests: parsedRequests.data
      .toSorted((a, b) => Date.parse(b.requested_at) - Date.parse(a.requested_at))
      .map((row) => toFollowRequest(row, { datePreferences: layout.datePreferences, now })),
    dashboard,
    // A new member's welcome wall stands in for the greeting and the recaps until they close it.
    firstNight: welcome ? fetchFirstNight({ fetch: panelFetch, now }) : null,
    recaps: welcome
      ? null
      : fetchRecapRibbon({ client: panelClient, slug: user.slug, timeZone: layout.datePreferences.timeZone, now }),
    upNext: unless(hidden.upNext, () =>
      fetchUpNext({ api: panelClient, username: user.slug, settings: dashboard.upNext, fetch: panelFetch }),
    ),
    schedule: unless(hidden.schedule, () =>
      fetchSchedule({
        fetch: panelFetch,
        token,
        settings: layout.settings,
        datePreferences: layout.datePreferences,
        schedule: dashboard.schedule,
        now,
      }),
    ),
    watchlist: unless(hidden.watchlist, () =>
      fetchWatchlist({ fetch: panelFetch, token, datePreferences: layout.datePreferences }),
    ),
    lastThirtyDays: unless(hidden.lastThirtyDays, () =>
      fetchLastThirtyDays({
        fetch: panelFetch,
        token,
        slug: user.slug,
        timeZone: layout.datePreferences.timeZone,
        weekStartDay: layout.datePreferences.weekStartDay,
        now,
      }),
    ),
    recentlyWatched: unless(hidden.recentlyWatched, () =>
      fetchRecentlyWatched({ fetch: panelFetch, token, datePreferences: layout.datePreferences }),
    ),
    // Its feed is Official-only, so a Standard app never shows the panel.
    socialFeed: unless(hidden.socialFeed || isStandardApi(), () =>
      fetchSocialFeed({
        fetch: panelFetch,
        token,
        following,
        now,
        datePreferences: layout.datePreferences,
      }),
    ),
    recommendations: unless(hidden.recommendations, () =>
      fetchRecommendations({ fetch: panelFetch, token, settings: dashboard.recommendations, now }),
    ),
  };
}
