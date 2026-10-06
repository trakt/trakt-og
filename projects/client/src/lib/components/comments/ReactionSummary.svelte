<!--
  The reaction summary under a comment: each reaction type that has any as its emoji and its own count, in OG's
  order ("👍 4  😂 2  😱 1"). The viewer's own reaction sits on a soft chip. Screen readers hear the total, then
  "4 Like reactions" for each.
-->
<script lang="ts">
import type { reactionOptions } from './reactionOptions.ts';
import type { ReactionSummary } from './reactionSummary.ts';

interface Props {
  summary: ReactionSummary;
  /** The viewer's own reaction. */
  mine?: typeof reactionOptions[number]['type'];
}

const { summary, mine }: Props = $props();
</script>

<ul class="reaction-summary" aria-label={summary.total}>
  {#each summary.reactions as reaction (reaction.type)}
    {@const own = reaction.type === mine}
    <li class={['reaction', { own }]}>
      <span class="emoji" aria-hidden="true">{reaction.emoji}</span>
      <span class="count" aria-hidden="true">{reaction.count}</span>
      <span class="visually-hidden">{reaction.label}{own ? ', including yours' : ''}</span>
    </li>
  {/each}
</ul>

<style>
.reaction-summary {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--comment-reactions-gap);
  margin: 0;
  padding: 0;
  list-style: none;
}

.reaction {
  display: inline-flex;
  align-items: center;
  gap: var(--comment-reaction-count-gap);
  cursor: default;
}

/* The chip's padding hangs outside the item, so the viewer's reaction doesn't push the row. */
.own {
  margin-inline: calc(-1 * var(--comment-reaction-own-padding-inline));
  padding-inline: var(--comment-reaction-own-padding-inline);
  border-radius: var(--radius-comment-reaction-own);
  background-color: var(--color-comment-chip);
  color: var(--color-text);
}

.emoji {
  font-size: var(--font-size-comment-reaction-emoji);
  line-height: 1;
  translate: 0 var(--comment-reaction-emoji-shift);
}

.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
</style>
