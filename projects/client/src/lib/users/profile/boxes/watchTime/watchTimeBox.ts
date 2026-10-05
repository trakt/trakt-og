import { countLabel } from '../../../../utils/countLabel.ts';
import { formatRuntime } from '../../../../utils/formatRuntime.ts';
import { playRuntime } from '../../../playRuntime.ts';
import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import WatchTimeBox from './WatchTimeBox.svelte';
import type { WatchTimeView } from './WatchTimeView.ts';

/** Today and the 29 days before it. */
const DAYS = 30;
const DAY = 86_400_000;

/** The window's plays per UTC day, oldest first, and how many of each kind. */
function thirtyDays({ recent, today }: BoxInput) {
  const first = today - DAYS + 1;
  const plays = [...recent.episodes, ...recent.movies]
    .map((play) => ({ day: boxMath.utcDay(play.watched_at), minutes: playRuntime(play), movie: 'movie' in play }))
    .filter(({ day }) => day >= first && day <= today);
  const minutes = Array.from(
    { length: DAYS },
    (_, i) => plays.filter(({ day }) => day === first + i).reduce((sum, play) => sum + play.minutes, 0),
  );
  const movies = plays.filter(({ movie }) => movie).length;
  return { first, minutes, episodes: plays.length - movies, movies };
}

const total = (minutes: readonly number[]) => minutes.reduce((sum, value) => sum + value, 0);
const activeDays = (minutes: readonly number[]) => minutes.filter((value) => value > 0).length;
const dayLabel = (day: number) =>
  new Date(day * DAY).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Days since the newest play, or `null` with none. */
function sinceLastPlay({ latest, today }: BoxInput) {
  const at = [latest.episode?.watched_at, latest.movie?.watched_at].filter((value) => value !== undefined).toSorted()
    .at(-1);
  return at ? boxMath.daysAgo(today, at) : null;
}

/** "1,667d 8h": days and hours only, so the footer fits. */
function longRuntime(minutes: number) {
  const days = Math.floor(minutes / 1440);
  return days > 0 ? `${days.toLocaleString('en-US')}d ${Math.floor((minutes % 1440) / 60)}h` : formatRuntime(minutes);
}

function toView(input: BoxInput): WatchTimeView {
  const { first, minutes, episodes, movies } = thirtyDays(input);
  const hours = total(minutes) / 60;
  const top = Math.max(...minutes);
  const peak = minutes.indexOf(top);
  const { stats } = input;

  return {
    hours: `${hours >= 10 ? Math.round(hours).toLocaleString('en-US') : hours.toFixed(1)}h`,
    summary: [
      episodes > 0 ? countLabel(episodes, 'ep') : null,
      movies > 0 ? countLabel(movies, 'movie') : null,
      countLabel(activeDays(minutes), 'active day'),
    ].filter(Boolean).join(' · '),
    days: minutes.map((value, i) => ({
      height: top > 0 ? (value / top) * 100 : 0,
      peak: top > 0 && i === peak,
      title: `${dayLabel(first + i)}: ${formatRuntime(value)}`,
    })),
    chartLabel: top > 0
      ? `Time watched per day for the last 30 days. Busiest: ${dayLabel(first + peak)}, ${formatRuntime(top)}.`
      : 'Nothing watched in the last 30 days.',
    allTime: {
      time: longRuntime(stats.episodes.minutes + stats.movies.minutes),
      episodes: countLabel(stats.episodes.watched, 'ep'),
      movies: countLabel(stats.movies.watched, 'movie'),
    },
  };
}

/**
 * Hours watched in the last 30 days as one big number, the daily rhythm as bars, all time in the footer. Scores on
 * hours (80 is a lot), active days and how recent the last play was.
 */
export const watchTimeBox = defineProfileBox({
  key: 'watch-time',
  group: 'numbers',
  floor: true,
  component: WatchTimeBox,
  score: (input) => {
    const { minutes } = thirtyDays(input);
    const hours = total(minutes) / 60;
    if (hours === 0 && input.stats.episodes.plays + input.stats.movies.plays === 0) return null;
    const since = sinceLastPlay(input);
    return 100 * (
      0.5 * boxMath.cap(hours, 80) +
      0.3 * boxMath.cap(activeDays(minutes), DAYS) +
      0.2 * (since === null ? 0 : boxMath.fresh(since, 7))
    );
  },
  view: toView,
});
