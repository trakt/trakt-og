import type { EpisodeResponse, PeopleResponse, RatingsResponse, ShowResponse } from '@trakt/api';
import type { z } from 'zod/v4';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import { countryName, languageName } from '../components/summary/names.ts';
import { networkSlug } from '../utils/networkSlug.ts';
import { toCastMembers } from '../components/summary/toCastMembers.ts';
import { toCrewNames } from '../components/summary/toCrewNames.ts';
import { toExternalRatings } from '../components/summary/toExternalRatings.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { formatDate } from '../utils/formatDate.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { previewArt } from '../images/previewArt.ts';
import { episodeNeighbours } from './episodeNeighbours.ts';
import { earlyStreamDate } from './earlyStreamDate.ts';
import { episodeReleasedAt } from './episodeReleasedAt.ts';
import { hasEpisodeAired } from './hasEpisodeAired.ts';
import { isEpisodeWatchable } from './isEpisodeWatchable.ts';
import type { episodeSeasonsSchema } from './episodeSeasonsSchema.ts';
import type { Season } from './seasonSchema.ts';
import { toCrewGroups } from '../components/summary/toCrewGroups.ts';
import { seasonName } from '../utils/seasonName.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import { toEpisodeLinks } from './toEpisodeLinks.ts';
import type { ItemStats } from './ItemStats.ts';

interface Params {
  show: ShowResponse;
  season: Season;
  episode: EpisodeResponse;
  seasons: z.infer<typeof episodeSeasonsSchema>;
  people: PeopleResponse;
  ratings: RatingsResponse;
  stats: ItemStats;
  datePreferences: DatePreferences;
  now: Date;
  episodeTypeTags: boolean;
  otherSiteRatings: boolean;
}

/** Episode facts, the season number strip and neighbours across seasons in broadcast order. */
export function toEpisodeSummary(params: Params) {
  const { show, episode, season, ratings, stats, now } = params;
  // An unaired episode shows no ratings and only its list count, whatever the viewer's early-ratings setting.
  const releasedAt = episodeReleasedAt(episode);
  const aired = hasEpisodeAired(releasedAt, now.getTime());
  const streams = earlyStreamDate(episode);
  const showHref = `/shows/${show.ids.slug}`;
  const seasonHref = `${showHref}/seasons/${episode.season}`;
  const href = `${seasonHref}/episodes/${episode.number}`;
  const number = episodeNumber(episode, show.genres);
  const title = episode.title || `Episode ${episode.number}`;
  const fullTitle = `${show.title} ${number} ${title}`;
  const popular = (key: string, value: string) => `/shows/popular?${key}=${encodeURIComponent(value)}`;
  const seasonNumber = seasonName(episode.season);
  return {
    id: episode.ids.trakt,
    showId: show.ids.trakt,
    slug: show.ids.slug,
    showTitle: show.title,
    showHref,
    seasonHref,
    href,
    season: episode.season,
    episodeNumber: episode.number,
    number,
    title,
    fullTitle,
    seasonTitle: season.title || seasonNumber,
    /** The tag bar's way up: the show, the season by number, then its own title when it has one. */
    parents: [
      { title: show.title, href: showHref },
      { title: seasonNumber, href: seasonHref },
      ...(season.title && season.title !== seasonNumber ? [{ title: season.title, href: seasonHref }] : []),
    ],
    year: episode.first_aired ? new Date(episode.first_aired).getUTCFullYear() : undefined,
    /** API's ISO timestamp, for structured data. */
    firstAired: episode.first_aired ?? null,
    certification: show.certification,
    type: params.episodeTypeTags ? episodeType(episode) : undefined,
    fanart: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'fanart', size: 'full' }),
    screenshot: mediaImage({ type: 'episode', id: episode.ids.trakt, slot: 'screenshot', size: 'full' }),
    /** The link preview's art: the screenshot, else the show's fanart. A hidden screenshot goes by `previewHidden`. */
    preview: previewArt(
      { type: 'episode', id: episode.ids.trakt, slot: 'screenshot' },
      { type: 'show', id: show.ids.trakt, slot: 'fanart' },
    ),
    previewHidden: previewArt({ type: 'show', id: show.ids.trakt, slot: 'fanart' }),
    poster: mediaImage({
      type: 'season',
      id: season.ids.trakt,
      slot: 'poster',
      size: 'medium',
      fallback: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'medium' }),
    }),
    overview: episode.overview,
    runtime: episode.runtime ?? show.runtime ?? undefined,
    /** Out by now, streaming or on air: it shows its ratings. */
    aired,
    /** Out within a day: it can be watched and checked into. */
    watchable: isEpisodeWatchable(releasedAt, now.getTime()),
    rating: aired
      ? {
          value: ratings.rating ?? episode.rating ?? 0,
          votes: ratings.votes ?? episode.votes ?? 0,
          href: `${href}/stats`,
        }
      : undefined,
    external: params.otherSiteRatings && aired ? toExternalRatings({ ratings, rank: null }) : [],
    commentCount: stats.comments,
    listCount: stats.lists,
    facts: {
      streams: streams
        ? {
            label: aired ? 'Streamed' : 'Streams',
            date: formatDate(streams, { ...params.datePreferences, format: 'LL', timeZone: 'UTC' }),
          }
        : undefined,
      aired: episode.first_aired
        ? {
            label: new Date(episode.first_aired) > now ? 'Airs' : 'Aired',
            date: formatDate(episode.first_aired, { ...params.datePreferences, format: 'LL', time: true }),
          }
        : undefined,
      network: show.network ? { name: show.network, href: popular('networks', networkSlug(show.network)) } : undefined,
      runtime: (episode.runtime ?? show.runtime) ? formatRuntime(episode.runtime ?? show.runtime ?? 0) : undefined,
      ...toCrewNames(params.people),
      country: show.country ? { name: countryName(show.country), href: popular('countries', show.country) } : undefined,
      languages: (show.languages ?? []).map((code) => ({ name: languageName(code), href: popular('languages', code) })),
      genres: (show.genres ?? []).map((genre) => ({ name: genreLabel(genre), href: popular('genres', genre) })),
      originalTitle:
        episode.original_title && episode.original_title.toLowerCase() !== title.toLowerCase()
          ? episode.original_title
          : undefined,
    },
    postCredits: {
      duringCredits: episode.during_credits,
      afterCredits: episode.after_credits,
    },
    cast: toCastMembers(params.people.cast, false),
    guestStars: toCastMembers(params.people.guest_stars, false),
    crew: toCrewGroups(params.people.crew, false),
    episodeLinks: (params.seasons.find(({ number }) => number === episode.season)?.episodes ?? [])
      .toSorted((a, b) => a.number - b.number)
      .map((item) => ({
        text: `${item.number}`,
        href: `${seasonHref}/episodes/${item.number}`,
        selected: item.number === episode.number,
      })),
    ...episodeNeighbours({ showHref, genres: show.genres, episode, seasons: params.seasons }),
    links: toEpisodeLinks({ show, episode }),
  };
}
