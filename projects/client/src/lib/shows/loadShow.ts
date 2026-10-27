import { episodeResponseSchema, peopleResponseSchema, seasonResponseSchema } from '@trakt/api';
import type { EpisodeResponse, PeopleResponse, SeasonsResponse } from '@trakt/api';
import { readFadeHide } from '../components/filters/readFadeHide.ts';
import type { Cookies } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import { loadPrivateNote } from '../notes/loadPrivateNote.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { toRelatedSource } from '../summary/toRelatedSource.ts';
import { toShowEpisodes } from './toShowEpisodes.ts';
import { toShowSummary } from './toShowSummary.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { okBody } from '../api/okBody.ts';
import { contractSchema } from '../api/contractSchema.ts';

type LoadShowParams = {
  fetch: typeof fetch;
  /** Only for Up Next and the private note: the calls here that are about the viewer. */
  token: string | null;
  parent: () => Promise<{
    settings: ViewerSettings | null;
    user: HeaderUser | null;
    datePreferences: DatePreferences;
  }>;
  id: string;
  /** The subpage under the show, e.g. `/seasons`, kept on the canonical redirect. */
  path?: string;
  cookies?: Cookies;
  url?: URL;
};

/** `extended=episodes` adds each season's episodes, which `@trakt/api` doesn't type. */
export type SeasonWithEpisodes = SeasonsResponse[number] & { episodes?: readonly EpisodeResponse[] };
/** `extended=guest_stars` adds the guest stars, which `@trakt/api` doesn't type. */
export type ShowPeople = PeopleResponse & { guest_stars?: PeopleResponse['cast'] };

// The published schemas use zod 3. Wrap their parsers in zod 4 at this off-contract boundary, retaining the
// extended fields (`episodes` and `guest_stars`) that the base contract would strip.
const seasonsBody = seasonResponseSchema.extend({ episodes: episodeResponseSchema.array().optional() }).array();
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
 * proxied `/next_episode` and `/last_episode` aren't needed. Everything but Up Next and the private note is public and goes without the token.
 */
export async function loadShowData({ fetch, token, parent, id: requested, path = '' }: LoadShowParams) {
  const client = api({ fetch });
  const summaryRead = client.shows.summary({ params: { id: requested }, query: { extended: 'full,images' } });
  const layout = parent();
  // The extras go by the requested id alongside the summary, not after it; a non-canonical id redirects before they're
  // used. Each resolves to null on failure, and the catch only stops a failed summary leaving them unhandled.
  const id = requested;
  const extras = Promise.all([
    okBody(client.shows.ratings({ params: { id }, query: { extended: 'all' } })),
    okBody(client.shows.stats({ params: { id } })),
    raw(fetch, `/shows/${id}/people?extended=guest_stars,images`, peopleBody),
    okBody(client.shows.studios({ params: { id } })),
    // ponytail: every episode of every season in one response (~1KB each). Split per season if long runners get slow.
    raw(fetch, `/shows/${id}/seasons?extended=full,images,episodes`, seasonsBody),
    layout.then(({ settings }) =>
      loadWatchNow({
        fetch,
        path: `/shows/${id}`,
        fallback: `/shows/${id}/seasons/1/episodes/1`,
        country: watchNowCountry(settings),
        settings,
      }),
    ),
    // A stale token gets a 401 here, and the page renders Next Episode like a logged-out visit.
    token ? okBody(api({ fetch, token }).shows.progress.watched({ params: { id }, query: {} })) : null,
    Promise.all([summaryRead, layout]).then(([summary, { user }]) =>
      summary.status === 200
        ? loadPrivateNote({
            fetch,
            token: user ? token : null,
            item: { type: 'show', id: summary.body.ids.trakt, slug: summary.body.ids.slug } as const,
          })
        : null,
    ),
  ]);
  extras.catch(() => {});

  const [summary, { settings, user, datePreferences }] = await Promise.all([summaryRead, layout]);
  assertOk(summary, 'Show');

  const show = summary.body;
  if (requested !== show.ids.slug) redirect(301, `/shows/${show.ids.slug}${path}`);
  const notable = { type: 'show', id: show.ids.trakt, slug: show.ids.slug } as const;

  const [ratings, stats, people, studios, seasons, watchnow, progress, note] = await extras;

  const episodeTypeTags = !settings?.browsing?.hide_episode_type_tags;
  const view = toShowSummary({
    show,
    ratings,
    stats,
    people,
    studios: studios ?? [],
    seasons: seasons ?? [],
    progress: progress ? { next: progress.next_episode, last: progress.last_episode } : null,
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
    privateNotes: {
      item: { ...notable, title: show.title, year: show.year, fanart: view.fanart },
      note,
      signedIn: user !== null,
      datePreferences,
    },
  };
}

/** `/shows/:id` and `/shows/:id/seasons`: the summary and its Watch Now block. */
export async function loadShow(params: LoadShowParams) {
  const { summary, watchNow, privateNotes, signedIn, relatedSource } = await loadShowData(params);
  return {
    show: summary,
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
    await loadShowData(params);
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
