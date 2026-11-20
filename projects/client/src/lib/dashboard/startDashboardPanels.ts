import { api } from '../api/api.ts';
import { cachedOnActivity } from '../activity/cachedOnActivity.ts';
import type { ReadLastActivities } from '../activity/createLastActivities.ts';
import { isStandardApi } from '../api/isStandardApi.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import type { DashboardSettings } from './DashboardSettings.ts';
import { fetchLastThirtyDays } from './fetchLastThirtyDays.ts';
import { fetchPinnedList, type PinnedList } from './fetchPinnedList.ts';
import { type PinKey, pinKey } from './listPins.ts';
import { fetchRecapRibbon } from './fetchRecapRibbon.ts';
import { fetchRecentlyWatched } from './fetchRecentlyWatched.ts';
import { fetchRecommendations } from './fetchRecommendations.ts';
import { fetchSchedule } from './fetchSchedule.ts';
import { fetchSocialFeed } from './fetchSocialFeed.ts';
import { fetchUpNext } from './fetchUpNext.ts';
import { fetchWatchlist } from './fetchWatchlist.ts';
import { dailyKey, recentlyWatchedKey, upNextKey, watchlistKey } from './panelCacheKeys.ts';

const HOUR_MS = 60 * 60 * 1000;
// New episodes airing move a show into or out of Up Next without any activity of yours.
const UP_NEXT_MAX_AGE_MS = 3 * HOUR_MS;
const MAX_AGE_MS = 24 * HOUR_MS;

type Params = {
  fetch: typeof fetch;
  slug: string;
  dashboard: DashboardSettings;
  datePreferences: DatePreferences;
  settings: ViewerSettings | null;
  /** How many members the viewer follows, when the API's stats had it. */
  following: number | null;
  /** While the welcome wall shows, it stands in for the recaps. */
  welcome: boolean;
  activities: ReadLastActivities;
  /** A saved panel shows at once; when your activity has moved since, its fresh read arrives here. */
  onUpdate: (panels: Partial<DashboardPanels>) => void;
  now: Date;
};

/** What the server renders, and the browser until its reads start: a panel's placeholder, which never resolves. */
export const PENDING = new Promise<never>(() => {});

const unless = <T>(hidden: boolean, load: () => Promise<T>) => (hidden ? null : load());

/** Each pinned list's read by its key, null for a hidden one. */
const eachPin = (
  pins: DashboardSettings['pins'],
  load: (pin: DashboardSettings['pins'][number]) => Promise<PinnedList>,
): DashboardPanels['pinned'] =>
  Object.fromEntries(pins.map((pin) => [pinKey(pin), unless(!!pin.hidden, () => load(pin))]));

/** The feed backs Watching Now and Hot in Your Network too, so it's off only when all three are, or for a Standard app,
 * whose client may not read it. */
const socialOff = ({ socialFeed, watchingNow, hotInNetwork }: DashboardSettings['hidden']) =>
  (socialFeed && watchingNow && hotInNetwork) || isStandardApi();

/**
 * Starts every visible panel's read, from the browser with the viewer's own token. Up Next, Recently Watched, Last 30
 * Days, the recaps and the watchlist show their saved read at once, then check `last_activities` and hand a fresh read to
 * `onUpdate` if your activity moved; the Social Feed, the schedule and the recommendations depend on other people or
 * the calendar, and pinned lists change under their owners, so they always read. A hidden panel comes back null and makes no request.
 */
export function startDashboardPanels({
  fetch,
  slug,
  dashboard,
  datePreferences,
  settings,
  following,
  welcome,
  activities,
  onUpdate,
  now,
}: Params): DashboardPanels {
  const { hidden } = dashboard;
  const client = api({ fetch });
  const cached = <K extends CachedPanel>(
    panel: K,
    name: string,
    maxAgeMs: number,
    key: Parameters<typeof cachedOnActivity>[0]['key'],
    read: () => Promise<Awaited<NonNullable<DashboardPanels[K]>>>,
  ) =>
    cachedOnActivity({
      name: `dashboard-${name}`,
      activities,
      user: slug,
      key,
      read,
      maxAgeMs,
      onUpdate: (value) => onUpdate({ [panel]: Promise.resolve(value) } as Partial<DashboardPanels>),
    });

  return {
    recaps: welcome
      ? null
      : cached(
          'recaps',
          'recaps',
          MAX_AGE_MS,
          (latest) => dailyKey(latest, datePreferences, now),
          () => fetchRecapRibbon({ client, slug, timeZone: datePreferences.timeZone, now }),
        ),
    upNext: unless(hidden.upNext, () =>
      cached(
        'upNext',
        'up-next',
        UP_NEXT_MAX_AGE_MS,
        (latest) => upNextKey(latest, dashboard.upNext),
        () => fetchUpNext({ api: client, username: slug, settings: dashboard.upNext, fetch }),
      ),
    ),
    schedule: unless(hidden.schedule, () =>
      fetchSchedule({ fetch, token: null, settings, datePreferences, schedule: dashboard.schedule, now }),
    ),
    // A watchlist read whole for its hides is too big to keep, so it reads fresh.
    watchlist: unless(hidden.watchlist, () =>
      dashboard.watchlist.hide.length > 0
        ? fetchWatchlist({ fetch, token: null, datePreferences, ...dashboard.watchlist })
        : cached(
            'watchlist',
            'watchlist',
            MAX_AGE_MS,
            (latest) => [watchlistKey(latest, datePreferences), dashboard.watchlist.sort],
            () => fetchWatchlist({ fetch, token: null, datePreferences, sort: dashboard.watchlist.sort }),
          ),
    ),
    lastThirtyDays: unless(hidden.lastThirtyDays, () =>
      cached(
        'lastThirtyDays',
        'last-thirty-days',
        MAX_AGE_MS,
        (latest) => dailyKey(latest, datePreferences, now),
        () =>
          fetchLastThirtyDays({
            fetch,
            token: null,
            slug,
            timeZone: datePreferences.timeZone,
            weekStartDay: datePreferences.weekStartDay,
            now,
          }),
      ),
    ),
    recentlyWatched: unless(hidden.recentlyWatched, () =>
      cached(
        'recentlyWatched',
        'recently-watched',
        MAX_AGE_MS,
        (latest) => recentlyWatchedKey(latest, datePreferences),
        () => fetchRecentlyWatched({ fetch, token: null, datePreferences }),
      ),
    ),
    socialFeed: unless(socialOff(hidden), () =>
      fetchSocialFeed({ fetch, token: null, following: Promise.resolve(following), now, datePreferences }),
    ),
    recommendations: unless(hidden.recommendations, () =>
      fetchRecommendations({ fetch, token: null, settings: dashboard.recommendations, now }),
    ),
    pinned: eachPin(dashboard.pins, (pin) => fetchPinnedList({ fetch, pin, datePreferences })),
  };
}

/** Every visible panel still waiting, so the server renders each placeholder and the browser hydrates the same. */
export const pendingDashboardPanels = ({
  dashboard: { hidden, pins },
  welcome,
}: Pick<Params, 'dashboard' | 'welcome'>): DashboardPanels => ({
  recaps: welcome ? null : PENDING,
  upNext: unless(hidden.upNext, () => PENDING),
  schedule: unless(hidden.schedule, () => PENDING),
  watchlist: unless(hidden.watchlist, () => PENDING),
  lastThirtyDays: unless(hidden.lastThirtyDays, () => PENDING),
  recentlyWatched: unless(hidden.recentlyWatched, () => PENDING),
  socialFeed: unless(socialOff(hidden), () => PENDING),
  recommendations: unless(hidden.recommendations, () => PENDING),
  pinned: eachPin(pins, () => PENDING),
});

/** The panels' promises, each null for a hidden panel. */
export type DashboardPanels = {
  recaps: ReturnType<typeof fetchRecapRibbon> | null;
  upNext: ReturnType<typeof fetchUpNext> | null;
  schedule: ReturnType<typeof fetchSchedule> | null;
  watchlist: ReturnType<typeof fetchWatchlist> | null;
  lastThirtyDays: ReturnType<typeof fetchLastThirtyDays> | null;
  recentlyWatched: ReturnType<typeof fetchRecentlyWatched> | null;
  socialFeed: ReturnType<typeof fetchSocialFeed> | null;
  recommendations: ReturnType<typeof fetchRecommendations> | null;
  /** Each pinned list's read, by its key. */
  pinned: Readonly<Record<PinKey, Promise<PinnedList> | null>>;
};

type CachedPanel = 'recaps' | 'upNext' | 'watchlist' | 'lastThirtyDays' | 'recentlyWatched';
