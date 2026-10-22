import { error, redirect } from '@sveltejs/kit';
import { api } from '../api/api.ts';
import { rawApiFetch } from '../api/rawApiFetch.ts';
import type { HeaderUser } from '../components/header/HeaderUser.ts';
import { loadWatchNow } from '../components/watchnow/loadWatchNow.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import type { ViewerSettings } from '../settings/ViewerSettings.ts';
import { episodeNeighbours } from '../shows/episodeNeighbours.ts';
import { episodeSeasonsSchema } from '../shows/episodeSeasonsSchema.ts';
import { seasonNeighbours } from '../shows/seasonNeighbours.ts';
import type { SubpageItem } from './SubpageItem.ts';
import { subpageWatchNowPath } from './subpageWatchNowPath.ts';
import { readSubpageRatings } from './readSubpageRatings.ts';
import { subpageParents } from './subpageParents.ts';
import { toSubpageStrip } from './toSubpageStrip.ts';
import { toSubpageMedia } from './toSubpageMedia.ts';
import { watchNowCountry } from '../settings/watchNowCountry.ts';
import { assertOk } from '../api/assertOk.ts';

type Params = {
  fetch: typeof globalThis.fetch;
  parent: () => Promise<{ datePreferences: DatePreferences; settings: ViewerSettings | null; user: HeaderUser | null }>;
  item: SubpageItem;
  /** The subpage's own path segment: `credits`, `stats`, `lists`, `comments`. */
  suffix: string;
  /** Stats has no sibling arrows and needs no neighbour reads. */
  neighbours?: boolean;
  /** Stats reads the ratings and counts too, for its strip and sections; other subpages go without the strip. */
  ratings?: boolean;
};

type Link = { readonly href: string; readonly label: string };

function number(value: string, name: string) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) error(404, `${name} not found`);
  return Number(value);
}

/** The item as `/comments/:id/item` would carry it, plus the arrows' targets, from the public summaries. */
async function readItem(fetch: typeof globalThis.fetch, item: SubpageItem, neighbours: boolean) {
  const client = api({ fetch });
  const { id } = item;
  if (item.type === 'movie') {
    const [movie, lists] = await Promise.all([
      client.movies.summary({ params: { id }, query: { extended: 'full,images' } }),
      client.movies.lists({ params: { id, type: 'official', sort: 'popular' } }),
    ]);
    assertOk(movie, 'Movie');
    // The official list it belongs to, for the tag bar, as on the summary. A failed read just leaves it out.
    const list = lists.status === 200 ? lists.body.at(0) : undefined;
    return {
      body: { type: 'movie', movie: movie.body },
      collection: list && { title: list.name, href: `/lists/official/${list.ids.slug}` },
    };
  }

  const summary = client.shows.summary({ params: { id }, query: { extended: 'full,images' } });
  if (item.type === 'show') {
    const show = await summary;
    assertOk(show, 'Show');
    return { body: { type: 'show', show: show.body } };
  }

  const season = number(item.season, 'Season');
  if (item.type === 'season' && !neighbours) {
    const [show, found] = await Promise.all([
      summary,
      client.shows.season.info({ params: { id, season }, query: { extended: 'full,images' } }),
    ]);
    assertOk(show, 'Show');
    // A season the show doesn't have answers an empty 204, not a 404.
    if (found.status === 204) error(404, 'Season not found');
    assertOk(found, 'Season');
    return { body: { type: 'season', show: show.body, season: found.body } };
  }
  if (item.type === 'season') {
    const [show, seasons] = await Promise.all([
      summary,
      client.shows.seasons({ params: { id }, query: { extended: 'full,images' } }),
    ]);
    assertOk(show, 'Show');
    assertOk(seasons, 'Seasons');
    const found = seasons.body.find((row) => row.number === season);
    if (!found) error(404, 'Season not found');
    const showHref = `/shows/${show.body.ids.slug}`;
    return {
      body: { type: 'season', show: show.body, season: found },
      ...seasonNeighbours({ showHref, number: season, seasons: seasons.body }),
    };
  }

  const episode = number(item.episode, 'Episode');
  // The season too, for its own title in the tag bar ("Delicate"); a failed read just leaves it out.
  const [show, found, seasonInfo, seasonsResponse] = await Promise.all([
    summary,
    client.shows.episode.summary({ params: { id, season, episode }, query: { extended: 'full,images' } }),
    client.shows.season.info({ params: { id, season }, query: { extended: 'full' } }),
    neighbours ? rawApiFetch({ fetch, path: `/shows/${encodeURIComponent(id)}/seasons?extended=episodes` }) : null,
  ]);
  assertOk(show, 'Show');
  assertOk(found, 'Episode');
  const seasonBody = seasonInfo.status === 200 ? seasonInfo.body : undefined;
  if (!seasonsResponse) return { body: { type: 'episode', show: show.body, episode: found.body, season: seasonBody } };
  if (!seasonsResponse.ok) error(502, 'The Trakt API could not load the seasons.');
  const seasons = episodeSeasonsSchema.safeParse(await seasonsResponse.json().catch(() => null));
  if (!seasons.success) error(502, 'The Trakt API returned invalid seasons data.');
  return {
    body: { type: 'episode', show: show.body, episode: found.body, season: seasonBody },
    ...episodeNeighbours({
      showHref: `/shows/${show.body.ids.slug}`,
      genres: show.body.genres,
      episode: found.body,
      seasons: seasons.data,
    }),
  };
}

const requestedHref = (item: SubpageItem) => {
  if (item.type === 'movie') return `/movies/${item.id}`;
  if (item.type === 'show') return `/shows/${item.id}`;
  if (item.type === 'season') return `/shows/${item.id}/seasons/${item.season}`;
  return `/shows/${item.id}/seasons/${item.season}/episodes/${item.episode}`;
};

/**
 * The slim header and sidebar every item subpage shares: the item, the previous and next arrows pointing at the sibling's
 * same subpage, and Watch Now. A non-canonical URL redirects to the slug's. Every read is public, so none sends the
 * viewer's token. Run it beside the subpage's own reads.
 */
export async function loadSubpageMedia({ fetch, parent, item, suffix, neighbours = true, ratings = false }: Params) {
  const [read, layout, reads] = await Promise.all([
    readItem(fetch, item, neighbours),
    parent(),
    ratings ? readSubpageRatings(fetch, item) : null,
  ]);
  const { user, settings, datePreferences } = layout;
  const target = subpageWatchNowPath(read.body);
  const watchNow = target
    ? await loadWatchNow({
      fetch,
      ...target,
      country: watchNowCountry(settings),
      settings,
      isVip: user?.isVip ?? false,
    })
    : null;
  const collection = 'collection' in read ? read.collection : undefined;
  const media = toSubpageMedia({ body: read.body, justwatch: watchNow?.rank?.link, collection });
  if (!media) error(404, 'Not found');
  if (media.href !== requestedHref(item)) redirect(301, `${media.href}/${suffix}`);

  const sibling = (link: Link | undefined) => link && { ...link, href: `${link.href}/${suffix}` };
  const strip = reads
    ? toSubpageStrip({
      media,
      reads,
      rank: watchNow?.rank ?? null,
      otherSiteRatings: settings?.browsing?.other_site_ratings ?? true,
      now: new Date(),
    })
    : undefined;
  return {
    /** The public ratings and counts behind the strip, for the stats page; null when they didn't load. */
    reads,
    strip,
    media: { ...media, parents: subpageParents({ type: media.item.type, parents: media.parents, suffix }) },
    previous: 'previous' in read ? sibling(read.previous) : undefined,
    next: 'next' in read ? sibling(read.next) : undefined,
    watchNow: watchNow?.button ?? null,
    streamingRank: watchNow?.rank ?? null,
    user,
    settings,
    datePreferences,
  };
}
