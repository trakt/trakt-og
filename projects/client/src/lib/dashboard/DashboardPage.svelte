<script lang="ts">
import { invalidateAll } from '$app/navigation';
import { page } from '$app/state';
import { untrack } from 'svelte';
import { AnalyticsEvent } from '#lib/analytics/AnalyticsEvent.ts';
import { useTrack } from '#lib/analytics/useTrack.ts';
import SeoHead from '#lib/seo/SeoHead.svelte';
import { staticSeo } from '#lib/seo/pages/staticSeo.ts';
import DashboardCustomizer from '#lib/components/dashboard/DashboardCustomizer.svelte';
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
import WatchingNowPanel from '#lib/components/dashboard/WatchingNowPanel.svelte';
import HotInNetworkPanel from '#lib/components/dashboard/HotInNetworkPanel.svelte';
import PinnedListPanel from '#lib/components/dashboard/PinnedListPanel.svelte';
import { api } from '#lib/api/api.ts';
import type { DashboardSettings } from '#lib/dashboard/DashboardSettings.ts';
import type { RecapSpan } from '#lib/dashboard/RecapRibbon.ts';
import { type DashboardLayout, type DashboardSection, dashboardPrefs } from '#lib/dashboard/dashboardPrefs.ts';
import { isPinKey, type ListPin, type PinKey, pinKey } from '#lib/dashboard/listPins.ts';
import { SocialCircle } from '#lib/dashboard/socialCircle.svelte.ts';
import { separatedPanels } from '#lib/dashboard/separatePanels.ts';
import { fetchRecapSplit } from '#lib/dashboard/fetchRecapSplit.ts';
import { fetchRecommendations } from '#lib/dashboard/fetchRecommendations.ts';
import { fetchSchedule } from '#lib/dashboard/fetchSchedule.ts';
import { fetchRecentlyWatched } from '#lib/dashboard/fetchRecentlyWatched.ts';
import { fetchUpNext } from '#lib/dashboard/fetchUpNext.ts';
import { fetchPinnedList } from '#lib/dashboard/fetchPinnedList.ts';
import { fetchPinnedListStats } from '#lib/dashboard/fetchPinnedListStats.ts';
import { fetchWatchlist } from '#lib/dashboard/fetchWatchlist.ts';
import type { ListSort } from '#lib/lists/resolveListSort.ts';
import { type ListStats, toCardListStats } from '#lib/lists/toListStats.ts';
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

// The recommendations' Type and Release dropdowns work the same way.
function loadRecommendations(picks: DashboardSettings['recommendations']) {
  const saved = dashboardPrefs.load(username);
  if (picks.type !== saved.recommendations_type) {
    trackDiscoverMode({ mode: picks.type, source: page.route.id ?? 'unknown' });
  }
  dashboardPrefs.save(username, {
    ...saved,
    recommendations_type: picks.type,
    recommendations_release: picks.release,
  });
  return fetchRecommendations({ fetch: viewerFetch(), token: null, settings: picks });
}

// The sections' order, hide switches and pinned lists: the saved ones until the customize popup or a panel's tack
// changes them. A change shows at once and saves to this browser.
let layout = $derived<DashboardLayout>({
  order: data.dashboard.order,
  hidden: data.dashboard.hidden,
  pins: data.dashboard.pins,
});
const shownPanels = $derived(layout.order.filter((section) => dashboardPrefs.isShown(layout, section)));
const pinOf = (key: PinKey) => layout.pins.find((pin) => pinKey(pin) === key);

function changeLayout(next: DashboardLayout) {
  layout = next;
  dashboardPrefs.save(username, dashboardPrefs.withLayout(dashboardPrefs.load(username), next));
}

// The pinned lists the viewer can no longer see, which the popup marks, and each loaded one's whole-list read for its
// percentages, read once per list: a new sort keeps it. A panel that read the whole list for its hides counts that.
let gone = $state<ReadonlySet<PinKey>>(new Set());
let pinStats = $state.raw<Readonly<Record<PinKey, Promise<ListStats | null>>>>({});
$effect(() => {
  for (const [key, read] of Object.entries(panels.pinned) as [PinKey, (typeof panels.pinned)[PinKey]][]) {
    read?.then((list) => {
      if (list.status === 'gone') gone = new Set([...gone, key]);
      const pin = pinOf(key);
      if (list.status !== 'loaded' || !pin || untrack(() => pinStats[key])) return;
      const stats =
        list.scope === 'whole'
          ? Promise.resolve(toCardListStats(list.cards, { withItems: true }))
          : fetchPinnedListStats({ fetch: viewerFetch(), pin, total: list.total });
      pinStats = { ...pinStats, [key]: stats };
    }, () => {});
  }
});

// A sort or hides picked on a pinned list's panel: saved on the pin. A new sort reads that panel again, and so do hides
// on a panel that only read its first items.
function changePin(key: PinKey, change: Pick<ListPin, 'sort' | 'hide'>, reread: boolean) {
  const pins = layout.pins.map((pin) => (pinKey(pin) === key ? { ...pin, ...change } : pin));
  changeLayout({ ...layout, pins });
  const pin = pins.find((entry) => pinKey(entry) === key);
  if (!pin || !reread) return;
  const list = fetchPinnedList({ fetch: viewerFetch(), pin, datePreferences: data.datePreferences });
  panels = { ...panels, pinned: { ...panels.pinned, [key]: list } };
}

const sortPin = (key: PinKey, sort: ListSort) => changePin(key, { sort }, true);

function hidePin(key: PinKey, hide: string[]) {
  changePin(key, { hide: hide.length > 0 ? hide : undefined }, false);
  if (hide.length === 0) return;
  void panels.pinned[key]?.then(
    (list) => list.status === 'loaded' && list.scope === 'first' && changePin(key, {}, true),
    () => {},
  );
}

// The same for the Watchlist panel, saved to this browser.
let watchlistHide = $derived<readonly string[]>(data.dashboard.watchlist.hide);

function readWatchlist() {
  const watchlist = fetchWatchlist({
    fetch: viewerFetch(),
    token: null,
    datePreferences: data.datePreferences,
    sort: dashboardPrefs.load(username).watchlist_sort,
    hide: watchlistHide,
  });
  panels = { ...panels, watchlist };
}

function sortWatchlist(sort: ListSort) {
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), watchlist_sort: sort });
  readWatchlist();
}

function hideWatchlist(hide: string[]) {
  watchlistHide = hide;
  dashboardPrefs.save(username, { ...dashboardPrefs.load(username), watchlist_hide: hide });
  if (hide.length === 0) return;
  void panels.watchlist?.then((list) => list.scope !== 'whole' && list.scope !== 'tooLong' && readWatchlist(), () => {});
}

// Watching Now, Hot in Your Network and the Social Feed share the feed's reads, made once here.
const feed = $derived(panels.socialFeed);
const social = $derived(
  feed
    ? new SocialCircle({
        feed,
        datePreferences: data.datePreferences,
        following: data.stats?.network?.following ?? null,
      })
    : null,
);
$effect(() => social?.start());

const readOf = (section: DashboardSection) => {
  if (isPinKey(section)) return panels.pinned[section];
  return section === 'watchingNow' || section === 'hotInNetwork' ? panels.socialFeed : panels[section];
};

// A section hidden when the page loaded may never have read; once the popup closes with it on, load the dashboard again.
function loadShown() {
  const unread = (section: DashboardSection) => dashboardPrefs.isShown(layout, section) && !readOf(section);
  if (layout.order.some(unread)) void invalidateAll();
}

let customizing = $state(false);
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
  <DashboardGreeting user={data.profile} memberSince={data.memberSince} watching={viewerWatching.latest(data.viewerWatching)}
    oncustomize={() => (customizing = true)}>
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
<!-- In the viewer's order. A panel hidden when the page loaded comes back null. Two of one color side by side are set
     apart. -->
<div class="panels" {@attach separatedPanels}>
{#each shownPanels as panel (panel)}
  {@const pinned = isPinKey(panel) ? panels.pinned[panel] : null}
  {@const pin = isPinKey(panel) ? pinOf(panel) : undefined}
  {#if pinned && pin}
    <PinnedListPanel {pin} list={pinned} stats={isPinKey(panel) ? (pinStats[panel] ?? null) : null}
      datePreferences={data.datePreferences}
      onsort={(sort) => isPinKey(panel) && sortPin(panel, sort)}
      onhide={(hide) => isPinKey(panel) && hidePin(panel, hide)} />
  {:else if panel === 'upNext' && panels.upNext}
    <UpNextPanel upNext={panels.upNext} {username} settings={data.dashboard.upNext} {welcome} />
  {:else if panel === 'schedule' && panels.schedule}
    <SchedulePanel schedule={panels.schedule} filter={data.dashboard.schedule.filter}
    movies={data.dashboard.schedule.movies}
    onpick={loadSchedule} />
  {:else if panel === 'watchlist' && panels.watchlist}
    <WatchlistPanel watchlist={panels.watchlist} {username} datePreferences={data.datePreferences} {welcome}
      onsort={sortWatchlist} hide={watchlistHide} onhide={hideWatchlist} />
  {:else if panel === 'lastThirtyDays' && panels.lastThirtyDays}
    <LastThirtyDaysPanel stats={panels.lastThirtyDays} />
  {:else if panel === 'recentlyWatched' && panels.recentlyWatched}
    <RecentlyWatchedPanel plays={panels.recentlyWatched} {username} datePreferences={data.datePreferences}
    {welcome} />
  {:else if panel === 'watchingNow' && social}
    <WatchingNowPanel circle={social} />
  {:else if panel === 'hotInNetwork' && social}
    <HotInNetworkPanel circle={social} />
  {:else if panel === 'socialFeed' && social}
    <SocialFeedPanel circle={social} {username} {welcome} />
  {:else if panel === 'recommendations' && panels.recommendations}
    <RecommendationsPanel recommendations={panels.recommendations} type={data.dashboard.recommendations.type}
    release={data.dashboard.recommendations.release}
    onpick={loadRecommendations} />
  {/if}
{/each}
</div>
<DashboardCustomizer bind:open={customizing} {layout} {gone} onchange={changeLayout} onclose={loadShown} />

<style>
.panels {
  display: contents;
}
</style>
