import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import { loadPrivateNote } from '../notes/loadPrivateNote.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { toRelatedSource } from '../summary/toRelatedSource.ts';
import { toMovieSummary } from './toMovieSummary.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { okBody } from '../api/okBody.ts';

type LoadMovieParams = {
  fetch: typeof fetch;
  /** Only for the viewer's private note. */
  token: string | null;
  /** The layout's data, for the viewer's watch-now country, rating settings and note dates. */
  parent: () => Promise<{ settings: ViewerSettings | null; user: HeaderUser | null; datePreferences: DatePreferences }>;
  id: string;
};

/**
 * Loads `/movies/:id` for SSR: the summary, the layout data and everything else in parallel, with the 404 and canonical
 * redirect checked before the rest is used. The collection's items wait on the collection itself. Every call but the private note
 * is public and goes without the user's token: a stale cookie token would get a 401 for data that doesn't need it.
 */
export async function loadMovie({ fetch, token, parent, id: requested }: LoadMovieParams) {
  const client = api({ fetch });
  const summaryRead = client.movies.summary({ params: { id: requested }, query: { extended: 'full,images' } });
  const layout = parent();
  // The extras go by the requested id alongside the summary, not after it; a non-canonical id redirects before they're
  // used. Each resolves to null on failure, and the catch only stops a failed summary leaving them unhandled.
  const id = requested;
  const collection = okBody(client.movies.lists({ params: { id, type: 'official', sort: 'popular' } })).then(
    async (lists) => {
      const list = lists?.at(0);
      if (!list) return null;
      const items = await okBody(client.lists.items.movie({ params: { id: String(list.ids.trakt) }, query: {} }));
      return items ? { list, items } : null;
    },
  );

  const extras = Promise.all([
    okBody(client.movies.ratings({ params: { id }, query: { extended: 'all' } })),
    okBody(client.movies.stats({ params: { id } })),
    okBody(client.movies.people({ params: { id }, query: { extended: 'images' } })),
    okBody(client.movies.studios({ params: { id } })),
    okBody(client.movies.releases({ params: { id } })),
    layout.then(({ settings }) =>
      loadWatchNow({
        fetch,
        path: `/movies/${id}`,
        country: watchNowCountry(settings),
        settings,
      }),
    ),
    collection,
    Promise.all([summaryRead, layout]).then(([summary, { user }]) =>
      summary.status === 200
        ? loadPrivateNote({
            fetch,
            token: user ? token : null,
            item: { type: 'movie', id: summary.body.ids.trakt, slug: summary.body.ids.slug } as const,
          })
        : null,
    ),
  ]);
  extras.catch(() => {});

  const [summary, { settings, user, datePreferences }] = await Promise.all([summaryRead, layout]);
  if (summary.status === 404) error(404, 'Movie not found');
  if (summary.status !== 200) error(502, 'The Trakt API could not load this movie.');

  const movie = summary.body;
  if (requested !== movie.ids.slug) redirect(301, `/movies/${movie.ids.slug}`);
  const notable = { type: 'movie', id: movie.ids.trakt, slug: movie.ids.slug } as const;

  const [ratings, stats, people, studios, releases, watchnow, official, note] = await extras;

  const view = toMovieSummary({
    movie,
    ratings,
    stats,
    people,
    studios: studios ?? [],
    releases: releases ?? [],
    collection: official,
    rank: watchnow.rank,
    otherSiteRatings: settings?.browsing?.other_site_ratings ?? true,
    now: new Date(),
  });

  return {
    movie: view,
    relatedSource: toRelatedSource({ subgenres: movie.subgenres, genres: movie.genres, people }),
    watchNow: watchnow.button,
    privateNotes: {
      item: { ...notable, title: movie.title, year: movie.year, fanart: view.fanart },
      note,
      signedIn: user !== null,
      datePreferences,
    },
  };
}
