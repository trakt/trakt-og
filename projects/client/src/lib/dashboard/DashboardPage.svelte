<script lang="ts">
import { page } from '$app/state';
import { untrack } from 'svelte';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { staticSeo } from '#lib/seo/pages/staticSeo.ts';
import DashboardGreeting from '#lib/components/dashboard/DashboardGreeting.svelte';
import FirstNightHero from '#lib/components/first-night/FirstNightHero.svelte';
import FirstNightProgress from '#lib/components/first-night/FirstNightProgress.svelte';
import RecapRibbon from '#lib/components/dashboard/RecapRibbon.svelte';
import StatsPanel from '#lib/components/dashboard/StatsPanel.svelte';
import DashboardInbox from '#lib/components/dashboard/DashboardInbox.svelte';
import UpNextPanel from '#lib/components/dashboard/UpNextPanel.svelte';
import SchedulePanel from '#lib/components/dashboard/SchedulePanel.svelte';
import WatchlistPanel from '#lib/components/dashboard/WatchlistPanel.svelte';
import RecentlyWatchedPanel from '#lib/components/dashboard/RecentlyWatchedPanel.svelte';
import LastThirtyDaysPanel from '#lib/components/dashboard/LastThirtyDaysPanel.svelte';
import RecommendationsPanel from '#lib/components/dashboard/RecommendationsPanel.svelte';
import SocialFeedPanel from '#lib/components/dashboard/SocialFeedPanel.svelte';
import { api } from '#lib/api/api.ts';
import type { DashboardSettings } from '#lib/dashboard/DashboardSettings.ts';
import type { RecapSpan } from '#lib/dashboard/RecapRibbon.ts';
import { dashboardPrefs } from '#lib/dashboard/dashboardPrefs.ts';
import { fetchRecapSplit } from '#lib/dashboard/fetchRecapSplit.ts';
import { fetchRecommendations } from '#lib/dashboard/fetchRecommendations.ts';
import { fetchSchedule } from '#lib/dashboard/fetchSchedule.ts';
import { fetchRecentlyWatched } from '#lib/dashboard/fetchRecentlyWatched.ts';
import { fetchUpNext } from '#lib/dashboard/fetchUpNext.ts';
import { lastActivities } from '#lib/activity/lastActivities.ts';
import { cachedComputedStats } from '#lib/stats/cachedComputedStats.ts';
import { fetchComputedStats } from '#lib/stats/fetchComputedStats.ts';
import type { UserStats } from '#lib/stats/userStatsSchema.ts';
import {
  type DashboardPanels,
  PENDING,
  pendingDashboardPanels,
  startDashboardPanels,
} from '#lib/dashboard/startDashboardPanels.ts';
import { refreshOnReturn } from '#lib/dashboard/refreshOnReturn.ts';
import { toStatsPanel } from '#lib/dashboard/toStatsPanel.ts';
import type { loadDashboard } from '#lib/dashboard/loadDashboard.ts';
import type { DatePreferences } from '#lib/settings/DatePreferences.ts';
import type { ViewerSettings } from '#lib/settings/ViewerSettings.ts';
import { viewerWatching } from '#lib/users/viewerWatching.svelte.ts';
import { viewerFetch } from '../auth/viewerFetch.ts';

type Data = Awaited<ReturnType<typeof loadDashboard>> & {
  datePreferences: DatePreferences;
  settings: ViewerSettings | null;
};

const { data }: { data: Data } = $props();
const username = $derived(data.profile.slug);
// While the welcome wall shows, empty panels offer starter picks to fill them in place.
const welcome = $derived(!!data.firstNight);

// The schedule's dropdowns save to the same per-browser settings the loader reads, then load the schedule from here.
function loadSchedule({ filter, movies }: Pick<DashboardSettings['schedule'], 'filter' | 'movies'>) {
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), upcoming_filter: filter, upcoming_movies: movies });
  return fetchSchedule({
    fetch: viewerFetch(),
    token: null,
    settings: data.settings,
    datePreferences: data.datePreferences,
    schedule: { ...data.dashboard.schedule, filter, movies },
  });
}

// The server renders each visible panel's placeholder; effects only run in the browser, so each panel's reads start
// there, with the viewer's own token. A hidden panel stays null and makes no request. A fresh read for a saved panel
// swaps in later, unless a newer start has replaced this one.
let panels = $state.raw<DashboardPanels>(untrack(() => pendingDashboardPanels({ dashboard: data.dashboard, welcome })));
let started = 0;
$effect(() => {
  const start = ++started;
  panels = startDashboardPanels({
    fetch: viewerFetch(),
    slug: username,
    dashboard: data.dashboard,
    datePreferences: data.datePreferences,
    settings: data.settings,
    following: data.stats?.network?.following ?? null,
    welcome,
    activities: lastActivities.read,
    onUpdate: (fresh) => {
      if (start === started) panels = { ...panels, ...fresh };
    },
    now: new Date(),
  });
});

// Up Next and Recently Watched catch up with plays from elsewhere (a scrobble, another app): when you come back to the
// tab, and when what you were watching ends. They read fresh, past the saved copy, and each swaps in once it has
// loaded, so a panel never blanks.
function refreshPlays() {
  const fetch = viewerFetch();
  if (panels.upNext) {
    fetchUpNext({ api: api({ fetch }), username, settings: data.dashboard.upNext, fetch })
      .then((items) => (panels = { ...panels, upNext: Promise.resolve(items) }), () => {});
  }
  if (panels.recentlyWatched) {
    fetchRecentlyWatched({ fetch, token: null, datePreferences: data.datePreferences })
      .then((plays) => (panels = { ...panels, recentlyWatched: Promise.resolve(plays) }), () => {});
  }
}

$effect(() => refreshOnReturn({ refresh: refreshPlays }));

let wasPlaying: string | null | undefined;
$effect(() => {
  const playing = viewerWatching.current === undefined ? undefined : (viewerWatching.current?.href ?? null);
  const ended = !!wasPlaying && playing !== undefined && playing !== wasPlaying;
  wasPlaying = playing;
  if (ended) untrack(refreshPlays);
});

// Without the API's stats, the browser counts them from your whole watched lists, starting from the loader's counts,
// and keeps them until your activity moves. Saved stats show at once and give way to a recount if it moved.
let countedStats = $state<Promise<UserStats> | null>(null);
$effect(() => {
  const counts = data.countedStats;
  const fetch = viewerFetch();
  countedStats = counts
    ? cachedComputedStats({
        activities: lastActivities.read,
        user: username,
        counts,
        read: () => fetchComputedStats({ fetch, token: null, id: 'me', isSelf: true, counts: Promise.resolve(counts) }),
        onUpdate: (stats) => {
          if (data.countedStats === counts) countedStats = Promise.resolve(stats);
        },
      })
    : null;
});
const stats = $derived(data.stats ?? (data.countedStats ? (countedStats ?? PENDING) : null));

// A recap month's hover card splits its plays from the browser, the first time it opens.
const loadRecapSplit = (span: RecapSpan) => fetchRecapSplit({ client: api({ fetch: viewerFetch() }), span });

const { track: trackDiscoverMode } = useTrack(AnalyticsEvent.DiscoverMode);

// The recommendations' Type dropdown works the same way.
function loadRecommendations(type: DashboardSettings['recommendations']['type']) {
  trackDiscoverMode({ mode: type, source: page.route.id ?? 'unknown' });
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), recommendations_type: type });
  return fetchRecommendations({
    fetch: viewerFetch(),
    token: null,
    settings: { ...data.dashboard.recommendations, type },
  });
}
</script>

<SeoHead {...staticSeo['/dashboard']} />

{#if data.firstNight}
  <FirstNightProgress slug={username}
  watched={data.watched}
  taste={{
      country: data.settings?.browsing?.watchnow?.country?.toLowerCase() || 'us',
      services: data.settings?.browsing?.watchnow?.favorites ?? [],
      genres: data.settings?.browsing?.genres?.favorites ?? [],
    }} />
  <FirstNightHero firstNight={data.firstNight} firstName={data.profile.firstName}
  named={!!data.settings?.user.name?.trim()} avatarUrl={data.profile.avatarUrl} />
{:else}
  <DashboardGreeting user={data.profile} memberSince={data.memberSince} watching={viewerWatching.latest(data.viewerWatching)}>
  {#if stats}
    <!-- The API's stats render at once; og's own count loads in the browser. -->
    {#await stats}
      <StatsPanel panel={null} slug={username} />
    {:then stats}
      <StatsPanel panel={toStatsPanel(stats)} slug={username} fresh={stats.movies.plays + stats.episodes.plays === 0} />
    {:catch}
      <!-- Without its stats the greeting goes without the panel. -->
    {/await}
  {/if}
</DashboardGreeting>
  {#if panels.recaps}<RecapRibbon recaps={panels.recaps} split={loadRecapSplit} />{/if}
{/if}
<DashboardInbox requests={data.requests} />
<!-- A panel the viewer hid comes back null. -->
{#if panels.upNext}
  <UpNextPanel upNext={panels.upNext} {username} settings={data.dashboard.upNext} {welcome} />
{/if}
{#if panels.schedule}
  <SchedulePanel schedule={panels.schedule} filter={data.dashboard.schedule.filter}
  movies={data.dashboard.schedule.movies}
  onpick={loadSchedule} />
{/if}
{#if panels.watchlist}
  <WatchlistPanel watchlist={panels.watchlist} {username} datePreferences={data.datePreferences} {welcome} />
{/if}
{#if panels.lastThirtyDays}
  <LastThirtyDaysPanel stats={panels.lastThirtyDays} />
{/if}
{#if panels.recentlyWatched}
  <RecentlyWatchedPanel plays={panels.recentlyWatched} {username} datePreferences={data.datePreferences}
  {welcome} />
{/if}
{#if panels.socialFeed}
  <SocialFeedPanel feed={panels.socialFeed} {username} datePreferences={data.datePreferences} {welcome} />
{/if}
{#if panels.recommendations}
  <RecommendationsPanel recommendations={panels.recommendations} type={data.dashboard.recommendations.type}
  onpick={loadRecommendations} />
{/if}
