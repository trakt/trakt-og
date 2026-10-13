<script lang="ts">
import DashboardGreeting from '$lib/components/dashboard/DashboardGreeting.svelte';
import DashboardStats from '$lib/components/dashboard/DashboardStats.svelte';
import DashboardInbox from '$lib/components/dashboard/DashboardInbox.svelte';
import DashboardNotices from '$lib/components/dashboard/DashboardNotices.svelte';
import UpNextPanel from '$lib/components/dashboard/UpNextPanel.svelte';
import SchedulePanel from '$lib/components/dashboard/SchedulePanel.svelte';
import WatchlistPanel from '$lib/components/dashboard/WatchlistPanel.svelte';
import RecentlyWatchedPanel from '$lib/components/dashboard/RecentlyWatchedPanel.svelte';
import LastThirtyDaysPanel from '$lib/components/dashboard/LastThirtyDaysPanel.svelte';
import RecommendationsPanel from '$lib/components/dashboard/RecommendationsPanel.svelte';
import SocialFeedPanel from '$lib/components/dashboard/SocialFeedPanel.svelte';
import { authenticatedFetch } from '$lib/auth/authenticatedFetch';
import { userManager } from '$lib/auth/userManager';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import { fetchSchedule } from '$lib/dashboard/fetchSchedule';
import { overlay } from '$lib/overlay/overlay';
import { toStatsBand } from '$lib/dashboard/toStatsBand';
import type { loadDashboard } from '$lib/dashboard/loadDashboard';
import type { DatePreferences } from '$lib/settings/DatePreferences';
import type { ViewerSettings } from '$lib/settings/ViewerSettings';

type Data = Awaited<ReturnType<typeof loadDashboard>> & {
  datePreferences: DatePreferences;
  settings: ViewerSettings | null;
};

const { data }: { data: Data } = $props();
const band = $derived(toStatsBand(data.stats, overlay.collectionCounts()));
const username = $derived(data.profile.slug);
const isVip = $derived(!!data.profile.vip);

// The schedule's dropdowns save to the same per-browser settings the loader reads, then load the schedule from here.
function loadSchedule({ filter, movies }: Pick<DashboardSettings['schedule'], 'filter' | 'movies'>) {
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), upcoming_filter: filter, upcoming_movies: movies });
  return fetchSchedule({
    fetch: authenticatedFetch({ manager: userManager() }),
    token: null,
    settings: data.settings,
    datePreferences: data.datePreferences,
    isVip,
    schedule: { ...data.dashboard.schedule, filter, movies },
  });
}
</script>

<svelte:head>
  <title>Dashboard - Trakt</title>
  <meta name="description"
    content="Your Trakt dashboard: watching statistics, follow requests and what to watch next." />
</svelte:head>

<DashboardGreeting user={data.profile} memberSince={data.memberSince} watching={data.watching} />
<DashboardStats {band} slug={username} />
<DashboardNotices notices={data.notices} day={data.noticeDay} />
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
  <RecommendationsPanel recommendations={data.recommendations} {username} {isVip}
  datePreferences={data.datePreferences} />
{/if}
