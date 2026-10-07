import { type Teaser, teasers } from './teasers.ts';

interface NextTeaserParams {
  /** The design the visitor saw last time, from a cookie that may hold anything. */
  previous: string | undefined;
  /** A number in [0, 1), Math.random() in production. */
  roll: number;
}

/** Picks a design at random, never the one shown last, so every refresh looks different. */
export function toNextTeaser({ previous, roll }: NextTeaserParams): Teaser {
  const candidates = teasers.filter((teaser) => teaser !== previous);
  const index = Math.min(Math.floor(roll * candidates.length), candidates.length - 1);
  return candidates.at(Math.max(index, 0)) ?? teasers[0];
}
