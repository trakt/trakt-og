import { dayIn } from '../calendars/calendarDays.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { playRuntime } from '../users/playRuntime.ts';
import { toGenreBar } from '../users/profile/toGenreBar.ts';
import type { WatchedGenreRow } from '../users/profile/watchedGenresSchema.ts';
import { countLabel } from '../utils/countLabel.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import type { LastThirtyDays, MinutesChartData, MinutesDay } from './LastThirtyDays.ts';

type Ids = { readonly ids: { readonly trakt: number }; readonly runtime?: number | null };

type EpisodeRow = {
  readonly watched_at: string;
  readonly episode: Ids;
  readonly show: { readonly ids: { readonly trakt: number }; readonly runtime?: number | null };
};
type MovieRow = { readonly watched_at: string; readonly movie: Ids };

type ToLastThirtyDaysParams = {
  episodes: readonly EpisodeRow[];
  movies: readonly MovieRow[];
  genres: readonly WatchedGenreRow[];
  /** The history window's start, where the genre links start too. */
  start: string;
  /** The viewer's slug, for the history links. */
  slug: string;
  now: Date;
  timeZone: string;
  /** Where the week brackets start, Sunday = 0. */
  weekStartDay: DatePreferences['weekStartDay'];
};

type Play = {
  readonly type: 'episode' | 'movie';
  readonly id: number;
  /** The show, for an episode. */
  readonly show?: number;
  readonly date: string;
  readonly minutes: number;
};

/** OG's `watched_minutes_per_day(30)`: today and the 29 days before it. */
const DAYS = 30;
const DAY = 86_400_000;
/** The scale tops out at two hours or more, and draws up to four hour lines. */
const MIN_TOP = 120;
const MAX_LINES = 4;

const shiftDate = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);

const part = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });
const dayOfMonth = (date: string) => Number(date.slice(8));
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();
/** "Sep 6". */
const shortDate = (date: string) => `${part(date, { month: 'short' })} ${dayOfMonth(date)}`;
const dayLabel = (date: string) => `${part(date, { weekday: 'long' })} — ${shortDate(date)}`;

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);
const minutesOf = (plays: readonly Play[]) => sum(plays.map(({ minutes }) => minutes));
const ofType = (plays: readonly Play[], type: Play['type']) => plays.filter((play) => play.type === type);
const unique = (values: readonly (number | undefined)[]) => new Set(values.filter((value) => value !== undefined)).size;

/** "3 episodes (4 plays)": the unique items, with the plays when some were replays. */
function playCount(plays: readonly Play[], type: Play['type']) {
  const items = unique(plays.map(({ id }) => id));
  return `${countLabel(items, type)}${plays.length > items ? ` (${countLabel(plays.length, 'play')})` : ''}`;
}

// A tooltip line, for a type played that day: "3 episodes (4 plays) · 1h 7m".
function dayLines(plays: readonly Play[]) {
  return (['episode', 'movie'] as const)
    .map((type) => ({ type, mine: ofType(plays, type) }))
    .filter(({ mine }) => mine.length > 0)
    .map(({ type, mine }) => ({ type, text: `${playCount(mine, type)} · ${formatRuntime(minutesOf(mine))}` }));
}

function axis(date: string, i: number): Pick<MinutesDay, 'axis' | 'mark'> {
  if (i === DAYS - 1) return { axis: 'Today', mark: 'today' };
  if (i === 0 || dayOfMonth(date) === 1) return { axis: shortDate(date), mark: 'month' };
  const day = weekday(date);
  return { axis: String(dayOfMonth(date)), mark: day === 0 || day === 6 ? 'weekend' : null };
}

/** Whole hours, stepped so no more than four lines fit, from the busiest day up. */
function scale(busiest: number) {
  const step = Math.ceil(busiest / 60 / MAX_LINES) * 60;
  const top = Math.max(MIN_TOP, Math.ceil(busiest / step) * step);
  const hours = Array.from({ length: top / step }, (_, i) => (i + 1) * step);
  return { top, hours: hours.map((minutes) => ({ label: `${minutes / 60}h`, height: (minutes / top) * 100 })) };
}

type Week = { readonly dates: readonly string[]; readonly minutes: number; readonly best: boolean };

/** The 30 days in runs that start on the viewer's first day of the week, with their totals and the best one. */
function toWeeks(
  { dates, weekStartDay, minutesOn }: {
    dates: readonly string[];
    weekStartDay: number;
    minutesOn: (date: string) => number;
  },
): readonly Week[] {
  const runs = dates.reduce<readonly (readonly string[])[]>(
    (weeks, date, i) =>
      i === 0 || weekday(date) === weekStartDay
        ? [...weeks, [date]]
        : [...weeks.slice(0, -1), [...(weeks.at(-1) ?? []), date]],
    [],
  );
  const totals = runs.map((run) => sum(run.map(minutesOn)));
  // Ties go to the earliest week.
  const best = totals.indexOf(Math.max(...totals));
  return runs.map((run, i) => ({ dates: run, minutes: totals.at(i) ?? 0, best: i === best }));
}

/** "Sep 13 to 19", "Sep 27 to Oct 3". */
function weekRange({ dates }: Week) {
  const first = dates.at(0) ?? '';
  const last = dates.at(-1) ?? first;
  if (first === last) return shortDate(first);
  return `${shortDate(first)} to ${first.slice(0, 7) === last.slice(0, 7) ? dayOfMonth(last) : shortDate(last)}`;
}

function toChart(
  { dates, playsOn, active, weeks, slug }: {
    dates: readonly string[];
    playsOn: (date: string) => readonly Play[];
    active: number;
    weeks: readonly Week[];
    slug: string;
  },
): MinutesChartData {
  const minutesOn = (date: string) => minutesOf(playsOn(date));
  const { top, hours } = scale(Math.max(...dates.map(minutesOn)));
  const average = Math.round(sum(dates.map(minutesOn)) / active);

  return {
    days: dates.map((date, i): MinutesDay => {
      const played = playsOn(date);
      return {
        date,
        minutes: minutesOn(date),
        episodes: (minutesOf(ofType(played, 'episode')) / top) * 100,
        movies: (minutesOf(ofType(played, 'movie')) / top) * 100,
        time: formatRuntime(minutesOn(date)),
        label: dayLabel(date),
        lines: dayLines(played),
        ...axis(date, i),
        href: `/users/${slug}/history?${new URLSearchParams({ start_at: date, days: '1' })}`,
      };
    }),
    weeks: weeks.map(({ dates: run, minutes, best }) => ({
      span: run.length,
      time: minutes > 0 ? formatRuntime(minutes) : '',
      best,
    })),
    hours,
    average: { label: `${formatRuntime(average)} average day`, height: (average / top) * 100 },
  };
}

function toKeys({ plays, active, weeks }: { plays: readonly Play[]; active: number; weeks: readonly Week[] }) {
  const episodes = ofType(plays, 'episode');
  const movies = ofType(plays, 'movie');
  const items = (mine: readonly Play[]) => unique(mine.map(({ id }) => id));
  const replays = (mine: readonly Play[]) => (mine.length > items(mine) ? [countLabel(mine.length, 'play')] : []);
  const timeOf = (mine: readonly Play[]) => (mine.length > 0 ? [formatRuntime(minutesOf(mine))] : []);
  const best = weeks.find((week) => week.best);

  return [
    { name: 'Time watched', share: formatRuntime(minutesOf(plays)), counts: [`${active} of ${DAYS} days`] },
    {
      name: 'Episodes',
      type: 'episode' as const,
      share: items(episodes).toLocaleString('en-US'),
      counts: [
        ...timeOf(episodes),
        ...(episodes.length > 0 ? [countLabel(unique(episodes.map(({ show }) => show)), 'show')] : []),
        ...replays(episodes),
      ],
    },
    {
      name: 'Movies',
      type: 'movie' as const,
      share: items(movies).toLocaleString('en-US'),
      counts: [...timeOf(movies), ...replays(movies)],
    },
    ...(best ? [{ name: 'Best week', share: formatRuntime(best.minutes), counts: [weekRange(best)] }] : []),
  ];
}

/**
 * The Last 30 Days panel from the viewer's recent plays: each play's runtime summed on its day in the viewer's zone,
 * as OG's `watched_minutes_per_day` did, split into episodes and movies, with week totals, the average day and the
 * keys over it, and the watched genres. The scale tops out at the busiest day rounded up to the hour, two at least.
 */
export function toLastThirtyDays(
  { episodes, movies, genres, start, slug, now, timeZone, weekStartDay }: ToLastThirtyDaysParams,
): LastThirtyDays {
  const today = dayIn(now.toISOString(), timeZone);
  const dates = Array.from({ length: DAYS }, (_, i) => shiftDate(today, i - DAYS + 1));
  const first = dates.at(0) ?? today;

  const plays = [
    ...episodes.map((row): Play => ({
      type: 'episode',
      id: row.episode.ids.trakt,
      show: row.show.ids.trakt,
      date: dayIn(row.watched_at, timeZone),
      minutes: playRuntime(row),
    })),
    ...movies.map((row): Play => ({
      type: 'movie',
      id: row.movie.ids.trakt,
      date: dayIn(row.watched_at, timeZone),
      minutes: playRuntime(row),
    })),
  ].filter(({ date }) => date >= first && date <= today);
  const genreBars = genres.map((row) => toGenreBar(row, { slug, startAt: start.slice(0, 10) }));
  if (minutesOf(plays) === 0) return { chart: null, keys: [], genres: genreBars };

  const byDate = Map.groupBy(plays, ({ date }) => date);
  const playsOn = (date: string) => byDate.get(date) ?? [];
  const weeks = toWeeks({ dates, weekStartDay, minutesOn: (date) => minutesOf(playsOn(date)) });
  const active = byDate.size;

  return {
    chart: toChart({ dates, playsOn, active, weeks, slug }),
    keys: toKeys({ plays, active, weeks }),
    genres: genreBars,
  };
}
