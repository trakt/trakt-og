import type { UserStats } from '../stats/userStatsSchema.ts';
import { formatRuntime } from '../utils/formatRuntime.ts';
import type { PanelCount, PanelTime, StatsPanel } from './StatsPanel.ts';

type Progress = NonNullable<UserStats['progress']>;

const MINUTES_PER_DAY = 1440;

const exact = (n: number) => n.toLocaleString('en-US');
const count = (n: number, word: string): PanelCount => ({ text: exact(n), word: n === 1 ? word : `${word}s` });

/** OG's `humanize_minutes` in parts, so the units can sit smaller than the numbers. */
const time = (minutes: number): PanelTime => ({
  parts: formatRuntime(minutes)
    .split(' ')
    .map((part) => ({ value: part.slice(0, -1), unit: part.slice(-1) })),
  spoken: formatRuntime(minutes, { short: false }),
});

function allTime(stats: UserStats) {
  const minutes = stats.total_minutes;
  const days = minutes / MINUTES_PER_DAY;
  const [value, unit] =
    days >= 365
      ? [(days / 365).toFixed(1), 'year']
      : days >= 1
        ? [String(Math.round(days)), 'day']
        : [String(Math.round(minutes / 60)), 'hour'];
  return {
    value,
    unit: value === '1' ? unit : `${unit}s`,
    spoken: formatRuntime(minutes, { short: false }),
    plays: count(stats.total_plays, 'play'),
  };
}

const share = (part: number, whole: number) => (part / whole) * 100;

function meter({ finished, started, dropped }: Progress) {
  const total = finished + started + dropped;
  if (total === 0) return null;
  return { finished: share(finished, total), started: share(started, total), dropped: share(dropped, total) };
}

function finished(progress: Progress | null, watched: number) {
  if (!progress) return null;
  return {
    finished: exact(progress.finished),
    watched: exact(watched),
    started: { text: exact(progress.started), word: 'in progress' },
    dropped: { text: exact(progress.dropped), word: 'dropped' },
    meter: meter(progress),
  };
}

/**
 * The dashboard greeting's stats panel: the all-time total with its plays, the shows finished, then what was watched
 * of shows and of movies, each with its watch time, plays and watched count, as OG's dashboard band counted them.
 */
export function toStatsPanel(stats: UserStats): StatsPanel {
  return {
    allTime: allTime(stats),
    finished: finished(stats.progress, stats.shows.watched),
    shows: {
      time: time(stats.episodes.minutes),
      plays: count(stats.episodes.plays, 'play'),
      episodes: count(stats.episodes.watched, 'episode'),
      shows: count(stats.shows.watched, 'show'),
    },
    movies: {
      time: time(stats.movies.minutes),
      plays: count(stats.movies.plays, 'play'),
      movies: count(stats.movies.watched, 'movie'),
    },
  };
}
