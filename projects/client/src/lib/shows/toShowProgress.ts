import type { EpisodeResponse } from '@trakt/api';
import { episodeNumber } from '../components/media/episodeTags.ts';
import type { DatePreferences } from '../settings/DatePreferences.ts';
import { episodeReleasedAt } from './episodeReleasedAt.ts';
import { isEpisodeWatchable } from './isEpisodeWatchable.ts';
import { type EpisodeCardContext, toEpisodeCard } from './toEpisodeCard.ts';
import type { EpisodeCard } from './toShowSummary.ts';

/** What the page keeps for the browser to put the viewer's progress on: the cards around Up Next. */
export type ShowProgressBase = {
  context: EpisodeCardContext;
  /** The next episode to air. */
  upcoming?: EpisodeCard;
  /** The latest three aired, newest first. Up Next leaves one out and the page shows two. */
  aired: readonly EpisodeCard[];
};

/** The viewer's progress on a show: its next episode (null when they're caught up) and the last one watched. */
export type ShowProgress = {
  readonly next_episode?: EpisodeResponse | null;
  readonly last_episode?: EpisodeResponse | null;
};

type Params = {
  base: ShowProgressBase;
  progress: ShowProgress;
  datePreferences: DatePreferences;
  now: Date;
};

/**
 * What a show page adds once the viewer's progress is in: Up Next first when there is a next episode to watch (else
 * the next to air), the aired episodes without it, the last episode watched for a dropped show's stamp, and the
 * check-in once the next episode is out. Specials and episodes without an air date can't be Up Next, like OG's.
 */
export function toShowProgress({ base, progress, datePreferences, now }: Params) {
  const { next_episode: watchNext, last_episode: last } = progress;
  const listed = watchNext && watchNext.season > 0 && watchNext.number > 0 && episodeReleasedAt(watchNext);
  const next = listed
    ? toEpisodeCard({ episode: watchNext, context: base.context, datePreferences, now })
    : base.upcoming;

  return {
    recent: {
      upNext: true,
      next,
      aired: base.aired.filter(({ id }) => id !== next?.id).slice(0, next ? 2 : 3),
    },
    lastSeen: last ? episodeNumber(last, base.context.genres) : undefined,
    checkin:
      watchNext && isEpisodeWatchable(episodeReleasedAt(watchNext), now.getTime())
        ? { type: 'episode' as const, id: watchNext.ids.trakt }
        : undefined,
  };
}
