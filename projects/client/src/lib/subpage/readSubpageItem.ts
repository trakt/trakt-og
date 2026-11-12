import { error } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { assertOk } from '../api/assertOk.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import { OFFICIAL_LISTS_LIMIT, pickCollectionList } from '../lists/pickCollectionList.ts';
import { episodeNeighbours } from '../shows/episodeNeighbours.ts';
import { episodeSeasonsSchema } from '../shows/episodeSeasonsSchema.ts';
import { seasonNeighbours } from '../shows/seasonNeighbours.ts';
import type { SubpageItem } from './SubpageItem.ts';

function number(value: string, name: string) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) error(404, `${name} not found`);
  return Number(value);
}

type Params = {
  fetch: typeof globalThis.fetch;
  item: SubpageItem;
  neighbours: boolean;
  /** A movie's collection, for the tag bar: one more read, left out where the page doesn't show the bar. */
  collection?: boolean;
};

/** The item as `/comments/:id/item` would carry it, plus the arrows' targets, from the public summaries. */
export async function readSubpageItem({ fetch, item, neighbours, collection = true }: Params) {
  const client = api({ fetch });
  const { id } = item;
  if (item.type === 'movie') {
    const [movie, lists] = await Promise.all([
      client.movies.summary({ params: { id }, query: { extended: 'full' } }),
      collection
        ? client.movies.lists({
            params: { id, type: 'official', sort: 'popular' },
            query: { limit: OFFICIAL_LISTS_LIMIT },
          })
        : null,
    ]);
    assertOk(movie, 'Movie');
    // Its collection, for the tag bar, as on the summary. A failed read just leaves it out.
    const list = lists?.status === 200 ? pickCollectionList(lists.body) : undefined;
    return {
      body: { type: 'movie' as const, movie: movie.body },
      collection: list && { title: list.name, href: `/lists/official/${list.ids.slug}` },
    };
  }

  const summary = client.shows.summary({ params: { id }, query: { extended: 'full' } });
  if (item.type === 'show') {
    const show = await summary;
    assertOk(show, 'Show');
    return { body: { type: 'show' as const, show: show.body } };
  }

  const season = number(item.season, 'Season');
  if (item.type === 'season' && !neighbours) {
    const [show, found] = await Promise.all([
      summary,
      client.shows.season.info({ params: { id, season }, query: { extended: 'full' } }),
    ]);
    assertOk(show, 'Show');
    // A season the show doesn't have answers an empty 204, not a 404.
    if (found.status === 204) error(404, 'Season not found');
    assertOk(found, 'Season');
    return { body: { type: 'season' as const, show: show.body, season: found.body } };
  }
  if (item.type === 'season') {
    const [show, seasons] = await Promise.all([
      summary,
      client.shows.seasons({ params: { id }, query: { extended: 'full' } }),
    ]);
    assertOk(show, 'Show');
    assertOk(seasons, 'Seasons');
    const found = seasons.body.find((row) => row.number === season);
    if (!found) error(404, 'Season not found');
    const showHref = `/shows/${show.body.ids.slug}`;
    return {
      body: { type: 'season' as const, show: show.body, season: found },
      ...seasonNeighbours({ showHref, number: season, seasons: seasons.body }),
    };
  }

  const episode = number(item.episode, 'Episode');
  // The season too, for its own title in the tag bar ("Delicate"); a failed read just leaves it out.
  const [show, found, seasonInfo, seasonsResponse] = await Promise.all([
    summary,
    client.shows.episode.summary({ params: { id, season, episode }, query: { extended: 'full' } }),
    client.shows.season.info({ params: { id, season }, query: { extended: 'full' } }),
    neighbours ? rawApiFetch({ fetch, path: `/shows/${encodeURIComponent(id)}/seasons?extended=episodes` }) : null,
  ]);
  assertOk(show, 'Show');
  assertOk(found, 'Episode');
  const seasonBody = seasonInfo.status === 200 ? seasonInfo.body : undefined;
  if (!seasonsResponse)
    return { body: { type: 'episode' as const, show: show.body, episode: found.body, season: seasonBody } };
  if (!seasonsResponse.ok) error(502, 'The Trakt API could not load the seasons.');
  const seasons = episodeSeasonsSchema.safeParse(await seasonsResponse.json().catch(() => null));
  if (!seasons.success) error(502, 'The Trakt API returned invalid seasons data.');
  return {
    body: { type: 'episode' as const, show: show.body, episode: found.body, season: seasonBody },
    ...episodeNeighbours({
      showHref: `/shows/${show.body.ids.slug}`,
      genres: show.body.genres,
      episode: found.body,
      seasons: seasons.data,
    }),
  };
}
