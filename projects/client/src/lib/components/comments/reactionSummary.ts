import type { ReactionsSummaryResponse } from '@trakt/api';
import { readableStat } from '../../utils/readableStat.ts';

import { reactionOptions } from './reactionOptions.ts';

type ReactionType = typeof reactionOptions[number]['type'];

export type ReactionSummary = {
  readonly reactions: readonly {
    readonly type: ReactionType;
    readonly emoji: string;
    /** OG's readable stat: "4", "1.2k". */
    readonly count: string;
    /** "1,234 Like reactions", for screen readers. */
    readonly label: string;
  }[];
  /** "1,234 reactions", for screen readers. */
  readonly total: string;
};

const counted = (count: number, noun: string) => `${count.toLocaleString('en-US')} ${noun}${count === 1 ? '' : 's'}`;

/** Each reaction type that has any, in OG's order, with its own count. */
export function reactionSummary(summary: ReactionsSummaryResponse | undefined): ReactionSummary | undefined {
  if (!summary || summary.reaction_count <= 0) return undefined;

  const reactions = reactionOptions
    .map(({ type, emoji, label }) => ({ type, emoji, label, count: summary.distribution[type] ?? 0 }))
    .filter(({ count }) => count > 0)
    .map(({ type, emoji, label, count }) => ({
      type,
      emoji,
      count: readableStat(count),
      label: counted(count, `${label} reaction`),
    }));
  return { reactions, total: counted(summary.reaction_count, 'reaction') };
}
