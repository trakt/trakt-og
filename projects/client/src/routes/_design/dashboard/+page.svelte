<script lang="ts">
import { browser } from '$app/environment';
import LastThirtyDaysPanel from '$lib/components/dashboard/LastThirtyDaysPanel.svelte';
import RecentlyWatchedPanel from '$lib/components/dashboard/RecentlyWatchedPanel.svelte';
import RecommendationsPanel from '$lib/components/dashboard/RecommendationsPanel.svelte';
import SocialFeedPanel from '$lib/components/dashboard/SocialFeedPanel.svelte';
import SchedulePanel from '$lib/components/dashboard/SchedulePanel.svelte';
import UpNextPanel from '$lib/components/dashboard/UpNextPanel.svelte';
import WatchlistPanel from '$lib/components/dashboard/WatchlistPanel.svelte';
import Specimen from '$lib/design/Specimen.svelte';
import Variant from '$lib/design/Variant.svelte';
import type { OnDeckItem } from '$lib/components/media/OnDeckItem';
import { dayIn } from '$lib/utils/dayIn';
import { toCalendarItems } from '$lib/calendars/toCalendarItems';
import type { DashboardRecommendations } from '$lib/dashboard/fetchRecommendations';
import { fetchUpNext } from '$lib/dashboard/fetchUpNext';
import type { DashboardWatchlist } from '$lib/dashboard/fetchWatchlist';
import type { LastThirtyDays } from '$lib/dashboard/LastThirtyDays';
import { lastThirtyDaysFixture } from '$lib/dashboard/lastThirtyDaysFixture';
import { recentlyWatchedFixture } from '$lib/dashboard/recentlyWatchedFixture';
import { recommendationsFixture } from '$lib/dashboard/recommendationsFixture';
import type { ScheduleDay } from '$lib/dashboard/ScheduleDay';
import { scheduleFixture } from '$lib/dashboard/scheduleFixture';
import { fetchSocialFeed, fetchSocialItems, type SocialFeed } from '$lib/dashboard/fetchSocialFeed';
import { type SocialPeriod, socialWindows } from '$lib/dashboard/socialWindows';
import { socialFeedFixture } from '$lib/dashboard/socialFeedFixture';
import { toLastThirtyDays } from '$lib/dashboard/toLastThirtyDays';
import { type RecentPlay, toRecentPlay } from '$lib/dashboard/toRecentPlay';
import { toScheduleDays } from '$lib/dashboard/toScheduleDays';
import { upcomingDays } from '$lib/dashboard/upcomingDays';
import { watchlistFixture } from '$lib/dashboard/watchlistFixture';
import { listItemSorts } from '$lib/lists/listItemSorts';
import { toListItemCard } from '$lib/lists/toListItemCard';
import { dashboardPrefs } from '$lib/dashboard/dashboardPrefs';
import { scheduleStart } from '$lib/dashboard/scheduleStart';
import type { DashboardSettings } from '$lib/dashboard/DashboardSettings';
import { toDashboardSettings } from '$lib/dashboard/toDashboardSettings';
import { caughtUp, finished, upNextClient } from './fixtures.ts';

const { data } = $props();

// OG's defaults, which the page passes when the viewer never saved any.
const defaults = toDashboardSettings({ settings: null });

// Eight cards fill two rows, so the pill has somewhere to go.
const sample = fetchUpNext({ api: upNextClient, username: 'me', settings: defaults.upNext });
// After a refresh, a card whose last aired episode was just watched: a show that ended, then one coming back.
const caughtUpSample = sample.then(([first, ...rest]) => [
  ...(first ? [finished(first, 'Ended')] : []),
  caughtUp,
  ...rest,
]);
const empty = Promise.resolve([]);
const loading = new Promise<readonly OnDeckItem[]>(() => {});
// Built in the browser only, so the server never sees an unhandled rejection.
const failed = browser ? Promise.reject(new Error('demo')) : loading;

const DAY = 86_400_000;

function scheduleDays({ shift = 0, busy = false, drop = false, only }: {
  /** Days to move the fixture later by. */
  shift?: number;
  busy?: boolean;
  drop?: boolean;
  /** Just these shows. */
  only?: readonly string[];
} = {}): ScheduleDay[] {
  const { timeZone } = data.datePreferences;
  const today = dayIn(new Date().toISOString(), timeZone);
  const rows = scheduleFixture.rows(dayIn(new Date(Date.now() + shift * DAY).toISOString(), timeZone), { busy, drop })
    .filter(({ show }) => !only || only.includes(show?.title ?? ''));
  return toScheduleDays({
    days: upcomingDays({ items: toCalendarItems(rows), start: today, timeZone, count: 5 }),
    today,
    datePreferences: data.datePreferences,
    offers: scheduleFixture.offers,
    country: 'us',
  });
}
const schedule = $derived(Promise.resolve(scheduleDays({ busy: true })));
const scheduleDrop = $derived(Promise.resolve(scheduleDays({ busy: true, drop: true })));
const scheduleLater = $derived(Promise.resolve(scheduleDays({ busy: true, shift: 2 })));
const scheduleQuiet = $derived(Promise.resolve(scheduleDays({ only: ['Slow Horses', 'Scrubs'] })));
const scheduleTwoDays = $derived(Promise.resolve(scheduleDays().slice(0, 2)));
const scheduleEmpty = Promise.resolve([]);
const scheduleLoading = new Promise<readonly ScheduleDay[]>(() => {});
const scheduleFailed = browser ? Promise.reject(new Error('demo')) : scheduleLoading;
const schedules = $derived([
  { label: 'A busy week', schedule },
  { label: 'A season dropping today', schedule: scheduleDrop },
  { label: 'Nothing on until the day after tomorrow', schedule: scheduleLater },
  { label: 'A quiet week', schedule: scheduleQuiet },
  { label: 'Two days', schedule: scheduleTwoDays },
  { label: 'Empty', schedule: scheduleEmpty },
  { label: 'Loading', schedule: scheduleLoading },
  { label: 'Failed', schedule: scheduleFailed },
]);

function watchlistSample(sortBy: string, sortHow: DashboardWatchlist['sortHow']): DashboardWatchlist {
  const { datePreferences } = data;
  return {
    cards: watchlistFixture.rows.map((row) => toListItemCard(row, { sortBy, datePreferences })),
    total: watchlistFixture.total,
    sortName: listItemSorts.find(({ by }) => by === sortBy)?.label ?? 'Rank',
    sortHow,
  };
}
const watchlist = $derived(Promise.resolve(watchlistSample('added', 'desc')));
const watchlistRated = $derived(Promise.resolve(watchlistSample('percentage', 'asc')));
const watchlistEmpty = Promise.resolve({ cards: [], total: 0, sortName: 'Rank', sortHow: 'asc' as const });
const watchlistLoading = new Promise<DashboardWatchlist>(() => {});
const watchlistFailed = browser ? Promise.reject(new Error('demo')) : watchlistLoading;

// The first sample is a check-in with 30 minutes to go, which history holds at its end time.
const checkinEnd = new Date(Date.now() + 30 * 60_000).toISOString();
const recentPlays = $derived(
  Promise.resolve(
    recentlyWatchedFixture.rows.map((row, i) =>
      toRecentPlay(i === 0 ? { ...row, watched_at: checkinEnd } : row, data.datePreferences)
    ),
  ),
);
const recentLoading = new Promise<readonly RecentPlay[]>(() => {});
const recentFailed = browser ? Promise.reject(new Error('demo')) : recentLoading;

function lastThirtyDays(): LastThirtyDays {
  const { timeZone, weekStartDay } = data.datePreferences;
  const now = new Date();
  const rows = lastThirtyDaysFixture.rows(dayIn(now.toISOString(), timeZone));
  const start = new Date(now.getTime() - 30 * DAY).toISOString();
  return toLastThirtyDays({ ...rows, start, slug: 'me', now, timeZone, weekStartDay });
}
const lastMonth = $derived(Promise.resolve(lastThirtyDays()));
const genresOnly = $derived(lastMonth.then((stats) => ({ ...stats, chart: null, keys: [] })));
const lastMonthLoading = new Promise<LastThirtyDays>(() => {});
const lastMonthFailed = browser ? Promise.reject(new Error('demo')) : lastMonthLoading;

// The fixture's week, through the real fetchers: the worker answers each window with its rows.
const socialNow = new Date();
const socialWorker = (input: Request | URL | string) => {
  const url = new URL(input instanceof Request ? input.url : input, 'https://apiz.trakt.tv');
  const start = Date.parse(url.searchParams.get('start_at') ?? '');
  const end = Date.parse(url.searchParams.get('end_at') ?? '');
  const rows = socialFeedFixture.rows(socialNow).filter(({ activity_at }) => {
    const at = Date.parse(activity_at);
    return at >= start && at <= end;
  });
  return Promise.resolve(Response.json(rows));
};
const socialRowsFor = (period: Exclude<SocialPeriod, 'today'>) =>
  fetchSocialItems({
    get: socialWorker,
    windows: socialWindows(period, socialNow, data.datePreferences.timeZone),
    datePreferences: data.datePreferences,
  });
const social = $derived(fetchSocialFeed({
  fetch: socialWorker,
  token: 'demo',
  following: Promise.resolve(8),
  now: socialNow,
  datePreferences: data.datePreferences,
}));
// Seven puts four behind the "+4 watching" tile.
const watchingNow = (count: number) => () => Promise.resolve(socialFeedFixture.live(new Date()).slice(0, count));
const socialEmpty = Promise.resolve<SocialFeed>({ follows: true, items: [], recent: [] });
const socialNobody = Promise.resolve<SocialFeed>({ follows: false, items: [], recent: [] });
const socialLoading = new Promise<SocialFeed>(() => {});
const socialFailed = browser ? Promise.reject(new Error('demo')) : socialLoading;
const socials = $derived([
  { label: 'Nobody watching now', feed: social, live: 0 },
  { label: 'One watching now', feed: social, live: 1 },
  { label: 'Three watching now', feed: social, live: 3 },
  { label: 'Seven watching now', feed: social, live: 7 },
  { label: 'A quiet week', feed: socialEmpty, live: 0 },
  { label: 'Following nobody: not started, with a way to start', feed: socialNobody, live: 0 },
  { label: 'Following nobody in welcome mode: the team to follow', feed: socialNobody, live: 0, welcome: true },
  { label: 'Loading', feed: socialLoading, live: 0 },
  { label: 'Failed', feed: socialFailed, live: 0 },
]);

const recsFor = (type: DashboardSettings['recommendations']['type']) =>
  Promise.resolve<DashboardRecommendations>({
    type,
    items: type === 'media' ? recommendationsFixture : recommendationsFixture.filter((item) => item.type === type),
  });
const recsOne = Promise.resolve<DashboardRecommendations>({ type: 'show', items: recommendationsFixture.slice(0, 1) });
const recsEmpty = Promise.resolve<DashboardRecommendations>({ type: 'movie', items: [] });
const recsLoading = new Promise<DashboardRecommendations>(() => {});
const recsFailed = browser ? Promise.reject(new Error('demo')) : recsLoading;
const recommendations = [
  { label: 'Shows and movies', recs: recsFor('media'), type: 'media' },
  { label: 'One title', recs: recsOne, type: 'show' },
  { label: 'Nothing to recommend', recs: recsEmpty, type: 'movie' },
  { label: 'Loading', recs: recsLoading, type: 'media' },
  { label: 'Failed', recs: recsFailed, type: 'media' },
] as const;

// A VIP's saved settings: Up Next by completion with favorites only, finales from yesterday, and the Watchlist and
// Social Feed hidden. The fetchers apply the rest (worker sorts, season posters, the ignore switches).
const custom = toDashboardSettings({
  settings: {
    user: { vip: true },
    browsing: {
      progress: { on_deck: { sort: 'completed', sort_how: 'asc', only_favorites: true } },
      watchnow: { favorites: ['us-netflix', 'us-hulu', 'us-max'] },
    },
  },
  prefs: {
    ...dashboardPrefs.defaults,
    upcoming_filter: 'finales',
    upcoming_start_day: 'yesterday',
    hide_list: true,
    hide_network: true,
  },
});
const customUpNext = fetchUpNext({ api: upNextClient, username: 'me', settings: custom.upNext });

function customScheduleDays(): ScheduleDay[] {
  const { timeZone } = data.datePreferences;
  const today = dayIn(new Date().toISOString(), timeZone);
  const start = scheduleStart(today, custom.schedule.startDay);
  // The fixture's finales, moved so the first lands yesterday.
  const rows = scheduleFixture.rows(dayIn(new Date(Date.now() - 4 * DAY).toISOString(), timeZone))
    .filter(({ episode, movie }) => movie || episode?.episode_type?.endsWith('finale'));
  return toScheduleDays({
    days: upcomingDays({ items: toCalendarItems(rows), start, timeZone, count: 5 }),
    today,
    datePreferences: data.datePreferences,
    offers: scheduleFixture.offers,
    country: 'us',
  });
}
const customSchedule = $derived(Promise.resolve(customScheduleDays()));
const hiddenNames = Object.entries({ Watchlist: custom.hidden.watchlist, 'Social Feed': custom.hidden.socialFeed })
  .flatMap(([name, hidden]) => (hidden ? [name] : []));
</script>

<Specimen title="Up Next" bleed
  note="Hover a progress bar for its exact ticks; each show skipped an episode halfway. Signed in, mark an episode watched to see its card offer the next one.">
  <div class="states">
    <Variant label="Shows to watch next">
      <UpNextPanel upNext={sample} username="me" settings={defaults.upNext} />
    </Variant>
    <Variant label="Last episodes watched: a show that ended, one coming back">
      <UpNextPanel upNext={caughtUpSample} username="me" settings={defaults.upNext} />
    </Variant>
    <Variant label="Empty: not started, with a way to start">
      <UpNextPanel upNext={empty} username="me" settings={defaults.upNext} />
    </Variant>
    <Variant label="Empty in welcome mode: starter picks instead">
      <UpNextPanel upNext={empty} username="me" settings={defaults.upNext} welcome />
    </Variant>
    <Variant label="Loading">
      <UpNextPanel upNext={loading} username="me" settings={defaults.upNext} />
    </Variant>
    <Variant label="Failed">
      <UpNextPanel upNext={failed} username="me" settings={defaults.upNext} />
    </Variant>
  </div>
</Specimen>

<Specimen title="Upcoming Schedule" bleed
  note="Hover an entry for its poster. The dropdowns reload the same sample, so nothing is saved.">
  <div class="states">
    {#each schedules as { label, schedule: days } (label)}
      <Variant {label}>
        <SchedulePanel schedule={days} filter={defaults.schedule.filter} movies={defaults.schedule.movies}
          onpick={() => days} />
      </Variant>
    {/each}
  </div>
</Specimen>

<Specimen title="Watchlist" bleed note="The sort's name and direction come from the viewer's saved list sort.">
  <div class="states">
    <Variant label="Added Date, newest first">
      <WatchlistPanel {watchlist} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Trakt Percentage">
      <WatchlistPanel watchlist={watchlistRated} username="me"
        datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Empty: not started, with a way to start">
      <WatchlistPanel watchlist={watchlistEmpty} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Empty in welcome mode: starter picks instead">
      <WatchlistPanel watchlist={watchlistEmpty} username="me" datePreferences={data.datePreferences} welcome />
    </Variant>
    <Variant label="Loading">
      <WatchlistPanel watchlist={watchlistLoading} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Failed">
      <WatchlistPanel watchlist={watchlistFailed} username="me" datePreferences={data.datePreferences} />
    </Variant>
  </div>
</Specimen>

<Specimen title="Last 30 Days" bleed
  note="Hover a day's bar for what was watched. With nothing watched it hides itself, as OG's did.">
  <div class="states">
    <Variant label="Plays and genres">
      <LastThirtyDaysPanel stats={lastMonth} />
    </Variant>
    <Variant label="Genres alone, as OG showed them without the chart">
      <LastThirtyDaysPanel stats={genresOnly} />
    </Variant>
    <Variant label="Loading">
      <LastThirtyDaysPanel stats={lastMonthLoading} />
    </Variant>
    <Variant label="Failed">
      <LastThirtyDaysPanel stats={lastMonthFailed} />
    </Variant>
  </div>
</Specimen>

<Specimen title="Recently Watched" bleed
  note="A check-in shows at its end time, so the first play is 30 minutes ahead.">
  <div class="states">
    <Variant label="With a check-in">
      <RecentlyWatchedPanel plays={recentPlays} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Empty: not started, with a way to start">
      <RecentlyWatchedPanel plays={Promise.resolve([])} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Empty in welcome mode: starter picks instead">
      <RecentlyWatchedPanel plays={Promise.resolve([])} username="me" datePreferences={data.datePreferences}
        welcome />
    </Variant>
    <Variant label="Loading">
      <RecentlyWatchedPanel plays={recentLoading} username="me" datePreferences={data.datePreferences} />
    </Variant>
    <Variant label="Failed">
      <RecentlyWatchedPanel plays={recentFailed} username="me" datePreferences={data.datePreferences} />
    </Variant>
  </div>
</Specimen>

<Specimen title="Social Feed" bleed note="Seven watching puts four behind the +4 tile. Page back for earlier days.">
  <div class="states">
    {#each socials as { label, feed, live, welcome } (label)}
      <Variant {label}>
        <SocialFeedPanel {feed} watching={watchingNow(live)} rowsFor={socialRowsFor} username="me"
          datePreferences={data.datePreferences} {welcome} />
      </Variant>
    {/each}
  </div>
</Specimen>

<Specimen title="Recommendations" bleed note="The Type dropdown switches between shows, movies or both.">
  <div class="states">
    {#each recommendations as { label, recs, type } (label)}
      <Variant {label}>
        <RecommendationsPanel recommendations={recs} {type} onpick={recsFor} />
      </Variant>
    {/each}
  </div>
</Specimen>

<Specimen title="With dashboard settings" bleed
  note="A VIP's saved settings: Up Next by completion % with only favorites, and the schedule's finales from yesterday.">
  <p class="hidden-note">The {hiddenNames.join(' and ')} panels are hidden, so they're left out.</p>
  <div class="states">
    <UpNextPanel upNext={customUpNext} username="me" settings={custom.upNext} />
    <SchedulePanel schedule={customSchedule} filter={custom.schedule.filter} movies={custom.schedule.movies}
      onpick={() => customSchedule} />
    {#if !custom.hidden.watchlist}
      <WatchlistPanel {watchlist} username="me" datePreferences={data.datePreferences} />
    {/if}
    {#if !custom.hidden.socialFeed}
      <SocialFeedPanel feed={social} watching={watchingNow(0)} rowsFor={socialRowsFor} username="me"
        datePreferences={data.datePreferences} />
    {/if}
    <RecentlyWatchedPanel plays={recentPlays} username="me" datePreferences={data.datePreferences} />
  </div>
</Specimen>

<style>
/* Room for the pill that hangs under each panel, and captions lined up with the canvas. */
.states {
  display: grid;
  gap: calc(var(--gutter) * 2);
  padding-block: var(--gutter) calc(var(--gutter) * 2);

  & :global(figcaption) {
    padding-inline: var(--design-canvas-padding);
  }
}

.hidden-note {
  margin: 0;
  padding: var(--gutter) var(--design-canvas-padding) 0;
  color: var(--color-text-muted);
}
</style>
