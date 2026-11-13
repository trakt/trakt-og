import type { EpisodeResponse, RatingsResponse, SeasonsResponse, ShowResponse } from '@trakt/api';
import { mediaImage } from '../images/mediaImage.ts';
import { previewArt } from '../images/previewArt.ts';
import type { z } from 'zod/v4';
import type { ItemStats } from './ItemStats.ts';
import { countryName, languageName } from '../components/summary/names.ts';
import { networkSlug } from '../utils/networkSlug.ts';
import { toCastMembers } from '../components/summary/toCastMembers.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { seasonNeighbours } from './seasonNeighbours.ts';
import type { seasonPeopleSchema } from './seasonPeopleSchema.ts';
import { toShowEpisodes } from './toShowEpisodes.ts';
import { episodeReleasedAt } from './episodeReleasedAt.ts';
import { hasEpisodeAired } from './hasEpisodeAired.ts';
import { toCrewGroups } from '../components/summary/toCrewGroups.ts';
import { seasonName } from '../utils/seasonName.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import { toSeasonLinks } from './toSeasonLinks.ts';

interface Params {
  show: ShowResponse;
  season: SeasonsResponse[number];
  seasons: SeasonsResponse;
  episodes: EpisodeResponse[];
  ratings: RatingsResponse;
  stats: ItemStats;
  people: z.infer<typeof seasonPeopleSchema>;
  /** From the season's Watch Now rank. */
  justwatch?: string | null;
  actorSpoilers: boolean;
  episodeTypeTags: boolean;
  datePreferences: DatePreferences;
  now: Date;
}

/** Season-specific facts and navigation; the show episode and cast mappers provide the shared rows. */
export function toSeasonSummary(params: Params) {
  const { show, season, seasons, episodes, stats, ratings, datePreferences, now } = params;
  const showHref = `/shows/${show.ids.slug}`;
  const href = `${showHref}/seasons/${season.number}`;
  const standardTitle = seasonName(season.number);
  const title = season.title || standardTitle;
  const fullTitle = `${show.title}: ${title}`;
  const episodeList = toShowEpisodes({
    show,
    seasons: [{ ...season, episodes }],
    signedIn: true,
    episodeTypeTags: params.episodeTypeTags,
    datePreferences,
    now,
  });
  const first = episodes.toSorted((a, b) => a.number - b.number).at(0)?.first_aired ?? season.first_aired;
  // An unaired season shows no rating and only its list count, whatever the viewer's early-ratings setting.
  const premiered = !!first && new Date(first) <= now;
  const network = season.network ?? show.network;
  const popular = (key: string, value: string) => `/shows/popular?${key}=${encodeURIComponent(value)}`;
  const networkLink = network ? { name: network, href: popular('networks', networkSlug(network)) } : undefined;
  const aired = episodes.filter((episode) => hasEpisodeAired(episodeReleasedAt(episode), now.getTime()));
  const total = season.total_runtime ?? aired.reduce((sum, episode) => sum + (episode.runtime ?? show.runtime ?? 0), 0);

  return {
    id: season.ids.trakt,
    number: season.number,
    showId: show.ids.trakt,
    showHref,
    showTitle: show.title,
    /** The way up for the tag bar: the show, then "Season 10" when the season has a title of its own. */
    parents: [{ title: show.title, href: showHref }, ...(title === standardTitle ? [] : [{ title: standardTitle }])],
    href,
    title,
    fullTitle,
    years: episodeList.years,
    certification: show.certification,
    fanart: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'fanart', size: 'full' }),
    poster: mediaImage({
      type: 'season',
      id: season.ids.trakt,
      slot: 'poster',
      size: 'medium',
      fallback: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'medium' }),
    }),
    /** The link preview's art: the season's own poster, else the show's fanart. */
    preview: previewArt(
      { type: 'season', id: season.ids.trakt, slot: 'poster' },
      { type: 'show', id: show.ids.trakt, slot: 'fanart' },
    ),
    structuredImage: previewArt(
      { type: 'season', id: season.ids.trakt, slot: 'poster' },
      { type: 'show', id: show.ids.trakt, slot: 'poster' },
    ),
    overview: season.overview || show.overview,
    rating: premiered
      ? {
          value: ratings.rating ?? season.rating ?? 0,
          votes: ratings.votes ?? season.votes ?? 0,
          href: `${href}/stats`,
        }
      : undefined,
    commentCount: stats.comments,
    listCount: stats.lists,
    airedEpisodes: season.aired_episodes ?? aired.length,
    episodeIds: aired.toSorted((a, b) => a.number - b.number).map(({ ids }) => ids.trakt),
    runtime: show.runtime ?? undefined,
    facts: {
      premiere: first
        ? {
            label: new Date(first) > now ? 'Premieres' : 'Premiered',
            date: formatDate(first, { ...datePreferences, format: 'LL' }),
          }
        : undefined,
      network: networkLink,
      runtime: show.runtime ? formatRuntime(show.runtime) : undefined,
      totalRuntime:
        total > 0
          ? { time: formatRuntime(total), episodes: countLabel(season.aired_episodes ?? aired.length, 'episode') }
          : undefined,
      country: show.country ? { name: countryName(show.country), href: popular('countries', show.country) } : undefined,
      languages: (show.languages ?? []).map((code) => ({ name: languageName(code), href: popular('languages', code) })),
      genres: (show.genres ?? []).map((genre) => ({ name: genreLabel(genre), href: popular('genres', genre) })),
    },
    links: toSeasonLinks({ show, number: season.number, justwatch: params.justwatch }),
    cast: toCastMembers(params.people.cast, params.actorSpoilers),
    guestStars: toCastMembers(params.people.guest_stars, params.actorSpoilers),
    crew: toCrewGroups(params.people.crew, params.actorSpoilers),
    episodes: episodeList.rows,
    seasonLinks: [
      ...seasons
        .toSorted((a, b) => b.number - a.number)
        .map(({ number }) => ({
          text: number === 0 ? 'Specials' : `${number}`,
          href: `${showHref}/seasons/${number}`,
          selected: number === season.number,
        })),
      { text: 'All', href: `${showHref}/seasons/all`, selected: false },
    ],
    ...seasonNeighbours({ showHref, number: season.number, seasons }),
  };
}
