import type { ComponentProps } from 'svelte';
import type FanartCard from '../../components/media/FanartCard.svelte';
import { episodeNumber, episodeType } from '../../components/media/episodeTags.ts';
import { progressPercent } from '../../components/media/progressPercent.ts';
import type { TickRun } from '../../components/media/TickRun.ts';
import { tickRuns } from '../../components/media/tickRuns.ts';
import type { DatePreferences } from '../../settings/DatePreferences.ts';
import type { CatalogEpisode } from '../../shows/cache/ShowCatalog.ts';
import { formatDate } from '../../utils/formatDate.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import { mediaImage } from '../../images/mediaImage.ts';
import { relativeDate } from '../../utils/relativeDate.ts';
import type { ProgressItem } from './ProgressItem.ts';
import { seasonRuns } from './seasonRuns.ts';
import { type ProgressSeason, toProgressSeasons } from './toProgressSeasons.ts';
import { capitalize } from '../../utils/capitalize.ts';
import { isUnknownDate } from '../../utils/isUnknownDate.ts';

type Tag = NonNullable<ComponentProps<typeof FanartCard>['tags']>[number];

/** The row's up-next card: the next episode as a fanart card, with its quick icons. */
export type ProgressUpNext = {
  /** "3x01", or "3x01 (669)" for anime. */
  readonly number: string;
  readonly title: string;
  readonly href: string;
  readonly image?: string;
  /** The show's fanart, in place of an unwatched episode's screenshot when spoilers are hidden. */
  readonly spoilerImage?: string;
  /** "Up next", then its episode type. */
  readonly tags: readonly Tag[];
  /** The Trakt rating, 0 to 10. */
  readonly rating?: number;
  readonly released: boolean;
  readonly target: {
    readonly type: 'episode';
    readonly id: number;
    readonly title: string;
    readonly season: { readonly show: number; readonly number: number; readonly episode: number };
    /** Minutes, the show's when the episode has none, so the watched tooltip can total the plays. */
    readonly runtime?: number;
    readonly rewatchNext?: boolean;
  };
};

/** One show on the progress page. */
export type ProgressRow = {
  readonly id: number;
  readonly title: string;
  readonly year?: number;
  readonly href: string;
  readonly poster?: string;
  /** The card's artwork once every episode is done, or while the next one loads. */
  readonly fanart?: string;
  /** "Returning series", "Ended": the card's title once every episode is done. */
  readonly status?: string;
  /** The show's Trakt rating, 0 to 10. */
  readonly rating?: number;
  readonly percent: number;
  readonly ticks: readonly TickRun[];
  readonly aired: number;
  readonly completed: number;
  readonly left: number;
  readonly plays: number;
  /** "1d 3h", Watched only. "~" in front while it's an estimate from the show's runtime. */
  readonly watchedTime: string;
  readonly leftTime: string;
  /** The last watched (or collected) date, with the episode once the row is expanded. */
  readonly last?: {
    readonly number?: string;
    readonly title?: string;
    readonly href?: string;
    readonly relative?: string;
    readonly date: string;
  };
  /** "Dec 1, 2025" on the Dropped tab. */
  readonly droppedOn?: string;
  /** "Jul 2, 2024" while the show is being rewatched. */
  readonly rewatchingSince?: string;
  /** Once the catalog is in: the season lines, and the next episode unless everything's done (Watched only). */
  readonly seasons?: readonly ProgressSeason[];
  /** Once the catalog is in: the seasons hidden from this tab, which the season list offers back. */
  readonly hiddenSeasons?: readonly ProgressSeason[];
  /** How many seasons are hidden and which ("Seasons 7 to 8"), before the catalog is in too. */
  readonly hidden?: { readonly count: number; readonly names: string };
  readonly upNext?: ProgressUpNext;
};

type ToProgressRowParams = {
  item: ProgressItem;
  datePreferences: DatePreferences;
  now: Date;
};

const runtime = (minutes: number, exact: boolean) => `${exact ? '' : '~'}${formatRuntime(minutes)}`;

/** Without seasons, the watched share from the left, which is how the ticks look when episodes go in order. */
const countRuns = (completed: number, aired: number) =>
  tickRuns([
    ...Array.from({ length: Math.min(completed, aired) }, () => true),
    ...Array.from({ length: Math.max(aired - completed, 0) }, () => false),
  ]);

/** The API's episode fields that `episodeType` and `episodeNumber` read. */
export const tagged = (episode: CatalogEpisode) => ({
  season: episode.season,
  number: episode.number,
  episode_type: episode.type,
  number_abs: episode.numberAbs,
});

function toUpNext({ item, now }: ToProgressRowParams): ProgressUpNext | undefined {
  const { show, detail } = item;
  const episode = item.next ?? detail?.next;
  if (!episode) return undefined;

  const label = episodeType(tagged(episode));
  const number = episodeNumber(tagged(episode), show.genres);
  return {
    number,
    title: episode.title ?? '',
    href: `/shows/${show.slug}/seasons/${episode.season}/episodes/${episode.number}`,
    image: mediaImage({
      type: 'episode',
      id: episode.id,
      slot: 'screenshot',
      size: 'medium',
      fallback: mediaImage({ type: 'show', id: show.id, slot: 'fanart', size: 'medium' }),
    }),
    spoilerImage: mediaImage({ type: 'show', id: show.id, slot: 'fanart', size: 'medium' }),
    tags: [{ text: 'Up next', kind: 'primary' }, ...(label ? [label] : [])],
    rating: episode.rating,
    released: episode.firstAired !== undefined && Date.parse(episode.firstAired) <= now.getTime(),
    target: {
      type: 'episode',
      id: episode.id,
      title: `${show.title} ${number}`,
      season: { show: show.id, number: episode.season, episode: episode.number },
      runtime: episode.runtime ?? show.runtime,
      rewatchNext: item.resetAt !== undefined,
    },
  };
}

function toLast({ item, datePreferences, now }: ToProgressRowParams, showHref: string): ProgressRow['last'] {
  const at = item.lastAt;
  if (!at) return undefined;

  const episode = item.last ?? item.detail?.last;
  const unknown = isUnknownDate(at);
  return {
    ...(episode && {
      number: episodeNumber(tagged(episode), item.show.genres),
      title: episode.title ? `"${episode.title}"` : undefined,
      href: `${showHref}/seasons/${episode.season}/episodes/${episode.number}`,
    }),
    relative: unknown ? undefined : relativeDate(at, now),
    date: unknown ? 'Unknown date' : formatDate(at, { ...datePreferences, time: true }),
  };
}

/** Maps a show's progress onto OG's row: poster, tick bar, counts, and, once expanded, seasons and the next episode. */
export function toProgressRow(params: ToProgressRowParams): ProgressRow {
  const { item, datePreferences } = params;
  const { show, detail } = item;
  const href = `/shows/${show.slug}`;
  const seasons = detail?.seasons ?? [];
  const next = item.next ?? detail?.next;
  const episodeStates = seasons.flatMap(({ episodes }) => episodes.map(({ done }) => done));

  return {
    id: show.id,
    title: show.title,
    year: show.year,
    href,
    poster: mediaImage({ type: 'show', id: show.id, slot: 'poster', size: 'thumb' }),
    fanart: mediaImage({ type: 'show', id: show.id, slot: 'fanart', size: 'medium' }),
    status: show.status && capitalize(show.status),
    rating: show.rating,
    percent: progressPercent(item),
    ticks: episodeStates.length > 0 ? tickRuns(episodeStates) : countRuns(item.completed, item.aired),
    aired: item.aired,
    completed: item.completed,
    left: Math.max(item.aired - item.completed, 0),
    plays: item.plays,
    watchedTime: runtime(item.minutesWatched, item.exact),
    leftTime: runtime(item.minutesLeft, item.exact),
    last: toLast(params, href),
    droppedOn: item.droppedAt ? formatDate(item.droppedAt, { ...datePreferences, format: 'll' }) : undefined,
    rewatchingSince: item.resetAt ? formatDate(item.resetAt, { ...datePreferences, format: 'll' }) : undefined,
    seasons:
      detail &&
      toProgressSeasons({
        seasons,
        next: next && { season: next.season, number: next.number },
        showHref: href,
        datePreferences,
      }),
    hiddenSeasons: detail && toProgressSeasons({ seasons: detail.hidden, showHref: href, datePreferences }),
    hidden: item.hiddenSeasons && { count: item.hiddenSeasons.length, names: seasonRuns(item.hiddenSeasons) },
    upNext: toUpNext(params),
  };
}
