import type { StripCount } from './StripCount.ts';

/** Which icon and color a count takes on the ratings strip. */
export type StripStatKind = 'watchers' | 'plays' | 'libraries' | 'lists' | 'comments' | 'favorited';

/** A count as the strip shows it: an icon and the short number, with the exact count in its tooltip. */
export interface StripStat extends StripCount {
  readonly kind: StripStatKind;
  /** The tooltip's number: the exact count ("131,457"), before its label. */
  readonly detail: string;
}

export interface StripStats {
  /** Favorites sit right after the Rate button. */
  readonly favorited?: StripStat;
  /** The rest, after the other sites' ratings: watchers, plays, libraries, lists, comments. */
  readonly community: readonly StripStat[];
}

const KINDS: Readonly<Record<string, StripStatKind>> = {
  watcher: 'watchers',
  watchers: 'watchers',
  play: 'plays',
  plays: 'plays',
  library: 'libraries',
  libraries: 'libraries',
  list: 'lists',
  lists: 'lists',
  comment: 'comments',
  comments: 'comments',
  favorited: 'favorited',
};

const ORDER: readonly StripStatKind[] = ['watchers', 'plays', 'libraries', 'lists', 'comments'];

/**
 * The summary pages label their counts in OG's words ("watcher" or "watchers"); this reads the kind from that label,
 * drops zeros and labels it doesn't know, and puts favorites apart from the rest, which come in strip order.
 */
export function stripStats(counts: readonly StripCount[]): StripStats {
  const stats = counts
    .filter(({ count, label }) => count > 0 && label in KINDS)
    .map(
      (count): StripStat => ({
        ...count,
        kind: KINDS[count.label] ?? 'watchers',
        detail: count.count.toLocaleString('en-US'),
      }),
    );

  return {
    favorited: stats.find(({ kind }) => kind === 'favorited'),
    community: ORDER.flatMap((kind) => stats.filter((stat) => stat.kind === kind)),
  };
}
