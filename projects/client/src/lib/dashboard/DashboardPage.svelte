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

// Up Next and Recently Watched catch up with plays from elsewhere (a scrobble, another app): when you come back to the
// tab, and when what you were watching ends. Each swaps in once it has loaded, so a panel never blanks.
let upNext = $derived(data.upNext);
let recentlyWatched = $derived(data.recentlyWatched);

function refreshPlays() {
  const fetch = viewerFetch();
  if (data.upNext) {
    fetchUpNext({ api: api({ fetch }), username, settings: data.dashboard.upNext })
      .then((items) => (upNext = Promise.resolve(items)), () => {});
  }
  if (data.recentlyWatched) {
    fetchRecentlyWatched({ fetch, token: null, datePreferences: data.datePreferences })
      .then((plays) => (recentlyWatched = Promise.resolve(plays)), () => {});
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
  {#if data.stats}
    <!-- The API's stats render at once; og's own count streams in. -->
    {#await data.stats}
      <StatsPanel panel={null} slug={username} />
    {:then stats}
      <StatsPanel panel={toStatsPanel(stats)} slug={username} fresh={stats.movies.plays + stats.episodes.plays === 0} />
    {:catch}
      <!-- Without its stats the greeting goes without the panel. -->
    {/await}
  {/if}
</DashboardGreeting>
  {#if data.recaps}<RecapRibbon recaps={data.recaps} split={loadRecapSplit} />{/if}
{/if}
<DashboardInbox requests={data.requests} />
<!-- A panel the viewer hid comes back null. -->
{#if upNext}
  <UpNextPanel {upNext} {username} settings={data.dashboard.upNext} {welcome} />
{/if}
{#if data.schedule}
  <SchedulePanel schedule={data.schedule} filter={data.dashboard.schedule.filter}
  movies={data.dashboard.schedule.movies}
  onpick={loadSchedule} />
{/if}
{#if data.watchlist}
  <WatchlistPanel watchlist={data.watchlist} {username} datePreferences={data.datePreferences} {welcome} />
{/if}
{#if data.lastThirtyDays}
  <LastThirtyDaysPanel stats={data.lastThirtyDays} />
{/if}
{#if recentlyWatched}
  <RecentlyWatchedPanel plays={recentlyWatched} {username} datePreferences={data.datePreferences}
  {welcome} />
{/if}
{#if data.socialFeed}
  <SocialFeedPanel feed={data.socialFeed} {username} datePreferences={data.datePreferences} {welcome} />
{/if}
{#if data.recommendations}
  <RecommendationsPanel recommendations={data.recommendations} type={data.dashboard.recommendations.type}
  onpick={loadRecommendations} />
{/if}
