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
  /** The layout's data, for the viewer's watch-now country, rating settings, VIP state and note dates. */
  parent: () => Promise<{ settings: ViewerSettings | null; user: HeaderUser | null; datePreferences: DatePreferences }>;
  id: string;
};

/**
 * Loads `/movies/:id` for SSR: the summary with the layout data (404s and canonical redirects need it), then
 * everything else in parallel. The collection's items wait on the collection itself. Every call but the private note
 * is public and goes without the user's token: a stale cookie token would get a 401 for data that doesn't need it.
 */
export async function loadMovie({ fetch, token, parent, id: requested }: LoadMovieParams) {
  const client = api({ fetch });
  const [summary, { settings, user, datePreferences }] = await Promise.all([
    client.movies.summary({ params: { id: requested }, query: { extended: 'full,images' } }),
    parent(),
  ]);
  if (summary.status === 404) error(404, 'Movie not found');
  if (summary.status !== 200) error(502, 'The Trakt API could not load this movie.');

  const movie = summary.body;
  const id = movie.ids.slug;
  if (requested !== id) redirect(301, `/movies/${id}`);

  const country = watchNowCountry(settings);

  const collection = okBody(client.movies.lists({ params: { id, type: 'official', sort: 'popular' } })).then(
    async (lists) => {
      const list = lists?.at(0);
      if (!list) return null;
      const items = await okBody(client.lists.items.movie({ params: { id: String(list.ids.trakt) }, query: {} }));
      return items ? { list, items } : null;
    },
  );

  const notable = { type: 'movie', id: movie.ids.trakt, slug: id } as const;
  const [ratings, stats, people, studios, releases, watchnow, official, note] = await Promise.all([
    okBody(client.movies.ratings({ params: { id }, query: { extended: 'all' } })),
    okBody(client.movies.stats({ params: { id } })),
    okBody(client.movies.people({ params: { id }, query: { extended: 'images' } })),
    okBody(client.movies.studios({ params: { id } })),
    okBody(client.movies.releases({ params: { id } })),
    loadWatchNow({ fetch, path: `/movies/${id}`, country, settings, isVip: user?.isVip ?? false }),
    collection,
    loadPrivateNote({ fetch, token: user ? token : null, item: notable }),
  ]);

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
    isVip: user?.isVip ?? false,
    now: new Date(),
  });

  return {
    movie: view,
    relatedSource: toRelatedSource({ subgenres: movie.subgenres, people }),
    watchNow: watchnow.button,
    privateNotes: {
      item: { ...notable, title: movie.title, year: movie.year, fanart: view.fanart },
      note,
      signedIn: user !== null,
      datePreferences,
    },
  };
}
