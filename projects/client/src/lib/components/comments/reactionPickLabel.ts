import type { ReactionCount } from './reactionSummary.ts';

/**
 * A summary emoji's name as a button: "Like (12), add your reaction", "remove your reaction" on the viewer's own, and
 * "switch your reaction" when they picked another kind.
 */
export function reactionPickLabel(reaction: Pick<ReactionCount, 'type' | 'label' | 'count'>, mine?: string): string {
  const action = reaction.type === mine ? 'remove your reaction' : mine ? 'switch your reaction' : 'add your reaction';
  return `${reaction.label} (${reaction.count.toLocaleString('en-US')}), ${action}`;
}
