import type { CardTag } from '../components/media/CardTag.ts';
import type { RecentPlay } from './toRecentPlay.ts';

/** A Recently Watched play still running: a check-in, which history holds at its end time. */
export type Checkin = {
  /** The pulsing "Checked in", then the episode type, in place of the future date. */
  readonly tags: readonly CardTag[];
  /** How far in, 0 to 100. */
  readonly progress: number;
};

/** OG's `full_runtime` fallbacks when the API has none. */
const DEFAULT_RUNTIME = { movie: 90, episode: 42 } as const;

/** The play as a live check-in while `now` is before its watched time, else null. */
export function toCheckin(
  play: Pick<RecentPlay, 'type' | 'runtime' | 'tags' | 'watchedAt'>,
  now: Date,
): Checkin | null {
  const end = Date.parse(play.watchedAt);
  const at = now.getTime();
  if (!(end > at)) return null;

  const length = (play.runtime || DEFAULT_RUNTIME[play.type]) * 60_000;
  const start = end - length;
  return {
    tags: [{ text: 'Checked in', kind: 'primary', live: true }, ...play.tags.slice(0, -1)],
    progress: Math.round(Math.min(Math.max((at - start) / length, 0), 1) * 100),
  };
}
