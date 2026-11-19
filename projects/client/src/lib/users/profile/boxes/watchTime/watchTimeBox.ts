import { formatRuntime } from '../../../../utils/formatRuntime.ts';
import { playRuntime } from '../../../playRuntime.ts';
import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import { fetchWatchHistory } from './fetchWatchHistory.ts';
import WatchTimeBox from './WatchTimeBox.svelte';
import type { WatchChart, WatchTimeView } from './WatchTimeView.ts';

/** Today and the 29 days before it. */
const DAYS = 30;
const DAY = 86_400_000;

/** The window's plays per UTC day, oldest first, and how many of each kind. */
function thirtyDays({ recent, today }: BoxInput) {
  const first = today - DAYS + 1;
  const plays = [...recent.episodes, ...recent.movies]
    .map((play) => ({ day: boxMath.utcDay(play.watched_at), minutes: playRuntime(play), movie: 'movie' in play }))
    .filter(({ day }) => day >= first && day <= today);
  const minutes = Array.from({ length: DAYS }, (_, i) =>
    plays.filter(({ day }) => day === first + i).reduce((sum, play) => sum + play.minutes, 0),
  );
  const counts = minutes.map((_, i) => plays.filter(({ day }) => day === first + i).length);
  const movies = plays.filter(({ movie }) => movie).length;
  return { first, minutes, counts, episodes: plays.length - movies, movies };
}

const total = (minutes: readonly number[]) => minutes.reduce((sum, value) => sum + value, 0);
const activeDays = (minutes: readonly number[]) => minutes.filter((value) => value > 0).length;

/** Days since the newest play, or `null` with none. */
function sinceLastPlay({ latest, today }: BoxInput) {
  const at = [latest.episode?.watched_at, latest.movie?.watched_at]
    .filter((value) => value !== undefined)
    .toSorted()
    .at(-1);
  return at ? boxMath.daysAgo(today, at) : null;
}

/** "104d 7h", or "1y 290d 6h" past a year: no minutes, so the figure fits. */
function longRuntime(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = `${Math.floor((minutes % 1440) / 60)}h`;
  if (days >= 365) return `${Math.floor(days / 365)}y ${days % 365}d ${hours}`;
  return days > 0 ? `${days}d ${hours}` : formatRuntime(minutes);
}

const dayLabel = (day: number) =>
  new Date(day * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const playCount = (plays: number) => `${plays.toLocaleString('en-US')} ${plays === 1 ? 'play' : 'plays'}`;

type Tip = { readonly title: string; readonly plays: string; readonly time: string };

/** Bars scaled to the busiest, which is drawn in full white, each with its two-line tooltip. */
function chart(values: readonly number[], tip: (i: number) => Tip, label: (peak: number) => string): WatchChart {
  const top = Math.max(0, ...values);
  const peak = values.indexOf(top);
  return {
    bars: values.map((value, i) => ({
      height: top > 0 ? (value / top) * 100 : 0,
      peak: top > 0 && i === peak,
      ...tip(i),
    })),
    label: top > 0 ? label(peak) : 'Nothing watched yet.',
  };
}

type History = Awaited<ReturnType<typeof fetchWatchHistory>>;

function toView(input: BoxInput, history: History | undefined): WatchTimeView {
  const { first, minutes, counts, episodes, movies } = thirtyDays(input);
  const spans = history?.every(({ plays }) => plays !== null) ? history : null;
  const plays = spans?.map(({ plays }) => plays ?? 0) ?? [];
  const hours = total(minutes) / 60;
  const { stats } = input;
  // History only counts plays, so a span's time is its plays at the member's average play length.
  const perPlay =
    (stats.episodes.minutes + stats.movies.minutes) / Math.max(stats.episodes.plays + stats.movies.plays, 1);

  const joined = input.profile.joinedAt ? boxMath.daysAgo(input.today, input.profile.joinedAt) : null;

  return {
    opens: joined !== null && joined <= DAYS ? 'month' : 'all',
    month: {
      hours: `${hours >= 10 ? Math.round(hours).toLocaleString('en-US') : hours.toFixed(1)}h`,
      episodes,
      movies,
      activeDays: activeDays(minutes),
      chart: chart(
        minutes,
        (i) => ({
          title: dayLabel(first + i),
          plays: playCount(counts[i] ?? 0),
          time: formatRuntime(minutes[i] ?? 0),
        }),
        (peak) =>
          `Time watched per day for the last 30 days. Busiest: ${dayLabel(first + peak)}, ${formatRuntime(minutes[peak] ?? 0)}.`,
      ),
    },
    allTime: {
      time: longRuntime(stats.episodes.minutes + stats.movies.minutes),
      shows: stats.shows.watched,
      episodes: stats.episodes.watched,
      movies: stats.movies.watched,
      chart: spans
        ? chart(
            plays,
            (i) => ({
              title: spans[i]?.label ?? '',
              plays: playCount(plays[i] ?? 0),
              time: `~${longRuntime(Math.round((plays[i] ?? 0) * perPlay))}`,
            }),
            (peak) => `Plays since joining. Busiest: ${spans[peak]?.label}, ${playCount(plays[peak] ?? 0)}.`,
          )
        : null,
    },
  };
}

/**
 * All time and the last 30 days, pinned: always in the strip, always third. Its score (hours, 80 is a lot, active days and how recent the last play was) only shows in the design demo.
 */
export const watchTimeBox = defineProfileBox({
  key: 'watch-time',
  group: 'numbers',
  pinned: true,
  at: 2,
  floor: true,
  component: WatchTimeBox,
  extra: { load: fetchWatchHistory, when: () => true },
  score: (input) => {
    const { minutes } = thirtyDays(input);
    const hours = total(minutes) / 60;
    const since = sinceLastPlay(input);
    return (
      100 *
      (0.5 * boxMath.cap(hours, 80) +
        0.3 * boxMath.cap(activeDays(minutes), DAYS) +
        0.2 * (since === null ? 0 : boxMath.fresh(since, 7)))
    );
  },
  view: toView,
});
