import type { OnDeckItem } from '../../components/media/OnDeckItem.ts';
import { episodeNumber } from '../../components/media/episodeTags.ts';
import { toEpisodeBadge } from '../../progress/toOnDeckItem.ts';
import { capitalize } from '../../utils/capitalize.ts';
import { imageUrl } from '../../utils/imageUrl.ts';
import type { ProgressItem } from './ProgressItem.ts';
import { tagged } from './toProgressRow.ts';

type ToProgressCardParams = {
  item: ProgressItem;
  /** The viewer's slug, for the progress link. */
  username: string;
  /** Simple progress bars: no ticks. */
  simple: boolean;
  now: Date;
};

/** Each aired episode's watched state once the catalog is in, else the watched share from the left. */
function toTicks({ detail, completed, aired }: ProgressItem): readonly boolean[] {
  const states = detail?.seasons.flatMap(({ episodes }) => episodes.map(({ done }) => done)) ?? [];
  if (states.length > 0) return states;
  return Array.from({ length: aired }, (_, i) => i < completed);
}

/**
 * OG's grid view card (`main/_on_deck_item`): the next aired episode, with the show's progress under it. A show with
 * nothing aired left is its own poster at 100%, labelled with its status when no episode is announced. Undefined while
 * episodes are left but the next one isn't known yet, which the show's catalog answers.
 */
export function toProgressCard({ item, username, simple, now }: ToProgressCardParams): OnDeckItem | undefined {
  const { show } = item;
  const next = item.next ?? item.detail?.next;
  const aired = next?.firstAired !== undefined && Date.parse(next.firstAired) <= now.getTime();
  const caughtUp = item.completed >= item.aired;
  if (!aired && !caughtUp) return undefined;

  const showHref = `/shows/${show.slug}`;
  const base = {
    showId: show.id,
    showTitle: show.title,
    showHref,
    poster: imageUrl(show.poster, 'thumb'),
    progressHref: `/users/${username}/progress?show=${show.id}`,
    progress: {
      aired: item.aired,
      completed: item.completed,
      plays: item.plays,
      minutesWatched: item.minutesWatched,
      minutesLeft: item.minutesLeft,
    },
    ticks: simple || item.aired === 0 ? undefined : toTicks(item),
    rewatching: Boolean(item.resetAt),
  };

  if (!next || !aired) {
    const { status } = show;
    const label = status === 'ended' || status === 'canceled' ? capitalize(status) : 'Returns next season!';
    return {
      ...base,
      episodeId: next?.id ?? 0,
      episodeHref: showHref,
      episodeNumber: '',
      runtime: show.runtime,
      complete: true,
      completionLabel: next ? undefined : label,
    };
  }

  return {
    ...base,
    episodeId: next.id,
    seasonNumber: next.season,
    episode: next.number,
    episodeHref: `${showHref}/seasons/${next.season}/episodes/${next.number}`,
    episodeNumber: episodeNumber(tagged(next), show.genres),
    episodeTitle: next.title,
    episodeBadge: toEpisodeBadge(tagged(next)),
    rating: next.rating,
    runtime: next.runtime ?? show.runtime,
  };
}
