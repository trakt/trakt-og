import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import BiggestBingeBox from './BiggestBingeBox.svelte';
import type { BiggestBingeView } from './BiggestBingeView.ts';

const DAY = 86_400_000;
const MIN_EPISODES = 4;

type Play = BoxInput['recent']['episodes'][number];

/** The most episodes of one show on one UTC day in the last 30 days. Ties go to the more recent day. */
function biggest({ recent }: BoxInput) {
  const days = Map.groupBy(recent.episodes, (play) => `${play.show.ids.trakt}:${boxMath.utcDay(play.watched_at)}`);
  return [...days.values()]
    .flatMap((plays) => plays[0] ? [{ plays, day: boxMath.utcDay(plays[0].watched_at) }] : [])
    .reduce<{ plays: readonly Play[]; day: number } | null>(
      (best, binge) =>
        !best || binge.plays.length > best.plays.length ||
          (binge.plays.length === best.plays.length && binge.day > best.day)
          ? binge
          : best,
      null,
    );
}

/** Scores the size of the binge (12 is a lot) and how recent it was. */
export const biggestBingeBox = defineProfileBox({
  key: 'biggest-binge',
  group: 'numbers',
  component: BiggestBingeBox,
  score: (input) => {
    const binge = biggest(input);
    if (!binge || binge.plays.length < MIN_EPISODES) return null;
    return 100 * (0.6 * boxMath.cap(binge.plays.length - 3, 9) + 0.4 * boxMath.fresh(input.today - binge.day, 10));
  },
  view: (input): BiggestBingeView | null => {
    const binge = biggest(input);
    const show = binge?.plays[0]?.show;
    if (!binge || !show || binge.plays.length < MIN_EPISODES) return null;
    return {
      episodes: binge.plays.length,
      show: { text: show.title, href: `/shows/${show.ids.slug}` },
      day: new Date(binge.day * DAY).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
    };
  },
});
