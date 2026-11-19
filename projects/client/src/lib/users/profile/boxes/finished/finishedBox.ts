import { boxMath } from '../boxMath.ts';
import type { BoxInput } from '../BoxInput.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import { fetchRecentProgress } from '../fetchRecentProgress.ts';
import FinishedBox from './FinishedBox.svelte';
import type { FinishedView } from './FinishedView.ts';

type Progress = Awaited<ReturnType<typeof fetchRecentProgress>>;

const MIN_FINISHED = 5;

/**
 * The finished shows among the ten most recently watched, newest first, with how many days ago each was finished.
 * ponytail: only ten rows, so "latest" misses anything finished before ten other shows were watched.
 */
function recentlyFinished(today: number, rows: Progress | undefined) {
  return (rows ?? []).flatMap(({ show, progress }) =>
    progress.aired > 0 && progress.completed >= progress.aired && progress.last_watched_at
      ? [{ show, days: boxMath.daysAgo(today, progress.last_watched_at) }]
      : [],
  );
}

/** Stats without `progress` finished nothing as far as the box can tell. */
const NO_PROGRESS = { finished: 0, started: 0, dropped: 0 };

const share = (part: number, whole: number) => (part / whole) * 100;

const daysLabel = (days: number) => (days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`);

/** Scores how many shows are finished (300 is a lot), the share of started ones, and how recent the last finish is. */
export const finishedBox = defineProfileBox({
  key: 'finished',
  group: 'colour',
  component: FinishedBox,
  extra: { load: fetchRecentProgress, when: ({ stats }) => (stats.progress?.finished ?? 0) >= MIN_FINISHED },
  score: ({ stats, today }: BoxInput, rows) => {
    const { finished, started } = stats.progress ?? NO_PROGRESS;
    if (finished < MIN_FINISHED) return null;
    const latest = recentlyFinished(today, rows).at(0);
    return (
      100 *
      (0.35 * boxMath.cap(finished, 300) +
        0.25 * boxMath.cap(finished, Math.max(started, 1)) +
        0.4 * (latest ? boxMath.fresh(latest.days, 14) : 0))
    );
  },
  view: ({ stats, today }, rows): FinishedView | null => {
    const { finished, started, dropped } = stats.progress ?? NO_PROGRESS;
    if (finished < MIN_FINISHED) return null;
    const latest = recentlyFinished(today, rows).at(0);
    const total = finished + started + dropped;
    return {
      finished: finished.toLocaleString('en-US'),
      watched: Math.max(stats.shows.watched, finished).toLocaleString('en-US'),
      inProgress: started,
      dropped,
      meter: total > 0 ? { finished: share(finished, total), inProgress: share(started, total) } : null,
      latest: latest
        ? {
            title: { text: latest.show.title, href: `/shows/${latest.show.ids.slug}` },
            when: daysLabel(latest.days),
          }
        : null,
    };
  },
});
