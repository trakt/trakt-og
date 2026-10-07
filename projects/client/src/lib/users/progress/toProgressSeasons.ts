import type { DatePreferences } from '../../settings/DatePreferences.ts';
import { formatDate } from '../../utils/formatDate.ts';
import { formatRuntime } from '../../utils/formatRuntime.ts';
import type { ProgressSeasonData } from './ProgressItem.ts';
import type { ProgressType } from './progressTypes.ts';

export type EpisodeSquareState = 'watched' | 'not-watched' | 'up-next' | 'not-aired';

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
  /** "Sep 29, 2026 · 52m · 81% · watched": its tooltip's second line, under the code and title. */
  readonly readout: string;
};

/** One season line in an open progress row. */
export type ProgressSeason = {
  readonly number: number;
  /** "Season 1", or "Specials". */
  readonly name: string;
  readonly href: string;
  /** Done of aired, 0 to 100, floored like the show's. */
  readonly percent: number;
  readonly complete: boolean;
  /** Nothing has aired yet. */
  readonly announced: boolean;
  /** "11/25 · 5h 8m left", "22/22" or "3 announced". */
  readonly summary: string;
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

function summary(season: ProgressSeasonData, type: ProgressType): string {
  if (season.aired === 0) return `${season.upcoming.length} announced`;
  const done = `${season.completed}/${season.aired}`;
  if (type === 'library' || season.completed >= season.aired) return done;
  return `${done} · ${formatRuntime(season.minutesLeft)} left`;
}

type Episode = {
  number: number;
  title?: string;
  firstAired?: string;
  runtime?: number;
  rating?: number;
  aired: boolean;
  done: boolean;
  collected: boolean;
  at?: string;
};

function toSquare(
  { season, episode, next, showHref, type, datePreferences }:
    & Omit<ToProgressSeasonsParams, 'seasons'>
    & { season: number; episode: Episode },
): EpisodeSquare {
  const { number, title, firstAired, runtime, rating, aired, done, at } = episode;
  const state: EpisodeSquareState = !aired
    ? 'not-aired'
    : done
    ? 'watched'
    : next?.season === season && next.number === number
    ? 'up-next'
    : 'not-watched';
  const collected = type !== 'library' && !done && episode.collected;
  const day = (date: string | undefined) =>
    date && Date.parse(date) !== UNKNOWN_DATE ? formatDate(date, { ...datePreferences, format: 'll' }) : undefined;
  const airs = day(firstAired) ?? 'TBA';
  const doneWord = type === 'library' ? 'in your library' : 'watched';
  const status = {
    watched: [doneWord, day(at)].filter(Boolean).join(type === 'library' ? ', added ' : ' '),
    'not-watched': type === 'library' ? 'not in your library' : 'not watched',
    'up-next': 'up next',
    'not-aired': `airs ${airs}`,
  }[state];
  const library = collected ? 'in your library' : undefined;
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
      library,
      aired && state !== 'watched' && `aired ${airs}`,
    ].filter(Boolean).join(', '),
    readout: [
      aired && airs,
      runtime ? formatRuntime(runtime) : undefined,
      rating !== undefined && `${Math.trunc(rating * 10)}%`,
      status,
      library,
    ].filter(Boolean).join(' · '),
  };
}

/** Maps an open row's seasons onto its season lines: a link, percent and summary, and a square an episode. */
export function toProgressSeasons(params: ToProgressSeasonsParams): readonly ProgressSeason[] {
  return params.seasons.map((season): ProgressSeason => {
    const episodes: readonly Episode[] = [
      ...season.episodes.map((episode) => ({ ...episode, aired: true })),
      ...season.upcoming.map((episode) => ({ ...episode, aired: false, done: false, collected: false })),
    ].toSorted((a, b) => a.number - b.number);

    return {
      number: season.number,
      name: season.number === 0 ? 'Specials' : `Season ${season.number}`,
      href: `${params.showHref}/seasons/${season.number}`,
      percent: season.aired === 0 ? 0 : Math.floor(season.completed / season.aired * 100),
      complete: season.aired > 0 && season.completed >= season.aired,
      announced: season.aired === 0,
      summary: summary(season, params.type),
      squares: episodes.map((episode) => toSquare({ ...params, season: season.number, episode })),
    };
  });
}
