import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import { readFadeHide } from '../components/filters/readFadeHide.ts';
import type { Cookies } from '@sveltejs/kit';
import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { seasonPeopleSchema } from './seasonPeopleSchema.ts';
import { toSeasonSummary } from './toSeasonSummary.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { assertOk } from '../api/assertOk.ts';

interface Params {
  fetch: typeof fetch;
  id: string;
  season: string;
  url: URL;
  cookies?: Cookies;
  parent: () => Promise<{ user: HeaderUser | null; settings: ViewerSettings | null; datePreferences: DatePreferences }>;
}

/** Public season reads never carry the cookie token. The layout data and all reads start together. */
export async function loadSeason({ fetch, parent, id, season: requestedSeason, url, cookies }: Params) {
  if (!/^\d+$/.test(requestedSeason)) error(404, 'Season not found');
  const season = Number(requestedSeason);
  if (!Number.isSafeInteger(season)) error(404, 'Season not found');
  const client = api({ fetch });
  const params = { id, season };
  const layoutRead = parent();
  const seasonPath = `/shows/${encodeURIComponent(id)}/seasons/${season}`;
  // Like the show's: the season's offers, or its first episode's when it has none.
  const watchNowRead = layoutRead.then((layout) =>
    loadWatchNow({
      fetch,
      path: seasonPath,
      fallback: `${seasonPath}/episodes/1`,
      country: watchNowCountry(layout.settings),
      settings: layout.settings,
      isVip: layout.user?.isVip ?? false,
    }),
  );
  const [
    showResponse,
    seasonResponse,
    episodesResponse,
    seasonsResponse,
    ratingsResponse,
    statsResponse,
    peopleResponse,
    layout,
    watchNow,
  ] = await Promise.all([
    client.shows.summary({ params: { id }, query: { extended: 'full,images' } }),
    client.shows.season.info({ params, query: { extended: 'full,images' } }),
    client.shows.season.episodes({ params, query: { extended: 'full,images' } }),
    client.shows.seasons({ params: { id }, query: {} }),
    client.shows.season.ratings({ params, query: {} }),
    client.shows.season.stats({ params }),
    rawApiFetch({
      fetch,
      path: `/shows/${encodeURIComponent(id)}/seasons/${season}/people?extended=guest_stars,images`,
    }),
    layoutRead,
    watchNowRead,
  ]);
  assertOk(showResponse, 'Show');
  // A season the show doesn't have answers an empty 204, not a 404.
  if (seasonResponse.status === 204) error(404, 'Season not found');
  assertOk(seasonResponse, 'Season');
  const show = showResponse.body;
  const info = seasonResponse.body;
  if (id !== show.ids.slug || requestedSeason !== `${season}`) {
    redirect(301, `/shows/${show.ids.slug}/seasons/${season}${url.search}`);
  }
  if (!peopleResponse.ok) error(502, 'The Trakt API could not load the season cast.');
  const people = seasonPeopleSchema.safeParse(await peopleResponse.json().catch(() => null));
  if (!people.success) error(502, 'The Trakt API returned invalid season cast data.');
  assertOk(seasonsResponse, 'Seasons');
  assertOk(episodesResponse, 'Episodes');
  assertOk(ratingsResponse, 'Ratings');
  assertOk(statsResponse, 'Stats');
  const view = toSeasonSummary({
    show,
    season: info,
    seasons: seasonsResponse.body,
    episodes: episodesResponse.body,
    ratings: ratingsResponse.body,
    stats: statsResponse.body,
    people: people.data,
    justwatch: watchNow.rank?.link,
    isVip: layout.user?.isVip ?? false,
    actorSpoilers: layout.settings?.browsing?.spoilers?.actors !== 'hide',
    episodeTypeTags: !layout.settings?.browsing?.hide_episode_type_tags,
    datePreferences: layout.datePreferences,
    now: new Date(),
  });
  return {
    season: view,
    watchNow: watchNow.button,
    user: layout.user,
    datePreferences: layout.datePreferences,
    filters: readFadeHide({ cookies, search: url.searchParams, scope: 'season' }),
    terms: url.searchParams.get('terms') ?? '',
    sort: url.searchParams.get('sort') ?? 'number,asc',
  };
}
