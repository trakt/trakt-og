import { z } from 'zod/v4';
import { isPinKey, type ListPin, listPinsSchema, MAX_LIST_PINS, type PinKey, pinKey } from './listPins.ts';

const START_DAYS = [
  'today',
  'yesterday',
  'two_days_ago',
  'three_days_ago',
  'tomorrow',
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/** The dashboard's movable panels, in OG's order. The greeting, recaps and inbox always come first. */
const PANELS = [
  'upNext',
  'schedule',
  'watchlist',
  'lastThirtyDays',
  'recentlyWatched',
  'watchingNow',
  'hotInNetwork',
  'socialFeed',
  'recommendations',
] as const;

export type DashboardPanel = (typeof PANELS)[number];

/** A place in the dashboard's order: a built-in panel or a pinned list. */
export type DashboardSection = DashboardPanel | PinKey;

/** Each panel's hide switch: OG's `dashboard_hide_*` column, or og's own for the panels split out of the feed. */
const HIDE_KEYS = {
  upNext: 'hide_on_deck',
  schedule: 'hide_upcoming',
  watchlist: 'hide_list',
  lastThirtyDays: 'hide_stats',
  recentlyWatched: 'hide_recently_watched',
  watchingNow: 'hide_watching_now',
  hotInNetwork: 'hide_hot_in_network',
  socialFeed: 'hide_network',
  recommendations: 'hide_recommendations',
} as const satisfies Record<DashboardPanel, string>;

const isPanel = (name: string): name is DashboardPanel => (PANELS as readonly string[]).includes(name);

// The saved panels and pins, each once. A panel it leaves out, like one og adds later, goes right after the one it
// follows in OG's order; a pin it leaves out goes first.
const toOrder = (saved: readonly string[], pins: readonly ListPin[]): DashboardSection[] => {
  const pinned = pins.map(pinKey);
  const known = [...new Set(saved)].filter(
    (section): section is DashboardSection => isPanel(section) || (isPinKey(section) && pinned.includes(section)),
  );
  const withPanels = PANELS.reduce<DashboardSection[]>((order, panel, index) => {
    if (order.includes(panel)) return order;
    const at = index === 0 ? 0 : order.indexOf(PANELS[index - 1] as DashboardPanel) + 1;
    return [...order.slice(0, at), panel, ...order.slice(at)];
  }, known);
  return [...pinned.filter((key) => !withPanels.includes(key)), ...withPanels];
};

// Each field is OG's `dashboard_*` user column without the prefix, with OG's default when it's missing or unreadable.
const prefsSchema = z
  .object({
    on_deck_poster: z.enum(['show', 'season']).catch('show'),
    /** `shows-movies` is what OG used before the form was ever saved; the form offers the other four. og adds `none`,
     * for a schedule of movies alone. */
    upcoming_filter: z
      .enum(['shows-movies', 'shows', 'premieres', 'new-shows', 'finales', 'none'])
      .catch('shows-movies'),
    /** og's own: whether the watchlist's movies come alongside the shows, as they always did in OG. */
    upcoming_movies: z.enum(['all', 'none']).catch('all'),
    upcoming_start_day: z.enum(START_DAYS).catch('today'),
    upcoming_poster: z.enum(['show', 'season']).catch('show'),
    /** og's own: which recommendations the panel shows, picked from its Type dropdown. */
    recommendations_type: z.enum(['media', 'show', 'movie']).catch('media'),
    /** og's own: out now or coming soon, picked from its Release dropdown. */
    recommendations_release: z.enum(['out_now', 'coming_soon']).catch('out_now'),
    hide_on_deck: z.boolean().catch(false),
    hide_upcoming: z.boolean().catch(false),
    hide_list: z.boolean().catch(false),
    hide_suggested_people: z.boolean().catch(false),
    hide_stats: z.boolean().catch(false),
    hide_recently_watched: z.boolean().catch(false),
    hide_network: z.boolean().catch(false),
    /** og's own: Watching Now and Hot in Your Network, once part of OG's network section. */
    hide_watching_now: z.boolean().catch(false),
    hide_hot_in_network: z.boolean().catch(false),
    hide_recommendations: z.boolean().catch(false),
    /** og's own: the panels and pinned lists in the viewer's order. */
    order: z.array(z.string()).catch([]),
    /** og's own: the sort picked on the Watchlist panel. Null, the watchlist's own. */
    watchlist_sort: z
      .object({ by: z.string(), how: z.enum(['asc', 'desc']) })
      .nullable()
      .catch(null),
    /** og's own: the eye's Hide options picked on the Watchlist panel. */
    watchlist_hide: z.array(z.string()).catch([]),
    /** og's own: the lists pinned to the dashboard, newest first. */
    pins: listPinsSchema,
    /** og's own: the new member closed the welcome wall. */
    hide_first_night: z.boolean().catch(false),
  })
  .transform((prefs) => ({ ...prefs, order: toOrder(prefs.order, prefs.pins) }));

/** The dashboard settings with no `/users/settings` field. */
export type DashboardPrefs = z.infer<typeof prefsSchema>;

/** Every signed-in member on this browser, by slug. */
const cookieSchema = z.record(z.string(), z.unknown());

const COOKIE = 'og-dashboard';
/** Browsers cap a cookie's lifetime at 400 days. */
const MAX_AGE = 400 * 86_400;

function members(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = cookieSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

function read(value: string | undefined, slug: string): DashboardPrefs {
  return prefsSchema.parse(members(value)[slug] ?? {});
}

// Only what differs from OG's defaults is kept, so the cookie stays small.
function changed(prefs: DashboardPrefs): Partial<DashboardPrefs> {
  const defaults = read(undefined, '');
  return Object.fromEntries(
    Object.entries(prefs).filter(
      ([key, value]) => JSON.stringify(defaults[key as keyof DashboardPrefs]) !== JSON.stringify(value),
    ),
  );
}

/** The sections' order, the panels' hide switches and the pinned lists, which carry their own. */
export type DashboardLayout = {
  order: readonly DashboardSection[];
  hidden: Readonly<Record<DashboardPanel, boolean>>;
  pins: readonly ListPin[];
};

/** The prefs with the layout replaced. */
function withLayout(prefs: DashboardPrefs, { order, hidden, pins }: DashboardLayout): DashboardPrefs {
  const switches = Object.fromEntries(PANELS.map((panel) => [HIDE_KEYS[panel], hidden[panel]]));
  return { ...prefs, ...switches, pins: [...pins], order: toOrder(order, pins) };
}

/** The layout with its order made whole: every panel and pin once. */
const arrange = (layout: DashboardLayout): DashboardLayout => ({
  ...layout,
  order: toOrder(layout.order, layout.pins),
});

/** Whether the section shows: a panel's switch, or a pin's own. */
function isShown({ hidden, pins }: Pick<DashboardLayout, 'hidden' | 'pins'>, section: DashboardSection): boolean {
  if (!isPinKey(section)) return !hidden[section];
  const pin = pins.find((entry) => pinKey(entry) === section);
  return Boolean(pin && !pin.hidden);
}

/** The layout with the list pinned first, or its name and owner refreshed if it's already pinned. Null at the cap. */
function pin(layout: DashboardLayout, list: ListPin): DashboardLayout | null {
  const key = pinKey(list);
  const existing = layout.pins.find((entry) => pinKey(entry) === key);
  if (existing) {
    const pins = layout.pins.map((entry) => (entry === existing ? { ...existing, ...list } : entry));
    return { ...layout, pins };
  }
  if (layout.pins.length >= MAX_LIST_PINS) return null;
  const pins = [list, ...layout.pins];
  return { ...layout, pins, order: toOrder([key, ...layout.order], pins) };
}

/** The layout without the pin. */
function unpin(layout: DashboardLayout, key: PinKey): DashboardLayout {
  const pins = layout.pins.filter((entry) => pinKey(entry) !== key);
  return { ...layout, pins, order: layout.order.filter((section) => section !== key) };
}

const layoutOf = ({ order, pins, ...prefs }: DashboardPrefs): DashboardLayout => ({
  order,
  pins,
  hidden: Object.fromEntries(PANELS.map((panel) => [panel, prefs[HIDE_KEYS[panel]]])) as DashboardLayout['hidden'],
});

function write(value: string | undefined, slug: string, prefs: DashboardPrefs): string {
  const { [slug]: _, ...others } = members(value);
  const own = changed(prefs);
  return JSON.stringify(Object.keys(own).length > 0 ? { ...others, [slug]: own } : others);
}

function browserCookie(): string | undefined {
  const entry = document.cookie.split('; ').find((pair) => pair.startsWith(`${COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(COOKIE.length + 1)) : undefined;
}

/**
 * The per-browser store for the dashboard settings the API can't hold. It's one cookie, so the server reads it for the
 * panels it loads and the settings form writes it in the browser. The value is JSON of each member's changed
 * fields, `{"<slug>": {"upcoming_filter": "premieres", "hide_list": true}}`.
 */
export const dashboardPrefs = {
  COOKIE,
  START_DAYS,
  PANELS,
  HIDE_KEYS,
  defaults: read(undefined, ''),
  /** The member's prefs from the cookie's (decoded) value, with OG's defaults for anything unset. */
  read,
  /** The cookie's next value with the member's prefs replaced, keeping everyone else's. */
  write,
  withLayout,
  layoutOf,
  arrange,
  isShown,
  pin,
  unpin,
  /** In the browser: save the member's prefs. */
  save(slug: string, prefs: DashboardPrefs): void {
    const next = write(browserCookie(), slug, prefs);
    const secure = location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${COOKIE}=${encodeURIComponent(next)}; path=/; samesite=lax; max-age=${MAX_AGE}${secure}`;
  },
  /** In the browser: the member's prefs as saved. */
  load(slug: string): DashboardPrefs {
    return read(browserCookie(), slug);
  },
};
