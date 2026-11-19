import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { ratingShare } from '../../toProfileRatings.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import { fetchLatestTen } from '../fetchLatestTen.ts';
import { ratingDistribution } from '../../ratingDistribution.ts';
import RatingsBox from './RatingsBox.svelte';
import type { RatingsView } from './RatingsView.ts';

const MIN_RATINGS = 25;

function comments({ movies, shows, seasons, episodes }: BoxInput['stats']) {
  return movies.comments + shows.comments + seasons.comments + episodes.comments;
}

/** Ratings over watched titles, so a user who rates everything they finish gets full marks. */
const ratedShare = (stats: BoxInput['stats']) =>
  boxMath.cap(stats.ratings.total, Math.max(stats.shows.watched + stats.movies.watched, 1));

/** Scores how many ratings (1,000 is a lot), how much of what they watched they rate, and how much they comment. */
export const ratingsBox = defineProfileBox({
  key: 'ratings',
  group: 'numbers',
  fallback: true,
  component: RatingsBox,
  // The "latest 10" line. The box works without it.
  extra: { load: fetchLatestTen, when: ({ stats }) => stats.ratings.total >= MIN_RATINGS },
  score: ({ stats }) => {
    if (stats.ratings.total < MIN_RATINGS) return null;
    return (
      100 *
      (0.45 * boxMath.cap(stats.ratings.total, 1000) +
        0.35 * ratedShare(stats) +
        0.2 * boxMath.cap(comments(stats), 100))
    );
  },
  view: ({ stats }, latestTen): RatingsView | null => {
    const { counts, total, average, most, mostGiven } = ratingDistribution(stats.ratings.distribution);
    if (stats.ratings.total < MIN_RATINGS || total === 0) return null;
    return {
      total: `${stats.ratings.total.toLocaleString('en-US')} ${stats.ratings.total === 1 ? 'Rating' : 'Ratings'}`,
      average: average.toFixed(1),
      averageAt: ((average - 0.5) / 10) * 100,
      bars: counts.map((count, i) => ({
        height: (count / most) * 100,
        mode: i + 1 === mostGiven,
        tip:
          count > 0
            ? {
                count: count.toLocaleString('en-US'),
                noun: count === 1 ? 'rating' : 'ratings',
                share: `${ratingShare(count, total)} of all ratings`,
              }
            : null,
      })),
      chartLabel: `Ratings from 1 to 10, most often ${mostGiven}, averaging ${average.toFixed(1)}.`,
      latestTen: latestTen ? { text: latestTen.title, href: latestTen.href } : null,
    };
  },
});
