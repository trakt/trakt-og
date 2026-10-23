<script lang="ts">
import DashboardGreeting from '$lib/components/dashboard/DashboardGreeting.svelte';
import FirstNightHero from '$lib/components/first-night/FirstNightHero.svelte';
import FirstNightProgress from '$lib/components/first-night/FirstNightProgress.svelte';
import RecapRibbon from '$lib/components/dashboard/RecapRibbon.svelte';
import StatsPanel from '$lib/components/dashboard/StatsPanel.svelte';
import DashboardInbox from '$lib/components/dashboard/DashboardInbox.svelte';
import UpNextPanel from '$lib/components/dashboard/UpNextPanel.svelte';
import SchedulePanel from '$lib/components/dashboard/SchedulePanel.svelte';
import WatchlistPanel from '$lib/components/dashboard/WatchlistPanel.svelte';
import RecentlyWatchedPanel from '$lib/components/dashboard/RecentlyWatchedPanel.svelte';
import LastThirtyDaysPanel from '$lib/components/dashboard/LastThirtyDaysPanel.svelte';
import RecommendationsPanel from '$lib/components/dashboard/RecommendationsPanel.svelte';
import SocialFeedPanel from '$lib/components/dashboard/SocialFeedPanel.svelte';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import { fetchRecommendations } from '$lib/dashboard/fetchRecommendations';
import { fetchSchedule } from '$lib/dashboard/fetchSchedule';
import { toStatsPanel } from '$lib/dashboard/toStatsPanel';
import type { loadDashboard } from '$lib/dashboard/loadDashboard';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { ViewerSettings } from '$lib/settings/ViewerSettings';
import { viewerFetch } from '../auth/viewerFetch.ts';

type Data = Awaited<ReturnType<typeof loadDashboard>> & {
  datePreferences: DatePreferences;
  settings: ViewerSettings | null;
};

const { data }: { data: Data } = $props();
const panel = $derived(toStatsPanel(data.stats));
const username = $derived(data.profile.slug);
const isVip = $derived(!!data.profile.vip);

// The schedule's dropdowns save to the same per-browser settings the loader reads, then load the schedule from here.
function loadSchedule({ filter, movies }: Pick<DashboardSettings['schedule'], 'filter' | 'movies'>) {
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), upcoming_filter: filter, upcoming_movies: movies });
  return fetchSchedule({
    fetch: viewerFetch(),
    token: null,
    settings: data.settings,
    datePreferences: data.datePreferences,
    isVip,
    schedule: { ...data.dashboard.schedule, filter, movies },
  });
}

// The recommendations' Type dropdown works the same way.
function loadRecommendations(type: DashboardSettings['recommendations']['type']) {
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), recommendations_type: type });
  return fetchRecommendations({
    fetch: viewerFetch(),
    token: null,
    settings: { ...data.dashboard.recommendations, type },
  });
}
</script>

<svelte:head>
  <title>Dashboard - Trakt</title>
  <meta name="description"
    content="Your Trakt dashboard: watching statistics, follow requests and what to watch next." />
</svelte:head>

{#if data.firstNight}
  <FirstNightProgress slug={username}
  watched={data.stats.movies.watched + data.stats.shows.watched}
  taste={{
      country: data.settings?.browsing?.watchnow?.country?.toLowerCase() || 'us',
      services: data.settings?.browsing?.watchnow?.favorites ?? [],
      genres: data.settings?.browsing?.genres?.favorites ?? [],
    }} />
  <FirstNightHero firstNight={data.firstNight} firstName={data.profile.firstName}
  named={!!data.settings?.user.name?.trim()} avatarUrl={data.profile.avatarUrl} />
{:else}
  <DashboardGreeting user={data.profile} memberSince={data.memberSince} watching={data.watching}>
  <StatsPanel {panel} slug={username} fresh={data.stats.movies.plays + data.stats.episodes.plays === 0} />
</DashboardGreeting>
  {#if data.recaps}<RecapRibbon recaps={data.recaps} />{/if}
{/if}
<DashboardInbox requests={data.requests} />
<!-- A panel the viewer hid comes back null. -->
{#if data.upNext}
  <UpNextPanel upNext={data.upNext} {username} {isVip} settings={data.dashboard.upNext} />
{/if}
{#if data.schedule}
  <SchedulePanel schedule={data.schedule} filter={data.dashboard.schedule.filter}
  movies={data.dashboard.schedule.movies}
  onpick={loadSchedule} />
{/if}
{#if data.watchlist}
  <WatchlistPanel watchlist={data.watchlist} {username} {isVip} datePreferences={data.datePreferences} />
{/if}
{#if data.lastThirtyDays}
  <LastThirtyDaysPanel stats={data.lastThirtyDays} />
{/if}
{#if data.recentlyWatched}
  <RecentlyWatchedPanel plays={data.recentlyWatched} {username} {isVip} datePreferences={data.datePreferences} />
{/if}
{#if data.socialFeed}
  <SocialFeedPanel feed={data.socialFeed} {username} datePreferences={data.datePreferences} />
{/if}
{#if data.recommendations}
  <RecommendationsPanel recommendations={data.recommendations} type={data.dashboard.recommendations.type} {isVip}
  onpick={loadRecommendations} />
{/if}
