import type { ReactionsSummaryResponse } from '@trakt/api';
import { readableStat } from '../../utils/readableStat.ts';

import { reactionOptions } from './reactionOptions.ts';

type ReactionType = typeof reactionOptions[number]['type'];

export type ReactionCount = {
  readonly type: ReactionType;
  readonly emoji: string;
  /** "Like". */
  readonly label: string;
  readonly count: number;
  /** OG's readable stat, "4" or "1.2k"; empty without any. */
  readonly text: string;
  /** "1,234 Like reactions", for screen readers. */
  readonly name: string;
};

export type ReactionSummary = {
  /** The three biggest reaction kinds, most first; ties keep OG's order. */
  readonly top: readonly ReactionCount[];
  /** How many more kinds have any, behind "+N". */
  readonly more: number;
  /** Every kind in OG's order, zeros too, for the breakdown. */
  readonly all: readonly ReactionCount[];
  /** "1,234 reactions". */
  readonly total: string;
};

const TOP = 3;

const counted = (count: number, noun: string) => `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;

/** The summary under a comment: its top three reaction kinds, and every kind's count for the breakdown. */
export function reactionSummary(summary: ReactionsSummaryResponse | undefined): ReactionSummary | undefined {
  if (!summary || summary.reaction_count <= 0) return undefined;

  const all = reactionOptions.map(({ type, emoji, label }) => {
    const count = summary.distribution[type] ?? 0;
    return {
      type,
      emoji,
      label,
      count,
      text: count > 0 ? readableStat(count) : '',
      name: counted(count, `${label} reaction`),
    };
  });
  // `toSorted` is stable, so equal counts stay in OG's order.
  const given = all.filter(({ count }) => count > 0).toSorted((a, b) => b.count - a.count);
  return {
    top: given.slice(0, TOP),
    more: Math.max(0, given.length - TOP),
    all,
    total: counted(summary.reaction_count, 'reaction'),
  };
}
