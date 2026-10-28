import type { EpisodeResponse, EpisodeStatsResponse, PeopleResponse, RatingsResponse, ShowResponse } from '@trakt/api';
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
import { imageUrl } from '../utils/imageUrl.ts';
import { episodeNeighbours } from './episodeNeighbours.ts';
import type { episodeSeasonsSchema } from './episodeSeasonsSchema.ts';
import type { seasonPeopleSchema } from './seasonPeopleSchema.ts';
import type { Season } from './seasonSchema.ts';
import { toCrewGroups } from '../components/summary/toCrewGroups.ts';
import { seasonName } from '../utils/seasonName.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import { toEpisodeLinks } from './toEpisodeLinks.ts';

interface Params {
  show: ShowResponse;
  season: Season;
  episode: EpisodeResponse;
  seasons: z.infer<typeof episodeSeasonsSchema>;
  people: PeopleResponse;
  regulars: z.infer<typeof seasonPeopleSchema>;
  ratings: RatingsResponse;
  stats: EpisodeStatsResponse;
  datePreferences: DatePreferences;
  now: Date;
  episodeTypeTags: boolean;
  otherSiteRatings: boolean;
}

/** Episode facts, the season number strip and neighbours across seasons in broadcast order. */
export function toEpisodeSummary(params: Params) {
  const { show, episode, season, ratings, stats, now } = params;
  // An unaired episode shows no ratings and only its list count, whatever the viewer's early-ratings setting.
  const aired = !!episode.first_aired && new Date(episode.first_aired) <= now;
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
    fanart: imageUrl(show.images?.fanart?.at(0), 'full'),
    screenshot: imageUrl(episode.images?.screenshot?.at(0), 'full'),
    poster: imageUrl(season.images?.poster?.at(0) ?? show.images?.poster?.at(0), 'medium'),
    overview: episode.overview,
    runtime: episode.runtime ?? show.runtime ?? undefined,
    /** Aired by now: it can be watched, checked into and rated. */
    aired,
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
    cast: toCastMembers(params.regulars.cast, false),
    guestStars: toCastMembers(params.people.cast, false),
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
