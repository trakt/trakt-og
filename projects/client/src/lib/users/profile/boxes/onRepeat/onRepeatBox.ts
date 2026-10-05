import { imageUrl } from '../../../../utils/imageUrl.ts';
import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import OnRepeatBox from './OnRepeatBox.svelte';
import type { OnRepeatView } from './OnRepeatView.ts';

type Row = BoxInput['watched']['movies'][number];

/**
 * How many times a title was watched: a movie's plays, or a show's plays over its aired episodes. The watched list has
 * no per-season detail, so for a show it's an estimate.
 */
function timesOf(row: Row) {
  if ('movie' in row) return row.plays;
  const aired = row.show.aired_episodes ?? 0;
  return aired > 0 ? Math.floor(row.plays / aired) : 0;
}

/** The most rewatched title: a movie seen 3 or more times, or a show watched through twice. Ties go to the newer. */
function mostRewatched({ watched }: BoxInput) {
  const rewatched = [...watched.movies, ...watched.shows]
    .map((row) => ({ row, times: timesOf(row) }))
    .filter(({ row, times }) => times >= ('movie' in row ? 3 : 2))
    .toSorted((a, b) => b.times - a.times || b.row.last_watched_at.localeCompare(a.row.last_watched_at));
  const best = rewatched.at(0);
  return best ? { ...best, others: rewatched.length - 1 } : null;
}

const shortDate = (at: string) =>
  new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** The show's fanart isn't in the watched list; the newest episode play has it when it's the same show. */
function showFanart({ latest }: BoxInput, trakt: number) {
  const show = latest.episode?.show;
  return show?.ids.trakt === trakt ? imageUrl(show.images?.fanart?.at(0), 'thumb') : undefined;
}

/** Scores how many times (10 is a lot), how many other rewatches, and how recently. */
export const onRepeatBox = defineProfileBox({
  key: 'on-repeat',
  group: 'image',
  component: OnRepeatBox,
  score: (input) => {
    const best = mostRewatched(input);
    if (!best) return null;
    const days = boxMath.daysAgo(input.today, best.row.last_watched_at);
    return 100 * (
      0.5 * boxMath.cap(best.times - 2, 8) + 0.2 * boxMath.cap(best.others, 15) + 0.3 * boxMath.fresh(days, 60)
    );
  },
  view: (input): OnRepeatView | null => {
    const best = mostRewatched(input);
    if (!best) return null;
    const { row, times, others } = best;
    const common = { times, others: others > 0 ? `+${others.toLocaleString('en-US')} more rewatched` : null };
    if ('movie' in row) {
      return {
        ...common,
        image: imageUrl(row.movie.images?.fanart?.at(0), 'thumb'),
        title: { text: row.movie.title, href: `/movies/${row.movie.ids.slug}` },
        line: `Seen ${times} times · last on ${shortDate(row.last_watched_at)}`,
      };
    }
    return {
      ...common,
      image: showFanart(input, row.show.ids.trakt),
      title: { text: row.show.title, href: `/shows/${row.show.ids.slug}` },
      line: `${times} full runs · and counting`,
    };
  },
});
