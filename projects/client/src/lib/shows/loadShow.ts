import { fetchParentalGuide } from '../parental/fetchParentalGuide.ts';
import { episodeResponseSchema, peopleResponseSchema } from '@trakt/api';
import type { EpisodeResponse, PeopleResponse } from '@trakt/api';
import { readFadeHide } from '../components/filters/readFadeHide.ts';
import type { Cookies } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { toRelatedSource } from '../summary/toRelatedSource.ts';
import { toShowEpisodes } from './toShowEpisodes.ts';
import { toShowSummary } from './toShowSummary.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { okBody } from '../api/okBody.ts';
import { contractSchema } from '../api/contractSchema.ts';
import { type Season, seasonSchema } from './seasonSchema.ts';

type LoadShowParams = {
  fetch: typeof fetch;
  /** Only for the parental guide, the one call here that needs the viewer. */
  token: string | null;
  parent: () => Promise<{
    settings: ViewerSettings | null;
    user: HeaderUser | null;
    datePreferences: DatePreferences;
  }>;
  id: string;
  /** The subpage under the show, e.g. `/seasons`, kept on the canonical redirect. */
  path?: string;
  /** The summary's title badge reads the parental guide; the every-episode page has no badge. */
  guide?: boolean;
  cookies?: Cookies;
  url?: URL;
};

/** `extended=episodes` adds each season's episodes, which `@trakt/api` doesn't type. */
export type SeasonWithEpisodes = Season & { episodes?: readonly EpisodeResponse[] };
/** `extended=guest_stars` adds the guest stars, which `@trakt/api` doesn't type. */
export type ShowPeople = PeopleResponse & { guest_stars?: PeopleResponse['cast'] };

// The published schemas use zod 3. Wrap their parsers in zod 4 at this off-contract boundary, retaining the
// extended fields (`episodes` and `guest_stars`) that the base contract would strip.
const seasonsBody = seasonSchema.extend({ episodes: episodeResponseSchema.array().optional() }).array();
const peopleBody = peopleResponseSchema.extend({ guest_stars: peopleResponseSchema.shape.cast });

const raw = async <T>(
  fetch: typeof globalThis.fetch,
  path: string,
  schema: {
    safeParse: (input: unknown) => { success: true; data: T } | { success: false };
  },
): Promise<T | null> => {
  const response = await rawApiFetch({ fetch, path }).catch(() => null);
  if (!response?.ok) return null;
  const body = contractSchema(schema).safeParse(await response.json().catch(() => null));
  return body.success ? body.data : null;
};

/**
 * Loads a show page for SSR (`/shows/:id` and its seasons subpages): the summary, the layout data and everything else in
 * parallel, with the 404 and canonical redirect checked before the rest is used. One seasons call with `extended=episodes` fills both the seasons grid and Recently Aired, so the
 * proxied `/next_episode` and `/last_episode` aren't needed. The viewer's progress (Up Next) and private note are read in the browser, so a signed-in
 * page costs the Worker what a signed-out one does.
 */
export async function loadShowData({ fetch, token, parent, id: requested, path = '', guide = true }: LoadShowParams) {
  const client = api({ fetch });
  const summaryRead = client.shows.summary({ params: { id: requested }, query: { extended: 'full' } });
  const layout = parent();
  // The extras go by the requested id alongside the summary, not after it; a non-canonical id redirects before they're
  // used. Each resolves to null on failure, and the catch only stops a failed summary leaving them unhandled.
  const id = requested;
  const extras = Promise.all([
    okBody(client.shows.ratings({ params: { id }, query: { extended: 'all' } })),
    okBody(client.shows.stats({ params: { id } })),
    raw(fetch, `/shows/${id}/people?extended=guest_stars`, peopleBody),
    okBody(client.shows.studios({ params: { id } })),
    // ponytail: every episode of every season in one response (~1KB each). Split per season if long runners get slow.
    raw(fetch, `/shows/${id}/seasons?extended=full,episodes`, seasonsBody),
    layout.then(({ settings }) =>
      loadWatchNow({
        fetch,
        path: `/shows/${id}`,
        fallback: `/shows/${id}/seasons/1/episodes/1`,
        country: watchNowCountry(settings),
        settings,
      }),
    ),
    guide ? layout.then(({ user }) => fetchParentalGuide({ fetch, token: user ? token : null, type: 'show', id })) : [],
  ]);
  extras.catch(() => {});

  const [summary, { settings, user, datePreferences }] = await Promise.all([summaryRead, layout]);
  assertOk(summary, 'Show');

  const show = summary.body;
  if (requested !== show.ids.slug) redirect(301, `/shows/${show.ids.slug}${path}`);
  const notable = { type: 'show', id: show.ids.trakt, slug: show.ids.slug } as const;

  const [ratings, stats, people, studios, seasons, watchnow, parentalGuide] = await extras;

  const episodeTypeTags = !settings?.browsing?.hide_episode_type_tags;
  const view = toShowSummary({
    show,
    ratings,
    stats,
    people,
    studios: studios ?? [],
    seasons: seasons ?? [],
    signedIn: user !== null,
    rank: watchnow.rank,
    otherSiteRatings: settings?.browsing?.other_site_ratings ?? true,
    actorSpoilers: settings?.browsing?.spoilers?.actors !== 'hide',
    episodeTypeTags,
    datePreferences,
    now: new Date(),
  });
  return {
    raw: show,
    relatedSource: toRelatedSource({ subgenres: show.subgenres, genres: show.genres, people }),
    seasons: seasons ?? [],
    signedIn: user !== null,
    episodeTypeTags,
    datePreferences,
    summary: view,
    watchNow: watchnow.button,
    parentalGuide,
    privateNotes: {
      item: { ...notable, title: show.title, year: show.year, fanart: view.fanart },
      signedIn: user !== null,
      datePreferences,
    },
  };
}

/** `/shows/:id` and `/shows/:id/seasons`: the summary and its Watch Now block. */
export async function loadShow(params: LoadShowParams) {
  const { summary, watchNow, privateNotes, signedIn, relatedSource, parentalGuide } = await loadShowData(params);
  return {
    show: summary,
    parentalGuide,
    relatedSource,
    watchNow,
    privateNotes,
    signedIn,
    filters: readFadeHide({ cookies: params.cookies, scope: 'show' }),
  };
}

/** `/shows/:id/seasons/all`: the summary plus every episode. */
export async function loadShowEpisodes(params: LoadShowParams) {
  const { raw, seasons, signedIn, episodeTypeTags, datePreferences, summary, watchNow, privateNotes } =
    await loadShowData({ ...params, guide: false });
  return {
    show: summary,
    watchNow,
    privateNotes,
    signedIn,
    filters: readFadeHide({ cookies: params.cookies, search: params.url?.searchParams, scope: 'season' }),
    terms: params.url?.searchParams.get('terms') ?? '',
    sort: params.url?.searchParams.get('sort') ?? 'aired,asc',
    episodes: toShowEpisodes({ show: raw, seasons, signedIn, episodeTypeTags, datePreferences, now: new Date() }),
  };
}
