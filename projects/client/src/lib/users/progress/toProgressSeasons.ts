import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { formatDate } from '../../utils/formatDate.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import type { ProgressSeasonData } from './ProgressItem.ts';
import type { ProgressType } from './progressTypes.ts';

export type EpisodeSquareState = 'watched' | 'not-watched' | 'up-next' | 'not-aired';

/** A status line in a square's tooltip, after a dash in its meaning color. */
export type EpisodeTipLine = {
  readonly text: string;
  readonly tone: 'watched' | 'collected' | 'next' | 'muted';
};

/** One numbered square in an open season's grid. */
export type EpisodeSquare = {
  readonly number: number;
  /** "3x01", which also keys the square. */
  readonly code: string;
  readonly title?: string;
  readonly href: string;
  readonly state: EpisodeSquareState;
  /** Not watched but in your library: the library's color. Watched wins, and the Library tab never sets it. */
  readonly collected: boolean;
  /** `3x01 "Title", watched Sep 29, 2026`: the square's accessible name. */
  readonly label: string;
  /** The tooltip's screenshot. */
  readonly image?: string;
  /** "Sep 2, 2026 · 52m · 81%" under the tooltip's title, once it has aired. */
  readonly meta?: string;
  readonly lines: readonly EpisodeTipLine[];
};

/** One season in an open progress row: its heading line, then a square an episode. */
export type ProgressSeason = {
  readonly number: number;
  /** "Season 1", or "Specials". */
  readonly name: string;
  /** The season's own title, when it's more than its name ("The Streets"). */
  readonly title?: string;
  readonly href: string;
  /** Done of aired, 0 to 100, floored like the show's. */
  readonly percent: number;
  readonly complete: boolean;
  /** "11/25" done of aired. */
  readonly count: string;
  /** "5h 8m" left to watch, on Watched while anything is. */
  readonly timeLeft?: string;
  /** Announced episodes, while nothing has aired. */
  readonly announced?: number;
  readonly squares: readonly EpisodeSquare[];
};

type ToProgressSeasonsParams = {
  seasons: readonly ProgressSeasonData[];
  /** The up-next episode, by season and number. */
  next?: { readonly season: number; readonly number: number };
  showHref: string;
  type: ProgressType;
  datePreferences: DatePreferences;
};

const UNKNOWN_DATE = Date.parse('1970-01-01T00:00:00Z');
const code = (season: number, number: number) => `${season}x${String(number).padStart(2, '0')}`;
const seasonName = (number: number) => number === 0 ? 'Specials' : `Season ${number}`;

type Episode = {
  number: number;
  title?: string;
  firstAired?: string;
  runtime?: number;
  rating?: number;
  screenshot?: string;
  aired: boolean;
  done: boolean;
  collected: boolean;
  plays: number;
  at?: string;
};

function toSquare(
  { season, episode, next, showHref, type, datePreferences }:
    & Omit<ToProgressSeasonsParams, 'seasons'>
    & { season: number; episode: Episode },
): EpisodeSquare {
  const { number, title, firstAired, runtime, rating, aired, done, plays, at } = episode;
  const state: EpisodeSquareState = !aired
    ? 'not-aired'
    : done
    ? 'watched'
    : next?.season === season && next.number === number
    ? 'up-next'
    : 'not-watched';
  const library = type === 'library';
  const collected = !library && !done && episode.collected;
  const day = (date: string | undefined) =>
    date && Date.parse(date) !== UNKNOWN_DATE ? formatDate(date, { ...datePreferences, format: 'll' }) : undefined;
  const airs = day(firstAired) ?? 'TBA';
  const doneAt = day(at);
  const doneWord = library ? 'in your library' : 'watched';
  const status = {
    watched: [doneWord, doneAt].filter(Boolean).join(library ? ', added ' : ' '),
    'not-watched': library ? 'not in your library' : 'not watched',
    'up-next': 'up next',
    'not-aired': `airs ${airs}`,
  }[state];
  const playsText = !library && plays > 1 ? ` · ${plays} plays` : '';
  const statusLine: EpisodeTipLine = {
    watched: {
      text: library ? `In your library${doneAt ? `, added ${doneAt}` : ''}` : `Watched${doneAt ? ` ${doneAt}` : ''}`,
      tone: library ? 'collected' : 'watched',
    } as const,
    'not-watched': { text: library ? 'Not in your library' : 'Not watched', tone: 'muted' } as const,
    'up-next': { text: 'Up next', tone: 'next' } as const,
    'not-aired': { text: `Airs ${airs}`, tone: 'muted' } as const,
  }[state];
  const episodeCode = code(season, number);

  return {
    number,
    code: episodeCode,
    title,
    href: `${showHref}/seasons/${season}/episodes/${number}`,
    state,
    collected,
    label: [
      `${episodeCode}${title ? ` "${title}"` : ''}`,
      status,
      collected && 'in your library',
      aired && state !== 'watched' && `aired ${airs}`,
    ].filter(Boolean).join(', '),
    image: imageUrl(episode.screenshot, 'thumb'),
    meta: aired
      ? [airs, runtime ? formatRuntime(runtime) : undefined, rating !== undefined && `${Math.trunc(rating * 10)}%`]
        .filter(Boolean).join(' · ')
      : undefined,
    lines: [
      { ...statusLine, text: statusLine.text + (state === 'watched' ? playsText : '') },
      ...(collected ? [{ text: 'In your library', tone: 'collected' as const }] : []),
    ],
  };
}

/** Maps an open row's seasons onto their headings and squares, a square an episode, aired or announced. */
export function toProgressSeasons(params: ToProgressSeasonsParams): readonly ProgressSeason[] {
  return params.seasons.map((season): ProgressSeason => {
    const episodes: readonly Episode[] = [
      ...season.episodes.map((episode) => ({ ...episode, aired: true })),
      ...season.upcoming.map((episode) => ({ ...episode, aired: false, done: false, collected: false, plays: 0 })),
    ].toSorted((a, b) => a.number - b.number);
    const name = seasonName(season.number);
    const title = season.title?.trim();
    const left = season.aired - season.completed;

    return {
      number: season.number,
      name,
      title: title && title !== name ? title : undefined,
      href: `${params.showHref}/seasons/${season.number}`,
      percent: season.aired === 0 ? 0 : Math.floor(season.completed / season.aired * 100),
      complete: season.aired > 0 && left <= 0,
      count: `${season.completed}/${season.aired}`,
      timeLeft: params.type !== 'library' && left > 0 ? formatRuntime(season.minutesLeft) : undefined,
      announced: season.aired === 0 ? season.upcoming.length : undefined,
      squares: episodes.map((episode) => toSquare({ ...params, season: season.number, episode })),
    };
  });
}
