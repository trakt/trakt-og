import { collectionMetadataLabel } from '../collection/collectionMetadataLabel.ts';
import type { LibrarySource } from '../collection/LibrarySource.ts';
import { librarySourceIcon } from '../collection/librarySourceIcon.ts';
import type { LibraryTipData } from '../collection/LibraryTipData.ts';
import type { OverlayState } from '../../overlay/createOverlay.svelte.ts';
import { countLabel } from '../../utils/countLabel.ts';
import { formatDate, type FormatDateOptions } from '../../utils/formatDate.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import { isUnknownDate } from '../../utils/isUnknownDate.ts';
import { playsLines } from './playsLines.ts';
import type { WatchedPlays } from './WatchedPlays.ts';
import type { WatchedProgress } from './WatchedProgress.ts';

/** How each quick icon renders. `watched` and `collected` are 0 to 1: shows and seasons fill in proportion. */
export type QuickIconFill = {
  watched: number;
  collected: number;
  listed: boolean;
  favorited: boolean;
  rewatching: boolean;
  /** The media servers a library item was synced from, whose icon stands in for the library one. */
  sources?: readonly LibrarySource[];
  /** The done-state tooltips, one line per `\n`. Left out, the icon keeps its idle "Add to ..." tooltip. */
  titles: Partial<Record<'watched' | 'collected' | 'listed' | 'favorited', string>>;
  /**
   * The watched and library tooltips drawn out: a show's progress runs or a movie's plays, the library with its logos
   * and server.
   */
  tips: Readonly<{
    watched?: readonly WatchedProgress[];
    plays?: WatchedPlays;
    collected?: LibraryTipData;
    /** When it was favorited, for its one-line tooltip. */
    favorited?: string;
  }>;
};

type QuickIconFillParams = {
  state: OverlayState;
  /** Shows and seasons: the aired episode count, so partial progress fills the icon partway. */
  airedEpisodes?: number;
  /** Minutes, so a movie's tooltip can total its plays. */
  runtime?: number;
  /** Seasons say "collected" where shows say "in library". */
  season?: boolean;
  /** The viewer's shared layout datePreferences. */
  adjustRewatching?: boolean;
  datePreferences?: Pick<FormatDateOptions, 'order' | 'hour24' | 'timeZone'>;
};

const fraction = (done: number | undefined, total: number | undefined, whole: boolean | undefined) => {
  if (done !== undefined && total) return Math.min(done / total, 1);
  return whole ? 1 : 0;
};

// OG's show and season tooltips (`global.js:830-892`): "60% watched", "12 / 20 episodes", "8 remaining".
function progressTitle(done: number | undefined, aired: number | undefined, verb: string, includeZero = false) {
  if (done === undefined || (!done && !includeZero) || !aired) return undefined;
  const left = aired - done;
  return [
    `${Math.floor(Math.min(done / aired, 1) * 100)}% ${verb}`,
    `${done} / ${countLabel(aired, 'episode')}`,
    ...(left > 0 ? [`${left.toLocaleString('en-US')} remaining`] : []),
  ].join('\n');
}

function watchedTitle(params: QuickIconFillParams, includeZero = false): string | undefined {
  const { state, airedEpisodes, runtime } = params;
  if (!state.plays) {
    if (state.rewatching && state.rewatchedEpisodes !== undefined) {
      const full = watchedTitle({ ...params, state: { ...state, rewatching: false } });
      const rewatch = watchedTitle(
        {
          ...params,
          state: {
            ...state,
            rewatching: false,
            watchedEpisodes: state.rewatchedEpisodes,
            watchedPlays: state.rewatchedPlays,
          },
        },
        true,
      );
      return [rewatch?.replace('watched', 'rewatched'), full].filter(Boolean).join('\n\n') || undefined;
    }
    const progress = progressTitle(state.watchedEpisodes, airedEpisodes, 'watched', includeZero);
    if (!progress || state.watchedPlays === undefined) return progress;
    const lines = progress.split('\n');
    const remaining = Math.max((airedEpisodes ?? 0) - (state.watchedEpisodes ?? 0), 0);
    return [
      ...lines.slice(0, 2),
      `${countLabel(state.watchedPlays, 'play')}${runtime ? ` (${formatRuntime(state.watchedPlays * runtime)})` : ''}`,
      ...(remaining ? [`${remaining} remaining${runtime ? ` (${formatRuntime(remaining * runtime)})` : ''}`] : []),
    ].join('\n');
  }
  const { lead, at, plays, time } = playsLines(playsTip(params, state.plays));
  const detail = plays ? `${plays}${time ? ` (${time})` : ''}` : time;
  return [at ? `${lead} on ${at}` : lead, detail].filter(Boolean).join('\n');
}

/** A movie's or episode's plays, with the last one's date unless it's OG's unknown one. */
function playsTip({ state, runtime, datePreferences }: QuickIconFillParams, count: number): WatchedPlays {
  const last = state.lastWatchedAt;
  return {
    count,
    minutes: runtime && count * runtime,
    at: last && !isUnknownDate(last) ? formatDate(last, datePreferences) : undefined,
  };
}

function collectedTitle({ state, airedEpisodes, season, datePreferences }: QuickIconFillParams) {
  const source = librarySourceIcon(state.collectionSources);
  const synced = source && `Synced from ${source.name}`;
  if (state.collectedAt) {
    return [
      state.collectedAt.startsWith('1970-01-01')
        ? 'Added to library on\nUnknown date'
        : `Added to library on\n${formatDate(state.collectedAt, datePreferences)}`,
      collectionMetadataLabel(state.collectionMetadata),
      synced,
    ]
      .filter(Boolean)
      .join('\n');
  }
  const progress = progressTitle(state.collectedEpisodes, airedEpisodes, season ? 'collected' : 'in library');
  return progress && [progress, synced].filter(Boolean).join('\n');
}

function showRun(params: QuickIconFillParams, verb: WatchedProgress['verb'], includeZero = false) {
  const { state, airedEpisodes: aired, runtime } = params;
  const done = state.watchedEpisodes;
  if (done === undefined || (!done && !includeZero) || !aired) return undefined;
  const plays = state.watchedPlays;
  return {
    verb,
    percent: Math.floor(Math.min(done / aired, 1) * 100),
    completed: done,
    aired,
    plays,
    minutes: runtime && plays !== undefined ? plays * runtime : undefined,
  };
}

// A show's watched tooltip as progress runs, a rewatch over the whole show. A movie keeps its text tooltip.
function watchedTips(params: QuickIconFillParams): readonly WatchedProgress[] | undefined {
  const { state } = params;
  if (state.plays) return undefined;
  if (state.rewatching && state.rewatchedEpisodes !== undefined) {
    const rewatch = showRun(
      {
        ...params,
        state: { ...state, watchedEpisodes: state.rewatchedEpisodes, watchedPlays: state.rewatchedPlays },
      },
      'rewatched',
      true,
    );
    const runs = [rewatch, showRun(params, 'watched')].filter((run) => run !== undefined);
    return runs.length > 0 ? runs : undefined;
  }
  const run = showRun(params, 'watched');
  return run && [run];
}

function collectedTip(
  { state, airedEpisodes }: QuickIconFillParams,
  added: string | undefined,
): LibraryTipData | undefined {
  const extras = { metadata: state.collectionMetadata, sources: state.collectionSources };
  if (state.collectedAt) return { added: isUnknownDate(state.collectedAt) ? null : added, ...extras };
  const done = state.collectedEpisodes;
  return done && airedEpisodes ? { episodes: { done, aired: airedEpisodes }, ...extras } : undefined;
}

// OG: "Manage lists" once anything is in a personal list, else "Remove from watchlist".
function listedTitle({ state }: QuickIconFillParams) {
  if (state.listed) return 'Manage lists';
  return state.watchlisted ? 'Remove from watchlist' : undefined;
}

/** Maps a poster's overlay state onto the quick-icon bar. Unknown state renders idle. */
export function quickIconFill(params: QuickIconFillParams): QuickIconFill {
  const { state, airedEpisodes } = params;
  const favoritedAt =
    state.favorited && state.favoritedAt ? formatDate(state.favoritedAt, params.datePreferences) : undefined;
  const titles: QuickIconFill['titles'] = {
    watched: watchedTitle(params),
    collected: collectedTitle(params),
    listed: listedTitle(params),
    favorited: state.favorited ? (favoritedAt ? `Favorited on ${favoritedAt}` : 'Favorited') : undefined,
  };

  return {
    watched: fraction(
      params.adjustRewatching !== false && state.rewatching
        ? (state.rewatchedEpisodes ?? state.watchedEpisodes)
        : state.watchedEpisodes,
      airedEpisodes,
      state.watched,
    ),
    collected: fraction(state.collectedEpisodes, airedEpisodes, state.collected),
    // OG lit the list icon for the watchlist and for personal lists alike.
    listed: Boolean(state.watchlisted || state.listed),
    favorited: Boolean(state.favorited),
    rewatching: Boolean(state.rewatching),
    sources: state.collectionSources,
    titles,
    tips: {
      watched: watchedTips(params),
      plays: state.plays ? playsTip(params, state.plays) : undefined,
      collected: collectedTip(params, state.collectedAt && formatDate(state.collectedAt, params.datePreferences)),
      favorited: favoritedAt,
    },
  };
}
