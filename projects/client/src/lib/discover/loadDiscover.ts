import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { api } from '../api/api.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { dayIn } from '../calendars/calendarDays.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { chartHref } from './chartHref.ts';
import { DISCOVER_MOODS, type DiscoverMood } from './discoverMoods.ts';
import { DISCOVER_THEMES, type DiscoverTheme, type ThemeFilter } from './discoverThemes.ts';
import { featuredLists } from './featuredLists.ts';
import { listRowsSchema } from './listRowsSchema.ts';
import { listSchema } from './listSchema.ts';
import { seasonRibbon } from './seasonRibbon.ts';
import { themeFor } from './themeFor.ts';
import { type ThemeMedia, themeRowsSchema } from './themeRowsSchema.ts';
import type { ThemeList } from './ThemeList.ts';
import { toEssentialList } from './toEssentialList.ts';
import { toListCard } from './toListCard.ts';
import type { MoodShelf } from './MoodShelf.ts';
import { toPosterItem } from './toPosterItem.ts';
import { toPremieres } from './toPremieres.ts';
import { fetchTrendingComments } from './fetchTrendingComments.ts';
import { toSeasonPicks } from './toSeasonPicks.ts';

type LoadDiscoverParams = {
  fetch: typeof fetch;
  parent: () => Promise<{ datePreferences: DatePreferences }>;
  now?: Date;
};

type Chart = 'trending' | 'favorited/all' | 'watched/weekly';

// A shelf fills one row of six poster cards.
const SHELF = 6;
// The hot premieres feed's window, and how far ahead an anticipated new series still counts as upcoming.
const PREMIERE_DAYS = 60;
const ANTICIPATED_DAYS = 90;
const DAY_MS = 86_400_000;
const searchRowsSchema = z.array(z.object({ list: listSchema }));

/** A raw API body parsed by `schema`, or `fallback` when the call or the parse fails: its section just hides. */
async function rawBody<T>(fetcher: typeof fetch, path: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const response = await rawApiFetch({ fetch: fetcher, path }).catch(() => null);
  if (!response?.ok) return fallback;
  const parsed = schema.safeParse(await response.json().catch(() => null));
  return parsed.success ? parsed.data : fallback;
}

/** One chart's shows or movies with a filter. */
async function media(fetcher: typeof fetch, type: 'movie' | 'show', chart: Chart, filter: ThemeFilter | undefined) {
  if (!filter) return [];
  const query = new URLSearchParams({ extended: 'full,images', limit: '20', ...filter });
  const rows = await rawBody(fetcher, `/${type}s/${chart}?${query}`, themeRowsSchema, []);
  return rows.flatMap((row): ThemeMedia[] => (row[type] ? [row[type]] : []));
}

type MediaType = 'movie' | 'show';

/**
 * The theme's trending and all-time favorite movies and shows; a theme without shows asks for none. The hero mixes
 * both types; the season's mood chip has a shelf of each.
 */
async function seasonPicks(fetcher: typeof fetch, theme: DiscoverTheme, now: Date) {
  const [trendingMovies, trendingShows, favoriteMovies, favoriteShows] = await Promise.all([
    media(fetcher, 'movie', 'trending', theme.movie),
    media(fetcher, 'show', 'trending', theme.show),
    media(fetcher, 'movie', 'favorited/all', theme.movie),
    media(fetcher, 'show', 'favorited/all', theme.show),
  ]);
  const only = (type: MediaType) =>
    toSeasonPicks({
      trending: { movie: type === 'movie' ? trendingMovies : [], show: type === 'show' ? trendingShows : [] },
      favorites: { movie: type === 'movie' ? favoriteMovies : [], show: type === 'show' ? favoriteShows : [] },
      now,
      limit: SHELF,
    });
  return {
    hero: toSeasonPicks({
      trending: { movie: trendingMovies, show: trendingShows },
      favorites: { movie: favoriteMovies, show: favoriteShows },
      now,
    }),
    movie: only('movie'),
    show: only('show'),
  };
}

/** A year-round mood's shelf for one type, from its chart; none when the mood has no filter for it. */
async function moodShelf(fetcher: typeof fetch, mood: DiscoverMood, type: MediaType, now: Date): Promise<MoodShelf> {
  const chart = mood.chart ?? 'trending';
  const items = (await media(fetcher, type, chart, mood[type]))
    .map((item) => toPosterItem(item, type, now))
    .filter((item) => item.poster)
    .slice(0, SHELF);
  const filter = mood[type] ?? {};
  return {
    id: mood.id,
    label: type === 'show' ? mood.showLabel ?? mood.label : mood.label,
    more: chartHref(type, filter, chart),
    items,
  };
}

/** The essential lists' art, with each list's description, counts and posters; one that fails keeps its art. */
function essentials(fetcher: typeof fetch) {
  return Promise.all(
    featuredLists.map(async (tile) =>
      toEssentialList(tile, await rawBody(fetcher, `/lists/${tile.id}?extended=images`, listSchema.nullable(), null))
    ),
  );
}

/**
 * The month's lists: the community lists for the theme with at least eight items, with this week's likes and when
 * they last changed, for the section's sorts. The essentials have their own slices, so they're left out.
 */
async function themeLists(fetcher: typeof fetch, theme: DiscoverTheme) {
  const search = new URLSearchParams({ query: theme.listQuery, limit: '30', extended: 'images' });
  const [found, trending] = await Promise.all([
    rawBody(fetcher, `/search/list?${search}`, searchRowsSchema, []),
    rawBody(fetcher, '/lists/trending?limit=100', listRowsSchema, []),
  ]);
  const essentials = new Set(featuredLists.map(({ id }) => id));
  const weekLikes = new Map(trending.map(({ list, like_count }) => [list.ids.trakt, like_count ?? 0]));

  return found
    .map(({ list }): ThemeList => ({
      ...toListCard(list),
      weekLikes: weekLikes.get(list.ids.trakt) ?? 0,
      ...(list.updated_at && { updatedAt: list.updated_at }),
    }))
    .filter((card) => card.items >= 8 && !essentials.has(card.id));
}

/** The upcoming premieres. The typed feed and chart, read without a token; a failure leaves the section out. */
async function premieres(
  fetcher: typeof fetch,
  { today, now, timeZone }: { today: string; now: Date; timeZone: string },
) {
  const client = api({ fetch: fetcher });
  const [feed, anticipated] = await Promise.all([
    client.calendars.releasesHotPremieres({
      params: { start_date: today, days: PREMIERE_DAYS },
      query: { extended: 'full,images' },
    }).catch(() => null),
    client.shows.anticipated({ query: { extended: 'full,images', limit: 60 } }).catch(() => null),
  ]);
  if (feed?.status !== 200) return [];
  return toPremieres({
    premieres: feed.body,
    anticipated: anticipated?.status === 200 ? anticipated.body : [],
    now,
    until: new Date(now.getTime() + ANTICIPATED_DAYS * DAY_MS),
    timeZone,
  });
}

/**
 * Loads `/discover`, Seasons & Moods, for SSR. Today's theme comes from the month map in the viewer's time zone, so
 * the layout data comes first. Everything is public and goes without the viewer's token. These routes have no
 * `@trakt/api` contract with filters or images, so each is parsed here. The premieres use the typed client. Any
 * call failing only hides its part.
 */
export async function loadDiscover({ fetch, parent, now = new Date() }: LoadDiscoverParams) {
  const { datePreferences } = await parent();
  const today = dayIn(now.toISOString(), datePreferences.timeZone);
  const theme = themeFor(DISCOVER_THEMES, today);
  if (!theme) error(500, 'The month map has no theme for today.');

  const [picks, movieMoods, showMoods, staples, lists, comments, upcoming] = await Promise.all([
    seasonPicks(fetch, theme, now),
    Promise.all(DISCOVER_MOODS.map((mood) => moodShelf(fetch, mood, 'movie', now))),
    Promise.all(DISCOVER_MOODS.map((mood) => moodShelf(fetch, mood, 'show', now))),
    essentials(fetch),
    themeLists(fetch, theme),
    fetchTrendingComments({ fetch, kind: 'all', media: 'all', now }),
    premieres(fetch, { today, now, timeZone: datePreferences.timeZone }),
  ]);
  // Each type's moods, the season's first; moods with nothing for the type are left out.
  const shelves = (type: MediaType, moods: readonly MoodShelf[]): MoodShelf[] =>
    [
      {
        id: 'season',
        label: theme.title,
        more: chartHref(type, (type === 'movie' ? theme.movie : theme.show) ?? {}),
        items: picks[type],
      },
      ...moods,
    ].filter((shelf) => shelf.items.length > 0);

  return {
    theme: { id: theme.id, title: theme.title, blurb: theme.blurb },
    /** "October on Trakt". */
    eyebrow: `${
      new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${today}T00:00:00Z`))
    } on Trakt`,
    today,
    ribbon: seasonRibbon(DISCOVER_THEMES, today),
    picks: picks.hero,
    moods: { movie: shelves('movie', movieMoods), show: shelves('show', showMoods) },
    essentials: staples,
    lists,
    comments,
    premieres: upcoming,
  };
}
