import { episodeNumber } from '../../../../components/media/episodeTags.ts';
import { imageUrl } from '../../../../utils/imageUrl.ts';
import type { BoxInput } from '../BoxInput.ts';
import { boxMath } from '../boxMath.ts';
import { defineProfileBox } from '../defineProfileBox.ts';
import { fetchRecentProgress } from '../fetchRecentProgress.ts';
import LastWatchedBox from './LastWatchedBox.svelte';
import type { LastWatchedView } from './LastWatchedView.ts';

type Progress = Awaited<ReturnType<typeof fetchRecentProgress>>;
type Latest = BoxInput['latest'];

type Newest =
  | { readonly kind: 'episode'; readonly row: NonNullable<Latest['episode']> }
  | { readonly kind: 'movie'; readonly row: NonNullable<Latest['movie']> };

/** The newer of the latest episode and movie play. */
function newest({ episode, movie }: Latest): Newest | null {
  if (episode && (!movie || episode.watched_at >= movie.watched_at)) return { kind: 'episode', row: episode };
  return movie ? { kind: 'movie', row: movie } : null;
}

const whenLabel = (days: number) => days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;

function progressOf(show: number, rows: Progress | undefined) {
  const row = rows?.find((candidate) => candidate.show.ids.trakt === show);
  if (!row || row.progress.aired === 0) return undefined;
  return { completed: Math.min(row.progress.completed, row.progress.aired), aired: row.progress.aired };
}

function toPlay(input: BoxInput, progress: Progress | undefined): LastWatchedView['play'] {
  const play = newest(input.latest);
  if (!play) return null;
  const when = whenLabel(boxMath.daysAgo(input.today, play.row.watched_at));

  if (play.kind === 'movie') {
    const { movie } = play.row;
    return {
      image: imageUrl(movie.images?.fanart?.at(0), 'thumb'),
      title: { text: movie.title, href: `/movies/${movie.ids.slug}` },
      subtitle: movie.year ? { text: String(movie.year) } : undefined,
      when,
    };
  }

  const { show, episode } = play.row;
  const showHref = `/shows/${show.ids.slug}`;
  return {
    image: imageUrl(show.images?.fanart?.at(0), 'thumb'),
    title: { text: show.title, href: showHref },
    subtitle: {
      text: [episodeNumber(episode, show.genres), episode.title].filter(Boolean).join(' '),
      href: `${showHref}/seasons/${episode.season}/episodes/${episode.number}`,
    },
    when,
    progress: progressOf(show.ids.trakt, progress),
  };
}

/**
 * The newest play over its fanart, with how long ago it was and, for a show, how far through it the user is. Scores
 * on recency alone: 80 for a play today, about 64 yesterday, under the bar after three days.
 */
export const lastWatchedBox = defineProfileBox({
  key: 'last-watched',
  group: 'image',
  floor: true,
  component: LastWatchedBox,
  // The progress bar's numbers. Only someone who has watched an episode can have one.
  extra: { load: fetchRecentProgress, when: ({ stats }) => stats.episodes.plays > 0 },
  score: ({ latest, today }) => {
    const play = newest(latest);
    return play ? 100 * (0.25 + 0.55 * boxMath.fresh(boxMath.daysAgo(today, play.row.watched_at), 2)) : null;
  },
  view: (input, progress): LastWatchedView => ({ play: toPlay(input, progress) }),
});
