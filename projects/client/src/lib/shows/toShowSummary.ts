import type { ItemStats } from './ItemStats.ts';
import { statSorts } from './statSorts.ts';
import type { EpisodeResponse, RatingsResponse, ShowResponse, ShowStatsResponse, StudioResponse } from '@trakt/api';
import type { ComponentProps } from 'svelte';
import { episodeNumber, episodeType } from '../components/media/episodeTags.ts';
import type FanartCard from '../components/media/FanartCard.svelte';
import { toCastMembers } from '../components/summary/toCastMembers.ts';
import type { NamedLink } from '../components/summary/NamedLink.ts';
import { countryName, languageName, titleize } from '../components/summary/names.ts';
import { networkSlug } from '../utils/networkSlug.ts';
import { type StreamingRank, toExternalRatings } from '../components/summary/toExternalRatings.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatDate } from '../utils/formatDate.ts';
import { fromWallClock } from '../utils/fromWallClock.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import { imageUrl } from '../utils/imageUrl.ts';
import type { SeasonWithEpisodes, ShowPeople } from './loadShow.ts';
import { toCrewGroups } from '../components/summary/toCrewGroups.ts';
import { seasonName } from '../utils/seasonName.ts';
import { ratingPercent } from '../utils/ratingPercent.ts';
import { toShowLinks } from './toShowLinks.ts';
import { genreLabel } from '../utils/genreLabel.ts';

type Tag = NonNullable<ComponentProps<typeof FanartCard>['tags']>[number];

interface ShowSummaryParams {
  show: ShowResponse;
  ratings: RatingsResponse | null;
  stats: ShowStatsResponse | null;
  people: ShowPeople | null;
  studios: readonly StudioResponse[];
  seasons: readonly SeasonWithEpisodes[];
  /** The viewer's progress, when there is one: its next episode (null when they're caught up) and the last one watched. */
  progress: { next: EpisodeResponse | null; last?: EpisodeResponse | null } | null;
  signedIn: boolean;
  rank: StreamingRank | null;
  otherSiteRatings: boolean;
  /** Off when the viewer hides actor spoilers: no episode counts. */
  actorSpoilers: boolean;
  /** Off when the viewer hides episode type tags ("Season Premiere"). */
  episodeTypeTags: boolean;
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

const popular = (param: string, value: string | number) => `/shows/popular?${param}=${encodeURIComponent(value)}`;
const person = (member: { person: { name: string; ids: { slug: string } } }): NamedLink => ({
  name: member.person.name,
  href: `/people/${member.person.ids.slug}`,
});

/**
 * OG's recent episodes. Signed in with progress, the first card is Up Next (the next to watch,
 * else the next to air) and two recent episodes follow. Otherwise it's Next Episode and two, or three recent ones.
 * Specials and episodes without an air date sit out, like OG's `next_episode`.
 */
function recentEpisodes({ seasons, progress, now }: Pick<ShowSummaryParams, 'seasons' | 'progress' | 'now'>) {
  const episodes = seasons
    .filter(({ number }) => number > 0)
    .flatMap(({ episodes }) => episodes ?? [])
    .filter((episode) => episode.number > 0 && episode.first_aired);
  const at = (episode: EpisodeResponse) => new Date(episode.first_aired ?? 0).getTime();
  const byAir = (a: EpisodeResponse, b: EpisodeResponse) => at(a) - at(b) || a.number - b.number;

  const upcoming = episodes
    .filter((episode) => at(episode) > now.getTime())
    .toSorted(byAir)
    .at(0);
  const aired = episodes
    .filter((episode) => at(episode) <= now.getTime())
    .toSorted(byAir)
    .toReversed();
  const watchNext = progress?.next && episodes.find(({ ids }) => ids.trakt === progress.next?.ids.trakt);
  const next = (progress ? watchNext : undefined) ?? upcoming;

  return {
    upNext: progress !== null,
    next,
    recent: next ? aired.filter((episode) => episode !== next).slice(0, 2) : aired.slice(0, 3),
  };
}

function nextToWatch(next: EpisodeResponse | null | undefined, now: Date) {
  if (!next?.first_aired || new Date(next.first_aired) > now) return undefined;
  return { type: 'episode' as const, id: next.ids.trakt };
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
  const network = show.network
    ? { name: show.network, href: popular('networks', networkSlug(show.network)) }
    : undefined;
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
    studios: studios.map(({ name, ids }) => ({ name, href: popular('studio_ids', ids.trakt) })),
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

/** Everything the show summary shows, from the loader's API responses. */
export function toShowSummary(params: ShowSummaryParams) {
  const { show, stats, seasons, now, datePreferences } = params;
  const slug = show.ids.slug;
  const href = `/shows/${slug}`;
  const timeZone = params.signedIn ? datePreferences.timeZone : (show.airs?.timezone ?? datePreferences.timeZone);
  const format = (date: string, options: Parameters<typeof formatDate>[1]) =>
    formatDate(date, { ...datePreferences, timeZone, ...options });
  const day = (date: string) => format(date, { format: 'LL' });
  const airs = (date: string) => format(date, { format: 'dddd', time: true }).replace(' ', ' at ');

  // Unaired shows show no ratings and only their list count, whatever the viewer's early-ratings setting.
  const aired = !!show.first_aired && new Date(show.first_aired) <= now;

  const episodeCard = (episode: EpisodeResponse): EpisodeCard => {
    const label = params.episodeTypeTags ? episodeType(episode) : undefined;
    const tags: Tag[] = [
      ...(label ? [label] : []),
      ...(episode.first_aired ? [{ text: format(episode.first_aired, { format: 'll', time: true }) }] : []),
    ];
    return {
      id: episode.ids.trakt,
      collectionContext: { show: show.ids.trakt, number: episode.season, episode: episode.number },
      href: `${href}/seasons/${episode.season}/episodes/${episode.number}`,
      number: episodeNumber(episode, show.genres),
      title: episode.title ?? `Episode ${episode.number}`,
      image: imageUrl(episode.images?.screenshot?.at(0), 'thumb'),
      spoilerImage: imageUrl(show.images?.fanart?.at(0), 'thumb'),
      tags,
      rating: episode.rating ?? 0,
      released: !!episode.first_aired && new Date(episode.first_aired) <= now,
      runtime: episode.runtime ?? show.runtime ?? undefined,
    };
  };
  const recent = recentEpisodes(params);

  const seasonCards: SeasonCard[] = seasons.map((season) => ({
    id: season.ids.trakt,
    number: season.number,
    href: `${href}/seasons/${season.number}`,
    title: season.title ?? seasonName(season.number),
    fullTitle: `${show.title} ${season.title ?? `Season ${season.number}`}`,
    image: imageUrl(season.images?.poster?.at(0), 'thumb'),
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
    fanart: imageUrl(show.images?.fanart?.at(0), 'full'),
    poster: imageUrl(show.images?.poster?.at(0), 'medium'),
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
      .filter(({ first_aired }) => first_aired && new Date(first_aired) <= params.now)
      .sort((a, b) => a.season - b.season || a.number - b.number)
      .map(({ ids }) => ids.trakt),
    /** The viewer's last watched episode ("3x02"), for a dropped show's stamp. */
    lastSeen: params.progress?.last ? episodeNumber(params.progress.last, show.genres) : undefined,
    /** The viewer's next episode to watch once it has aired, for the Check In button. */
    checkin: nextToWatch(params.progress?.next, params.now),
    commentCount: stats?.comments ?? show.comment_count ?? 0,
    listCount: stats?.lists ?? 0,
    facts: facts({ ...params, day, airs }),
    tagline: show.tagline ?? null,
    overview: show.overview ?? null,
    links: toShowLinks({ show: params.show, justwatch: params.rank?.link }),
    cast: toCastMembers(params.people?.cast, params.actorSpoilers),
    guestStars: toCastMembers(params.people?.guest_stars, params.actorSpoilers),
    crew: toCrewGroups(params.people?.crew, params.actorSpoilers),
    recent: {
      upNext: recent.upNext,
      next: recent.next && episodeCard(recent.next),
      aired: recent.recent.map(episodeCard),
    },
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
