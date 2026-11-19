import type { ItemStats } from './ItemStats.ts';
import { statSorts } from './statSorts.ts';
import type { EpisodeResponse, RatingsResponse, ShowResponse, ShowStatsResponse, StudioResponse } from '@trakt/api';
import type { ComponentProps } from 'svelte';
import type FanartCard from '../components/media/FanartCard.svelte';
import { toCastMembers } from '../components/summary/toCastMembers.ts';
import type { NamedLink } from '../components/summary/NamedLink.ts';
import { countryName, languageName, titleize } from '../components/summary/names.ts';
import { type StreamingRank, toExternalRatings } from '../components/summary/toExternalRatings.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import { fromWallClock } from '../utils/fromWallClock.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { mediaImage } from '../images/mediaImage.ts';
import { previewArt } from '../images/previewArt.ts';
import type { SeasonWithEpisodes, ShowPeople } from './loadShow.ts';
import { toCrewGroups } from '../components/summary/toCrewGroups.ts';
import { seasonName } from '../utils/seasonName.ts';
import { ratingPercent } from '../utils/ratingPercent.ts';
import { toShowLinks } from './toShowLinks.ts';
import { episodeReleasedAt } from './episodeReleasedAt.ts';
import { hasEpisodeAired } from './hasEpisodeAired.ts';
import { type EpisodeCardContext, toEpisodeCard } from './toEpisodeCard.ts';
import { genreLabel } from '../utils/genreLabel.ts';
import type { PortraitOf } from '../images/castHeadshot.ts';

interface ShowSummaryParams {
  show: ShowResponse;
  ratings: RatingsResponse | null;
  stats: ShowStatsResponse | null;
  people: ShowPeople | null;
  studios: readonly StudioResponse[];
  seasons: readonly SeasonWithEpisodes[];
  signedIn: boolean;
  rank: StreamingRank | null;
  otherSiteRatings: boolean;
  /** Off when the viewer hides actor spoilers: no episode counts. */
  actorSpoilers: boolean;
  /** Off when the viewer hides episode type tags ("Season Premiere"). */
  episodeTypeTags: boolean;
  /** Cast as actors in character, for viewers who get them (`canSeePortraits`). */
  portraits?: boolean;
  datePreferences: DatePreferences;
  now: Date;
}

/** A card in Up Next / Recently Aired. */
export type EpisodeCard = Omit<ComponentProps<typeof FanartCard>, 'icons'> & {
  collectionContext: { show: number; number: number; episode: number };
  id: number;
  rating: number;
  released: boolean;
  /** Minutes, so the watched tooltip can total the plays. */
  runtime?: number;
};

/** A poster in the seasons grid, with what its sorts need. */
export type SeasonCard = {
  id: number;
  number: number;
  href: string;
  title: string;
  fullTitle: string;
  showTitle: string;
  image?: string;
  episodes: string;
  rating: number;
  released: boolean;
  votes: number;
  airedEpisodes: number;
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The next instant at which the show's weekly slot ("Sunday", "21:00", "America/New_York") falls, as ISO, so the page
 * can say it in the viewer's zone. OG pinned the slot to a week in January 2018, which is off by an hour in summer.
 */
export function airsAt(airs: ShowResponse['airs'], now: Date): string | undefined {
  const day = DAYS.indexOf(airs?.day ?? '');
  const [hour, minute] = (airs?.time ?? '').split(':').map(Number);
  if (day < 0 || hour === undefined || minute === undefined || Number.isNaN(hour) || !airs?.timezone) return undefined;

  const ahead = (day - now.getUTCDay() + 7) % 7;
  const wall = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ahead, hour, minute);
  try {
    return new Date(fromWallClock(wall, airs.timezone)).toISOString();
  } catch {
    return undefined;
  }
}

const ENDINGS: Record<string, string> = { open: 'Unresolved', concluded: 'Completed' };

const popular = (param: string, value: string | number) => `/shows/popular?${param}=${encodeURIComponent(value)}`;
const person = (member: { person: { name: string; ids: { slug: string } } }): NamedLink => ({
  name: member.person.name,
  href: `/people/${member.person.ids.slug}`,
});

/**
 * The episodes behind OG's recent episodes: the next to air and the aired ones, newest first. Specials and episodes
 * without an air date sit out, like OG's `next_episode`. An episode that streams first counts from its stream.
 */
function recentEpisodes({ seasons, now }: Pick<ShowSummaryParams, 'seasons' | 'now'>) {
  const episodes = seasons
    .filter(({ number }) => number > 0)
    .flatMap(({ episodes }) => episodes ?? [])
    .filter((episode) => episode.number > 0 && episodeReleasedAt(episode));
  const at = (episode: EpisodeResponse) => new Date(episodeReleasedAt(episode) ?? 0).getTime();
  const byAir = (a: EpisodeResponse, b: EpisodeResponse) => at(a) - at(b) || a.number - b.number;

  return {
    upcoming: episodes
      .filter((episode) => at(episode) > now.getTime())
      .toSorted(byAir)
      .at(0),
    aired: episodes
      .filter((episode) => at(episode) <= now.getTime())
      .toSorted(byAir)
      .toReversed(),
  };
}

type Facts = Pick<ShowSummaryParams, 'show' | 'studios' | 'people' | 'now'> & {
  /** Formats a date the way this page does: the viewer's zone when signed in, else the show's. */
  day: (date: string) => string;
  airs: (date: string) => string;
};

// upcoming shows get Status and Premieres, airing ones Airs, the rest their status
// with the last air date and the network. Then Premiered and the shared facts.
function facts({ show, studios, people, now, day, airs }: Facts) {
  const upcoming = !!show.first_aired && new Date(show.first_aired) > now;
  const network = show.network ? { name: show.network, href: popular('networks', show.network) } : undefined;
  const slot = airsAt(show.airs, now);
  const airing =
    !upcoming && !['ended', 'canceled', 'pilot'].includes(show.status ?? '') && !!show.first_aired && !!slot;
  const status = show.status
    ? upcoming || !show.last_aired
      ? { label: 'Status', value: titleize(show.status) }
      : { label: titleize(show.status).replace(/ \w/g, (c) => c.toLowerCase()), value: day(show.last_aired) }
    : undefined;

  return {
    status: airing ? undefined : status,
    /** The story's ending, which the API only gives ended and canceled shows. */
    ending: show.ending ? ENDINGS[show.ending] : undefined,
    premieres: upcoming && show.first_aired ? { date: day(show.first_aired), network } : undefined,
    airs: airing && slot ? { when: airs(slot), network } : undefined,
    network: !upcoming && !airing ? network : undefined,
    premiered: !upcoming && show.first_aired ? day(show.first_aired) : undefined,
    runtime: show.runtime ? formatRuntime(show.runtime) : undefined,
    totalRuntime: show.total_runtime
      ? {
          time: formatRuntime(show.total_runtime),
          episodes: show.aired_episodes ? countLabel(show.aired_episodes, 'episode') : undefined,
        }
      : undefined,
    creators: (people?.crew?.['created by'] ?? []).map(person),
    country: show.country ? { name: countryName(show.country), href: popular('countries', show.country) } : undefined,
    languages: (show.languages ?? []).map((code) => ({
      name: languageName(code),
      href: popular('languages', code),
    })),
    studios: studios.map(({ name, ids }) => ({ name, slug: ids.slug, href: popular('studios', ids.slug) })),
    genres: (show.genres ?? []).map((genre) => ({
      name: genreLabel(genre),
      href: popular('genres', genre),
    })),
    originalTitle:
      show.original_title && show.original_title.toLowerCase() !== show.title.toLowerCase()
        ? show.original_title
        : undefined,
  };
}

/**
 * The guest stars' count, and the stars themselves only when there are no series regulars to show first. A long-running
 * show has thousands (Grey's Anatomy's were about 470 KB of its page), so the actors strip loads them when picked.
 */
function guestStars(people: ShowPeople | null, actorSpoilers: boolean) {
  const stars = people?.guest_stars ?? [];
  const cast = people?.cast?.length ? null : toCastMembers(stars, actorSpoilers);
  return { count: stars.length, cast };
}

/** Everything the show summary shows, from the loader's API responses. */
export function toShowSummary(params: ShowSummaryParams) {
  const { show, stats, seasons, now, datePreferences } = params;
  const portraitOf: PortraitOf | undefined = params.portraits ? { media: 'show', id: show.ids.trakt } : undefined;
  const slug = show.ids.slug;
  const href = `/shows/${slug}`;
  const timeZone = params.signedIn ? datePreferences.timeZone : (show.airs?.timezone ?? datePreferences.timeZone);
  const format = (date: string, options: Parameters<typeof formatDate>[1]) =>
    formatDate(date, { ...datePreferences, timeZone, ...options });
  const day = (date: string) => format(date, { format: 'LL' });
  const airs = (date: string) => format(date, { format: 'dddd', time: true }).replace(' ', ' at ');

  // Unaired shows show no ratings and only their list count, whatever the viewer's early-ratings setting.
  const aired = !!show.first_aired && new Date(show.first_aired) <= now;

  const cardContext: EpisodeCardContext = {
    showId: show.ids.trakt,
    href,
    network: show.network ?? undefined,
    genres: show.genres,
    runtime: show.runtime ?? undefined,
    episodeTypeTags: params.episodeTypeTags,
    timeZone,
  };
  const episodeCard = (episode: EpisodeResponse) =>
    toEpisodeCard({ episode, context: cardContext, datePreferences, now });
  const { upcoming, aired: airedEpisodes } = recentEpisodes(params);

  const seasonCards: SeasonCard[] = seasons.map((season) => ({
    id: season.ids.trakt,
    number: season.number,
    href: `${href}/seasons/${season.number}`,
    title: season.title ?? seasonName(season.number),
    fullTitle: `${show.title} ${season.title ?? `Season ${season.number}`}`,
    showTitle: show.title,
    image: mediaImage({
      type: 'season',
      id: season.ids.trakt,
      slot: 'poster',
      size: 'thumb',
      fallback: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'thumb' }),
    }),
    episodes: countLabel(season.episode_count ?? 0, 'episode'),
    rating: season.rating ?? 0,
    released: !!season.first_aired && new Date(season.first_aired) <= now,
    votes: season.votes ?? 0,
    airedEpisodes: season.aired_episodes ?? 0,
  }));

  return {
    updatedAt: show.updated_at ?? null,
    id: show.ids.trakt,
    slug,
    href,
    title: show.title,
    year: show.year ?? null,
    fullTitle: show.year ? `${show.title} (${show.year})` : show.title,
    certification: show.certification ?? null,
    /** API's ISO timestamp, for structured data. */
    firstAired: show.first_aired ?? null,
    fanart: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'fanart', size: 'full' }),
    poster: mediaImage({ type: 'show', id: show.ids.trakt, slot: 'poster', size: 'medium' }),
    /** The link preview's art: fanart, else poster. */
    preview: previewArt(
      { type: 'show', id: show.ids.trakt, slot: 'fanart' },
      { type: 'show', id: show.ids.trakt, slot: 'poster' },
    ),
    structuredImage: previewArt(
      { type: 'show', id: show.ids.trakt, slot: 'poster' },
      { type: 'show', id: show.ids.trakt, slot: 'fanart' },
    ),
    rating: aired ? { value: show.rating ?? 0, votes: show.votes ?? 0, href: `${href}/stats` } : undefined,
    external: params.otherSiteRatings && aired ? toExternalRatings({ ratings: params.ratings, rank: params.rank }) : [],
    /** The strip keeps only favorites; the stats page has the rest of the community counts. */
    counts: aired ? [{ count: stats?.favorited ?? 0, label: 'favorited' }] : [],
    airedEpisodes: show.aired_episodes ?? 0,
    runtime: show.runtime ?? undefined,
    /** Minutes, every aired episode. */
    totalRuntime: show.total_runtime ?? undefined,
    episodeIds: seasons
      .filter(({ number }) => number > 0)
      .flatMap(({ episodes }) => episodes ?? [])
      .filter((episode) => hasEpisodeAired(episodeReleasedAt(episode), params.now.getTime()))
      .sort((a, b) => a.season - b.season || a.number - b.number)
      .map(({ ids }) => ids.trakt),
    commentCount: stats?.comments ?? show.comment_count ?? 0,
    listCount: stats?.lists ?? 0,
    facts: facts({ ...params, day, airs }),
    tagline: show.tagline ?? null,
    overview: show.overview ?? null,
    links: toShowLinks({ show: params.show, justwatch: params.rank?.link }),
    portraitOf,
    actorSpoilers: params.actorSpoilers,
    cast: toCastMembers(params.people?.cast, params.actorSpoilers),
    guestStars: guestStars(params.people, params.actorSpoilers),
    crew: toCrewGroups(params.people?.crew, params.actorSpoilers),
    /** Next Episode and the aired ones, as a signed-out visit sees them. */
    recent: {
      upNext: false,
      next: upcoming && episodeCard(upcoming),
      aired: airedEpisodes.slice(0, upcoming ? 2 : 3).map(episodeCard),
    },
    /** A signed-in viewer's progress picks Up Next in the browser, from these. Signed out, nothing waits on it. */
    progressBase: params.signedIn
      ? {
          context: cardContext,
          upcoming: upcoming && episodeCard(upcoming),
          aired: airedEpisodes.slice(0, 3).map(episodeCard),
        }
      : null,
    seasons: seasonCards,
    /** OG's "N Seasons" leaves the specials out. */
    seasonCount: seasons.filter(({ number }) => number > 0).length,
  };
}

/**
 * The seasons grid's sorts, each with its own direction: the show page flips Number to
 * newest first. Public community stats arrive lazily; stat sorts wait for them in the browser. Popularity is cut.
 */
export const SEASON_SORTS = [
  { by: 'number', name: 'Number', desc: true },
  { by: 'percentage', name: 'Percentage', desc: true },
  { by: 'votes', name: 'Votes', desc: true },
  ...statSorts,
] as const;

export type SeasonSort = (typeof SEASON_SORTS)[number]['by'];

const sortKey: Record<Exclude<SeasonSort, (typeof statSorts)[number]['by']>, (card: SeasonCard) => number> = {
  number: (card) => card.number,
  // OG sorted on the integer percentage.
  percentage: (card) => ratingPercent(card.rating),
  votes: (card) => card.votes,
};

/** The seasons in `by` order; `flipped` is the direction toggle. Ties keep season order. */
export function sortSeasons({
  cards,
  by,
  flipped,
  stats = new Map(),
}: {
  cards: readonly SeasonCard[];
  by: SeasonSort;
  flipped: boolean;
  stats?: ReadonlyMap<number, ItemStats | null>;
}): SeasonCard[] {
  const desc = SEASON_SORTS.find((sort) => sort.by === by)?.desc !== flipped;
  const field = statSorts.find((sort) => sort.by === by)?.field;
  const key = (card: SeasonCard) => {
    if (field) return stats.get(card.id)?.[field] ?? 0;
    const local = by as keyof typeof sortKey;
    return sortKey[local](card);
  };
  return cards.toSorted((a, b) => (desc ? key(b) - key(a) : key(a) - key(b)) || a.number - b.number);
}
